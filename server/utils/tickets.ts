import { db } from '~/server/database/client';
import { tickets, worklogs, comments, internalNotes, auditLogs, attachments, users } from '~/server/database/schema';
import { eq, sql, inArray } from 'drizzle-orm';

export async function getTicketsWithRelations(whereClause?: any) {
  // Fetch tickets with optional where clause
  const ticketsQuery = db.query.tickets.findMany({
    where: whereClause,
    with: {}, // No relations here
  });

  const ticketsList = await ticketsQuery;

  if (ticketsList.length === 0) return [];

  const ticketIds = ticketsList.map(t => t.id);

  // Fetch all related data in parallel
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

  // Merge relations into tickets
  return ticketsList.map(ticket => ({
    ...ticket,
    worklogs: worklogsList.filter(w => w.ticketId === ticket.id),
    comments: commentsList.filter(c => c.ticketId === ticket.id),
    internal_notes: internalNotesList.filter(n => n.ticketId === ticket.id),
    audit_logs: auditLogsList.filter(a => a.ticketId === ticket.id),
    attachments: attachmentsList.filter(a => a.ticketId === ticket.id),
  }));
}

export async function getTicketById(ticketId: string) {
  const ticket = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, ticketId),
  });

  if (!ticket) return null;

  const [worklogsList, commentsList, internalNotesList, auditLogsList, attachmentsList] = await Promise.all([
    db.query.worklogs.findMany({
      where: (w, { eq: e }) => e(w.ticketId, ticketId),
    }),
    db.query.comments.findMany({
      where: (c, { eq: e }) => e(c.ticketId, ticketId),
    }),
    db.query.internalNotes.findMany({
      where: (n, { eq: e }) => e(n.ticketId, ticketId),
    }),
    db.query.auditLogs.findMany({
      where: (a, { eq: e }) => e(a.ticketId, ticketId),
    }),
    db.query.attachments.findMany({
      where: (a, { eq: e }) => e(a.ticketId, ticketId),
    }),
  ]);

  return {
    ...ticket,
    worklogs: worklogsList,
    comments: commentsList,
    internal_notes: internalNotesList,
    audit_logs: auditLogsList,
    attachments: attachmentsList,
  };
}