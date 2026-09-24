import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs, auditLogs, attachments } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { isValidTransition, getTargetStatus } from '~/server/utils/ticket-lifecycle';
import { fileStorage } from '~/server/services/storage';
import { parseMultipart, cleanupTempFiles, sanitizeFilename } from '~/server/utils/upload';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

function isMultipart(req: any): boolean {
  const ct = req.headers['content-type'] || '';
  return ct.includes('multipart/form-data');
}

async function uploadFiles(
  files: { originalFilename: string; size: number; filepath: string }[],
  ticketId: string,
  stage: string,
  visibility: string,
  userId: string,
  ts: string,
): Promise<void> {
  const uploadBase = process.env.UPLOAD_DIR || './server/uploads';
  const safeId = ticketId.replace(/[^a-zA-Z0-9-_]/g, '_');

  for (const file of files) {
    const ext = path.extname(file.originalFilename || 'file');
    const fileName = sanitizeFilename(file.originalFilename || `file${ext}`);
    const filePath = path.join('uploads', safeId, `${Date.now()}_${fileName}`);

    const fileData = await fs.readFile(file.filepath);
    const uploaded = await fileStorage.upload(
      { name: fileName, size: file.size, data: fileData },
      filePath,
    );

    const attachId = `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(attachments).values({
      id: attachId,
      ticketId,
      stage,
      visibility: visibility as any,
      fileName,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      filePath: uploaded.url,
      uploadedBy: userId,
      uploadedAt: ts,
    }).execute();
  }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const user = getCurrentUser(event);
  const req = event.node.req;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  let stageKey = 'IN_PROGRESS';
  let notes = '';
  let targetStatus: string | undefined;
  let stageVisibility = 'USER_VISIBLE';
  let delegation: any = null;
  let files: { originalFilename: string; size: number; filepath: string }[] = [];

  if (isMultipart(req)) {
    const uploadBase = process.env.UPLOAD_DIR || './server/uploads';
    const parsed = await parseMultipart(req, uploadBase);
    stageKey = parsed.fields.stageKey || 'IN_PROGRESS';
    notes = parsed.fields.notes || '';
    targetStatus = parsed.fields.targetStatus || undefined;
    stageVisibility = parsed.fields.visibility || 'USER_VISIBLE';
    files = parsed.files;

    if (parsed.fields.delegation) {
      try { delegation = JSON.parse(parsed.fields.delegation); } catch {}
    }
  } else {
    const body = await readBody(event);
    stageKey = body.stageKey || 'IN_PROGRESS';
    notes = body.notes || '';
    targetStatus = body.targetStatus;
    stageVisibility = body.attachment?.visibility || 'USER_VISIBLE';
    delegation = body.delegation;

    if (body.attachment?.file_path) {
      files = [{
        originalFilename: body.attachment.file_name || 'file',
        size: 0,
        filepath: '',
      }];
    }
  }

  const finalTargetStatus = targetStatus || getTargetStatus(stageKey);

  if (!isValidTransition(existing.status, finalTargetStatus)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot transition from ${existing.status} to ${finalTargetStatus}. Gunakan tombol "Kirim" untuk menambah catatan tanpa mengubah status.`,
    });
  }

  const ts = now();

  let newStatus = finalTargetStatus;
  let completedAt = existing.completedAt;
  let assignedTo = existing.assignedTo;
  let assignedToName = existing.assignedToName;
  let issuedAt = existing.issuedAt;
  let processStartedAt = existing.processStartedAt;

  if (stageKey === 'START_WORK') {
    processStartedAt = existing.processStartedAt || ts;
    issuedAt = existing.issuedAt || ts;
  } else if (stageKey === 'IN_PROGRESS') {
    completedAt = ts;
  } else if (stageKey === 'COMPLETION') {
    if (finalTargetStatus === 'SELESAI') completedAt = ts;
  }

  await db.update(tickets).set({
    status: newStatus,
    assignedTo,
    assignedToName,
    completedAt,
    issuedAt,
    processStartedAt,
    delegationType: delegation?.type || existing.delegationType,
    vendorId: delegation?.vendor_id || existing.vendorId,
    vendorName: delegation?.vendor_name || existing.vendorName,
    technicianId: delegation?.technician_id || existing.technicianId,
    technicianName: delegation?.technician_name || existing.technicianName,
    referenceNo: delegation?.reference_no || existing.referenceNo,
    delegationNotes: delegation?.notes || existing.delegationNotes,
    delegatedAt: delegation ? ts : existing.delegatedAt,
  }).where(eq(tickets.id, id)).execute();

  await db.insert(auditLogs).values({
    id: `AUD-${Date.now()}`,
    ticketId: id,
    action: `TAHAP_${stageKey}_SELESAI`,
    performedAt: ts,
    performedBy: userId,
    performedByName: user?.name || userId,
    notes: notes || '',
  }).execute();

  if (notes) {
    await db.insert(worklogs).values({
      id: `WL-${Date.now()}`,
      ticketId: id,
      stageKey,
      workerId: userId,
      workerName: user?.name || userId,
      date: new Date().toISOString().split('T')[0],
      startAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      finishAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      durationMinutes: 0,
      description: notes,
      createdAt: ts,
    }).execute();
  }

  try {
    if (files.length > 0 && files[0].filepath) {
      await uploadFiles(files, id, stageKey, stageVisibility, userId, ts);
    }
  } finally {
    if (files.length > 0 && files[0].filepath) {
      await cleanupTempFiles(files);
    }
  }

  const result = await getTicketById(id);
  return successResponse(result);
});
