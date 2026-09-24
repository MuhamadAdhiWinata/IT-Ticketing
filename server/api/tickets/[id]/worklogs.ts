import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs, attachments } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { fileStorage } from '~/server/services/storage';
import { parseMultipart, cleanupTempFiles, sanitizeFilename } from '~/server/utils/upload';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

function isMultipart(req: any): boolean {
  const ct = req.headers['content-type'] || '';
  return ct.includes('multipart/form-data');
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const user = getCurrentUser(event);
  const req = event.node.req;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  let stageKey = 'IN_PROGRESS';
  let description = '';
  let stageVisibility = 'USER_VISIBLE';
  let files: { originalFilename: string; size: number; filepath: string }[] = [];

  if (isMultipart(req)) {
    const uploadBase = process.env.UPLOAD_DIR || './server/uploads';
    const parsed = await parseMultipart(req, uploadBase);
    stageKey = parsed.fields.stageKey || 'IN_PROGRESS';
    description = parsed.fields.description || '';
    stageVisibility = parsed.fields.visibility || 'USER_VISIBLE';
    files = parsed.files;

    try {
      const ts = now();
      const wlId = `WL-${Date.now()}`;

      await db.insert(worklogs).values({
        id: wlId,
        ticketId: id,
        stageKey,
        workerId: userId || 'system',
        workerName: user?.name || userId || 'system',
        date: new Date().toISOString().split('T')[0],
        startAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        finishAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        durationMinutes: 0,
        description,
        createdAt: ts,
      }).execute();

      const uploadBase2 = process.env.UPLOAD_DIR || './server/uploads';
      const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '_');

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
          ticketId: id,
          stage: stageKey,
          visibility: stageVisibility as any,
          fileName,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          filePath: uploaded.url,
          uploadedBy: userId || 'system',
          uploadedAt: ts,
        }).execute();
      }
    } finally {
      await cleanupTempFiles(files);
    }
  } else {
    const body = await readBody(event);
    stageKey = body.stageKey || 'IN_PROGRESS';
    description = body.description || '';

    const ts = now();
    const wlId = `WL-${Date.now()}`;

    await db.insert(worklogs).values({
      id: wlId,
      ticketId: id,
      stageKey,
      workerId: userId || 'system',
      workerName: user?.name || userId || 'system',
      date: new Date().toISOString().split('T')[0],
      startAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      finishAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      durationMinutes: 0,
      description,
      createdAt: ts,
    }).execute();

    if (body.attachment?.file_path) {
      const attachId = `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(attachments).values({
        id: attachId,
        ticketId: id,
        stage: body.attachment.stage || stageKey,
        visibility: body.attachment.visibility || 'USER_VISIBLE',
        fileName: body.attachment.file_name || '',
        fileSize: body.attachment.file_size || '',
        filePath: body.attachment.file_path,
        uploadedBy: userId || 'system',
        uploadedAt: ts,
      }).execute();
    }
  }

  const result = await getTicketById(id);
  return successResponse(result);
});
