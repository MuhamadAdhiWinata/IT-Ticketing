import { db } from '~/server/database/client';
import { tickets, worklogs, comments, internalNotes, auditLogs, attachments } from '~/server/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { serializeTicket, serializeWorklog, serializeComment, serializeNote, serializeAuditLog, serializeAttachment } from './serialize';

export async function getTicketsWithRelations(whereClause?: any) {
  const ticketsQuery = db.query.tickets.findMany({
    where: whereClause,
  });

  const ticketsList = await ticketsQuery;
  if (ticketsList.length === 0) return [];

  const ticketIds = ticketsList.map(t => t.id);

  const [worklogsList, commentsList, internalNotesList, auditLogsList, attachmentsList] = await Promise.all([
    db.query.worklogs.findMany({
      where: (w, { inArray: i }) => i(w.ticketId, ticketIds),
    }),
    db.query.comments.findMany({
      where: (c, { inArray: i }) => i(c.ticketId, ticketIds),
    }),
    db.query.internalNotes.findMany({
      where: (n, { inArray: i }) => i(n.ticketId, ticketIds),
    }),
    db.query.auditLogs.findMany({
      where: (a, { inArray: i }) => i(a.ticketId, ticketIds),
    }),
    db.query.attachments.findMany({
      where: (a, { inArray: i }) => i(a.ticketId, ticketIds),
    }),
  ]);

  return ticketsList.map(ticket => {
    const ticketData = serializeTicket({
      ...ticket,
      worklogs: worklogsList.filter(w => w.ticketId === ticket.id).map(serializeWorklog),
      comments: commentsList.filter(c => c.ticketId === ticket.id).map(serializeComment),
      internal_notes: internalNotesList.filter(n => n.ticketId === ticket.id).map(serializeNote),
      audit_logs: auditLogsList.filter(a => a.ticketId === ticket.id).map(serializeAuditLog),
      attachments: attachmentsList.filter(a => a.ticketId === ticket.id).map(serializeAttachment),
    });
    return ticketData;
  });
}

export async function getTicketById(ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, ticketId),
  });

  if (!ticket) return null;

  const [worklogsList, commentsList, internalNotesList, auditLogsList, attachmentsList] = await Promise.all([
    db.query.worklogs.findMany({ where: (w, { eq: e }) => e(w.ticketId, ticketId) }),
    db.query.comments.findMany({ where: (c, { eq: e }) => e(c.ticketId, ticketId) }),
    db.query.internalNotes.findMany({ where: (n, { eq: e }) => e(n.ticketId, ticketId) }),
    db.query.auditLogs.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
    db.query.attachments.findMany({ where: (a, { eq: e }) => e(a.ticketId, ticketId) }),
  ]);

  return serializeTicket({
    ...ticket,
    worklogs: worklogsList.map(serializeWorklog),
    comments: commentsList.map(serializeComment),
    internal_notes: internalNotesList.map(serializeNote),
    audit_logs: auditLogsList.map(serializeAuditLog),
    attachments: attachmentsList.map(serializeAttachment),
  });
}
