import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getHeader(event, 'X-User-Id') || 'UNKNOWN';
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

  const newAuditLog = {
    id: `AUD-${Date.now()}`,
    action: `TAHAP_${stageKey}_SELESAI`,
    performed_at: ts,
    performed_by: userId,
    performed_by_name: userId,
    notes: body.notes || '',
  };

  const updatedAuditLogs = [...(existing.auditLogs || []), newAuditLog];

  const attachments = existing.attachments || [];
  if (body.attachment) {
    attachments.push({
      id: `ATT-${Date.now()}`,
      stage: body.attachment.stage || 'COMPLETION',
      visibility: body.attachment.visibility || 'USER_VISIBLE',
      file_name: body.attachment.file_name || '',
      file_size: body.attachment.file_size || '',
      uploaded_by: userId,
      uploaded_by_name: userId,
      uploaded_at: ts,
    });
  }

  let delegation = existing.delegation;
  if (body.delegation) {
    delegation = {
      type: body.delegation.type,
      vendor_id: body.delegation.vendor_id,
      vendor_name: body.delegation.vendor_name,
      technician_id: body.delegation.technician_id,
      technician_name: body.delegation.technician_name,
      reference_no: body.delegation.reference_no,
      notes: body.delegation.notes,
      delegated_at: ts,
    };
  }

  const newWorklogs = body.notes
    ? [...(existing.worklogs || []), {
        id: `WL-${Date.now()}`,
        stageKey,
        worker_id: userId,
        worker_name: userId,
        date: new Date().toISOString().split('T')[0],
        start_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        finish_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration_minutes: 0,
        description: body.notes,
        created_at: ts,
      }]
    : existing.worklogs || [];

  await db.update(tickets).set({
    status: newStatus,
    assignedTo,
    assignedToName,
    completedAt,
    auditLogs: updatedAuditLogs,
    attachments,
    worklogs: newWorklogs,
    delegation,
  }).where(eq(tickets.id, id)).execute();

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

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
