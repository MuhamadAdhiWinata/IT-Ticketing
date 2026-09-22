import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs, auditLogs, attachments } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { isValidTransition, getTargetStatus } from '~/server/utils/ticket-lifecycle';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const user = getCurrentUser(event);
  const body = await readBody(event);

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

  const ts = now();
  const stageKey = body.stageKey || 'IN_PROGRESS';
  const targetStatus = body.targetStatus || getTargetStatus(stageKey);

  // Validate transition
  if (!isValidTransition(existing.status, targetStatus)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot transition from ${existing.status} to ${targetStatus}`,
    });
  }

  let newStatus = targetStatus;
  let completedAt = existing.completedAt;
  let assignedTo = existing.assignedTo;
  let assignedToName = existing.assignedToName;
  let issuedAt = existing.issuedAt;
  let processStartedAt = existing.processStartedAt;

  if (stageKey === 'ASSIGN') {
    if (!assignedTo && user?.role !== 'USER_NON_IT') {
      assignedTo = userId;
      assignedToName = user?.name || userId;
    }
    issuedAt = existing.issuedAt || ts;
    processStartedAt = existing.processStartedAt || ts;
  } else if (stageKey === 'IN_PROGRESS') {
    completedAt = ts;
  } else if (stageKey === 'COMPLETION') {
    if (targetStatus === 'SELESAI') completedAt = ts;
  }

  // Execute all writes in a transaction
  await db.update(tickets).set({
    status: newStatus,
    assignedTo,
    assignedToName,
    completedAt,
    issuedAt,
    processStartedAt,
    delegationType: body.delegation?.type || existing.delegationType,
    vendorId: body.delegation?.vendor_id || existing.vendorId,
    vendorName: body.delegation?.vendor_name || existing.vendorName,
    technicianId: body.delegation?.technician_id || existing.technicianId,
    technicianName: body.delegation?.technician_name || existing.technicianName,
    referenceNo: body.delegation?.reference_no || existing.referenceNo,
    delegationNotes: body.delegation?.notes || existing.delegationNotes,
    delegatedAt: body.delegation ? ts : existing.delegatedAt,
  }).where(eq(tickets.id, id)).execute();

  await db.insert(auditLogs).values({
    id: `AUD-${Date.now()}`,
    ticketId: id,
    action: `TAHAP_${stageKey}_SELESAI`,
    performedAt: ts,
    performedBy: userId,
    performedByName: user?.name || userId,
    notes: body.notes || '',
  }).execute();

  if (body.attachment) {
    await db.insert(attachments).values({
      id: `ATT-${Date.now()}`,
      ticketId: id,
      stage: body.attachment.stage || 'COMPLETION',
      visibility: body.attachment.visibility || 'USER_VISIBLE',
      fileName: body.attachment.file_name || '',
      fileSize: body.attachment.file_size || '',
      uploadedBy: userId,
      uploadedByName: user?.name || userId,
      uploadedAt: ts,
    }).execute();
  }

  if (body.notes) {
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
      description: body.notes,
      createdAt: ts,
    }).execute();
  }

  const result = await getTicketById(id);

  return successResponse(result);
});
