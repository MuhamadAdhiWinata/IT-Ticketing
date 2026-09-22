import { getCurrentUserId } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs, auditLogs, attachments } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  const ts = now();
  const stageKey = body.stageKey || 'IN_PROGRESS';
  const targetStatus = body.targetStatus || getTargetStatus(stageKey);

  let newStatus = targetStatus;
  let completedAt = existing.completedAt;
  let assignedTo = existing.assignedTo;
  let assignedToName = existing.assignedToName;

  if (stageKey === 'ASSIGN') {
    newStatus = targetStatus || 'PROCESS';
    if (!assignedTo && userId !== 'USER_NON_IT') {
      assignedTo = userId;
      assignedToName = userId;
    }
  } else if (stageKey === 'IN_PROGRESS') {
    newStatus = targetStatus || 'SELESAI';
    completedAt = ts;
  } else if (stageKey === 'COMPLETION') {
    newStatus = targetStatus || 'SELESAI';
    if (targetStatus === 'SELESAI') completedAt = ts;
  } else if (stageKey === 'DELEGATION') {
    newStatus = targetStatus || 'DELEGASI';
  }

  // Update Ticket
  await db.update(tickets).set({
    status: newStatus,
    assignedTo,
    assignedToName,
    completedAt,
    delegationType: body.delegation?.type || existing.delegationType,
    vendorId: body.delegation?.vendor_id || existing.vendorId,
    vendorName: body.delegation?.vendor_name || existing.vendorName,
    technicianId: body.delegation?.technician_id || existing.technicianId,
    technicianName: body.delegation?.technician_name || existing.technicianName,
    referenceNo: body.delegation?.reference_no || existing.referenceNo,
    delegationNotes: body.delegation?.notes || existing.delegationNotes,
    delegatedAt: body.delegation ? ts : existing.delegatedAt,
  }).where(eq(tickets.id, id)).execute();

  // Insert Audit Log
  await db.insert(auditLogs).values({
    id: `AUD-${Date.now()}`,
    ticketId: id,
    action: `TAHAP_${stageKey}_SELESAI`,
    performedAt: ts,
    performedBy: userId,
    performedByName: userId,
    notes: body.notes || '',
  }).execute();

  // Insert Attachment if exists
  if (body.attachment) {
    await db.insert(attachments).values({
      id: `ATT-${Date.now()}`,
      ticketId: id,
      stage: body.attachment.stage || 'COMPLETION',
      visibility: body.attachment.visibility || 'USER_VISIBLE',
      fileName: body.attachment.file_name || '',
      fileSize: body.attachment.file_size || '',
      uploadedBy: userId,
      uploadedByName: userId,
      uploadedAt: ts,
    }).execute();
  }

  // Insert Worklog if notes exists
  if (body.notes) {
    await db.insert(worklogs).values({
      id: `WL-${Date.now()}`,
      ticketId: id,
      stageKey,
      workerId: userId,
      workerName: userId,
      date: new Date().toISOString().split('T')[0],
      startAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      finishAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      durationMinutes: 0,
      description: body.notes,
      createdAt: ts,
    }).execute();
  }

  const result = await getTicketById(id);

  return successResponse(result);
});

function getTargetStatus(stageKey: string): string {
  const map: Record<string, string> = {
    ASSIGN: 'PROCESS',
    IN_PROGRESS: 'SELESAI',
    COMPLETION: 'SELESAI',
    DELEGATION: 'DELEGASI',
  };
  return map[stageKey] || 'SELESAI';
}
