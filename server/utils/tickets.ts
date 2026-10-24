import { db } from '~/server/database/client';
import { tickets, worklogs, auditLogs, attachments, categories } from '~/server/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { serializeTicket } from './serialize';
import { loadOrgMaps, resolveCompanyOf, resolveDivisionOf } from './org';
import { calculateSLADeadline, isSLABreached } from './sla';

export interface ResolvedUser {
  name: string;
  companyName: string;
  divisionName: string;
}

async function resolveUserNames(userIds: Array<string | null | undefined>): Promise<Map<string, ResolvedUser>> {
  if (userIds.length === 0) return new Map();
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await db.query.users.findMany({
    where: (u, { inArray: i }) => i(u.id, uniqueIds),
  });
  const maps = await loadOrgMaps(
    rows.map(r => r.companyId),
    rows.map(r => r.divisionId),
  );
  const map = new Map<string, ResolvedUser>();
  for (const r of rows) {
    map.set(r.id, {
      name: r.name,
      companyName: resolveCompanyOf(r, maps) || '',
      divisionName: resolveDivisionOf(r, maps) || '',
    });
  }
  return map;
}

export async function getTicketsWithRelations(whereClause?: any) {
  const ticketsList = await db.query.tickets.findMany({ where: whereClause });
  if (ticketsList.length === 0) return [];

  const ticketIds = ticketsList.map(t => t.id);
  const categoryNames = [...new Set(ticketsList.map(t => t.category))];

  const [worklogsList, auditLogsList, attachmentsList, membersList, categoriesList] = await Promise.all([
    db.query.worklogs.findMany({ where: (w, { inArray: i }) => i(w.ticketId, ticketIds) }),
    db.query.auditLogs.findMany({ where: (a, { inArray: i }) => i(a.ticketId, ticketIds) }),
    db.query.attachments.findMany({ where: (a, { inArray: i }) => i(a.ticketId, ticketIds) }),
    db.query.ticketMembers.findMany({ where: (m, { inArray: i }) => i(m.ticketId, ticketIds) }),
    db.query.categories.findMany({ where: (c, { inArray: i }) => i(c.name, categoryNames) }),
  ]);
  const catMap = new Map(categoriesList.map(c => [c.name, c]));

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

  return ticketsList.map(ticket => {
    const cat = catMap.get(ticket.category);
    const slaDeadline = cat ? calculateSLADeadline(ticket.createdAt, ticket.priority as any, cat) : null;
    return serializeTicket({
      ...ticket,
      slaDeadline,
      isSLABreached: slaDeadline ? isSLABreached(slaDeadline) : false,
      worklogs: worklogsList.filter(w => w.ticketId === ticket.id).map(w => ({ ...w, workerName: userMap.get(w.workerId)?.name || '' })),
      auditLogs: auditLogsList.filter(a => a.ticketId === ticket.id).map(a => ({ ...a, performedByName: userMap.get(a.performedBy)?.name || '' })),
      attachments: attachmentsList.filter(a => a.ticketId === ticket.id).map(a => ({ ...a, uploadedByName: userMap.get(a.uploadedBy)?.name || '' })),
      members: membersList.filter(m => m.ticketId === ticket.id).map(m => ({ ...m, userName: userMap.get(m.userId)?.name || '' })),
      creator: userMap.get(ticket.createdBy) || { name: '' },
      requester: userMap.get(ticket.requestedBy) || { name: '' },
      assignee: ticket.assignedTo ? (userMap.get(ticket.assignedTo) || { name: '' }) : null,
    });
  });
}

export async function getTicketById(ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, ticketId),
  });
  if (!ticket) return null;

  const [worklogsList, auditLogsList, attachmentsList, membersList, cat] = await Promise.all([
    db.query.worklogs.findMany({ where: (w, { eq: e }) => e(w.ticketId, ticketId) }),
    db.query.auditLogs.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
    db.query.attachments.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
    db.query.ticketMembers.findMany({ where: (m, { eq: e }) => e(m.ticketId, ticketId) }),
    db.query.categories.findFirst({ where: (c, { eq: e }) => e(c.name, ticket.category) }),
  ]);

  const slaDeadline = cat ? calculateSLADeadline(ticket.createdAt, ticket.priority as any, cat) : null;

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
    slaDeadline,
    isSLABreached: slaDeadline ? isSLABreached(slaDeadline) : false,
    worklogs: worklogsList.map(w => ({ ...w, workerName: userMap.get(w.workerId)?.name || '' })),
    auditLogs: auditLogsList.map(a => ({ ...a, performedByName: userMap.get(a.performedBy)?.name || '' })),
    attachments: attachmentsList.map(a => ({ ...a, uploadedByName: userMap.get(a.uploadedBy)?.name || '' })),
    members: membersList.map(m => ({ ...m, userName: userMap.get(m.userId)?.name || '' })),
    creator: userMap.get(ticket.createdBy) || { name: '' },
    requester: userMap.get(ticket.requestedBy) || { name: '' },
    assignee: ticket.assignedTo ? (userMap.get(ticket.assignedTo) || { name: '' }) : null,
  });
}
