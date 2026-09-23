import { db } from '~/server/database/client';
import { tickets, worklogs, auditLogs, attachments } from '~/server/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { serializeTicket } from './serialize';

async function resolveUserNames(userIds: string[]): Promise<Map<string, { name: string }>> {
  if (userIds.length === 0) return new Map();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await db.query.users.findMany({
    where: (u, { inArray: i }) => i(u.id, uniqueIds),
  });
  const map = new Map<string, { name: string }>();
  for (const r of rows) map.set(r.id, { name: r.name });
  return map;
}

export async function getTicketsWithRelations(whereClause?: any) {
  const ticketsList = await db.query.tickets.findMany({ where: whereClause });
  if (ticketsList.length === 0) return [];

  const ticketIds = ticketsList.map(t => t.id);

  const [worklogsList, auditLogsList, attachmentsList, membersList] = await Promise.all([
    db.query.worklogs.findMany({ where: (w, { inArray: i }) => i(w.ticketId, ticketIds) }),
    db.query.auditLogs.findMany({ where: (a, { inArray: i }) => i(a.ticketId, ticketIds) }),
    db.query.attachments.findMany({ where: (a, { inArray: i }) => i(a.ticketId, ticketIds) }),
    db.query.ticketMembers.findMany({ where: (m, { inArray: i }) => i(m.ticketId, ticketIds) }),
  ]);

  // Resolve user names
  const allUserIds = [
    ...ticketsList.map(t => t.createdBy),
    ...ticketsList.map(t => t.requestedBy),
    ...ticketsList.map(t => t.assignedTo),
    ...worklogsList.map(w => w.workerId),
    ...auditLogsList.map(a => a.performedBy),
    ...attachmentsList.map(a => a.uploadedBy),
    ...membersList.map(m => m.userId),
  ];
  const userMap = await resolveUserNames(allUserIds);

  return ticketsList.map(ticket => serializeTicket({
    ...ticket,
    worklogs: worklogsList.filter(w => w.ticketId === ticket.id).map(w => ({ ...w, workerName: userMap.get(w.workerId)?.name || '' })),
    auditLogs: auditLogsList.filter(a => a.ticketId === ticket.id).map(a => ({ ...a, performedByName: userMap.get(a.performedBy)?.name || '' })),
    attachments: attachmentsList.filter(a => a.ticketId === ticket.id).map(a => ({ ...a, uploadedByName: userMap.get(a.uploadedBy)?.name || '' })),
    members: membersList.filter(m => m.ticketId === ticket.id).map(m => ({ ...m, userName: userMap.get(m.userId)?.name || '' })),
    creator: { name: userMap.get(ticket.createdBy)?.name || '' },
    requester: { name: userMap.get(ticket.requestedBy)?.name || '' },
    assignee: ticket.assignedTo ? { name: userMap.get(ticket.assignedTo)?.name || '' } : null,
  }));
}

export async function getTicketById(ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, ticketId),
  });
  if (!ticket) return null;

  const [worklogsList, auditLogsList, attachmentsList, membersList] = await Promise.all([
    db.query.worklogs.findMany({ where: (w, { eq: e }) => e(w.ticketId, ticketId) }),
    db.query.auditLogs.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
    db.query.attachments.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
    db.query.ticketMembers.findMany({ where: (m, { eq: e }) => e(m.ticketId, ticketId) }),
  ]);

  const allUserIds = [
    ticket.createdBy,
    ticket.requestedBy,
    ticket.assignedTo,
    ...worklogsList.map(w => w.workerId),
    ...auditLogsList.map(a => a.performedBy),
    ...attachmentsList.map(a => a.uploadedBy),
    ...membersList.map(m => m.userId),
  ];
  const userMap = await resolveUserNames(allUserIds);

  return serializeTicket({
    ...ticket,
    worklogs: worklogsList.map(w => ({ ...w, workerName: userMap.get(w.workerId)?.name || '' })),
    auditLogs: auditLogsList.map(a => ({ ...a, performedByName: userMap.get(a.performedBy)?.name || '' })),
    attachments: attachmentsList.map(a => ({ ...a, uploadedByName: userMap.get(a.uploadedBy)?.name || '' })),
    members: membersList.map(m => ({ ...m, userName: userMap.get(m.userId)?.name || '' })),
    creator: { name: userMap.get(ticket.createdBy)?.name || '' },
    requester: { name: userMap.get(ticket.requestedBy)?.name || '' },
    assignee: ticket.assignedTo ? { name: userMap.get(ticket.assignedTo)?.name || '' } : null,
  });
}
