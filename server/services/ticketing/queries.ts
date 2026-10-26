import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, ticketMembers, worklogs, users, vendors, attachments, auditLogs } from '~/server/database/schema';
import { getTicketById } from '~/server/utils/tickets';
import { serializeAttachment, serializeAuditLog, serializeComment, serializeInternalNote, serializeWorklog } from '~/server/utils/serialize';
import { type Actor, fail, getTicketRow, isIT, requireIT } from './common';
import { canViewTicket } from './permissions';

const cap = (n: number | undefined, def: number, max: number) => Math.min(Math.max(n ?? def, 1), max);

// Urutan kronologis stabil: waktu (detik) lalu ms dari ID, karena beberapa record bisa terjadi dalam detik yang sama.
const idMs = (id: string) => Number(id.split('-')[1]) || 0;
const chrono = <T extends { id: string }>(a: T, b: T, key: (x: T) => string) =>
  key(a).localeCompare(key(b)) || idMs(a.id) - idMs(b.id) || a.id.localeCompare(b.id);

function brief(t: typeof tickets.$inferSelect) {
  return {
    id: t.id,
    ticket_number: t.ticketNumber,
    title: t.title,
    status: t.status,
    priority: t.priority,
    category: t.category,
    assigned_to: t.assignedTo,
    requested_by: t.requestedBy,
    created_at: t.createdAt,
  };
}

async function visibleTicket(actor: Actor, ticketId: string) {
  const t = await getTicketRow(db, ticketId);
  if (!canViewTicket(t, actor)) fail(403, 'Forbidden: bukan pihak tiket ini');
  return t;
}

export async function listMyTickets(actor: Actor, input: { status?: string; limit?: number }) {
  const limit = cap(input.limit, 25, 100);
  const conds = [];
  if (isIT(actor)) {
    const memberOf = db.select({ id: ticketMembers.ticketId }).from(ticketMembers).where(eq(ticketMembers.userId, actor.id));
    conds.push(or(eq(tickets.assignedTo, actor.id), inArray(tickets.id, memberOf))!);
  } else {
    conds.push(or(eq(tickets.requestedBy, actor.id), eq(tickets.createdBy, actor.id))!);
  }
  if (input.status) conds.push(eq(tickets.status, input.status));
  const rows = await db.select().from(tickets).where(and(...conds)).orderBy(desc(tickets.createdAt)).limit(limit);
  return { tickets: rows.map(brief) };
}

export async function searchTickets(actor: Actor, input: { q?: string; status?: string; limit?: number }) {
  const limit = cap(input.limit, 10, 50);
  const conds = [];
  const q = input.q?.trim();
  if (q) {
    const p = `%${q.replace(/[\\%_]/g, m => `\\${m}`)}%`;
    const byRequester = db.select({ id: users.id }).from(users).where(like(users.name, p));
    conds.push(or(like(tickets.id, p), like(tickets.title, p), like(tickets.ticketNumber, p), inArray(tickets.requestedBy, byRequester))!);
  }
  if (input.status) conds.push(eq(tickets.status, input.status));
  if (!isIT(actor)) conds.push(or(eq(tickets.requestedBy, actor.id), eq(tickets.createdBy, actor.id))!);
  const rows = await db.select().from(tickets).where(conds.length ? and(...conds) : undefined).orderBy(desc(tickets.createdAt)).limit(limit);
  return { tickets: rows.map(brief) };
}

// Sumber data sama dengan UI (getTicketById); lampiran INTERNAL_ONLY disembunyikan dari non-IT.
export async function getTicketDetail(actor: Actor, ticketId: string) {
  await visibleTicket(actor, ticketId);
  const t = await getTicketById(ticketId);
  if (!t) fail(404, 'Ticket not found');
  const it = isIT(actor);
  return {
    ...t,
    attachments: t.attachments.filter((a: { visibility: string }) => it || a.visibility === 'USER_VISIBLE'),
    worklogs: [...t.worklogs].sort((a, b) => chrono(a, b, x => x.created_at)),
    audit_logs: [...t.audit_logs].sort((a, b) => chrono(a, b, x => x.performed_at)),
  };
}

export async function listActivities(actor: Actor, ticketId: string) {
  await visibleTicket(actor, ticketId);
  const rows = await db.select({ w: worklogs, workerName: users.name }).from(worklogs)
    .leftJoin(users, eq(users.id, worklogs.workerId)).where(eq(worklogs.ticketId, ticketId));
  const items = rows.map(r => serializeWorklog({ ...r.w, workerName: r.workerName })).sort((a, b) => chrono(a, b, x => x.created_at));
  return { count: items.length, activities: items };
}

export async function listComments(actor: Actor, ticketId: string) {
  await visibleTicket(actor, ticketId);
  const rows = await db.query.comments.findMany({ where: (c, { eq: e }) => e(c.ticketId, ticketId) });
  const items = rows.map(serializeComment).sort((a, b) => chrono(a, b, x => x.created_at));
  return { count: items.length, comments: items };
}

export async function listInternalNotes(actor: Actor, ticketId: string) {
  requireIT(actor);
  await getTicketRow(db, ticketId);
  const rows = await db.query.internalNotes.findMany({ where: (n, { eq: e }) => e(n.ticketId, ticketId) });
  const items = rows.map(serializeInternalNote).sort((a, b) => chrono(a, b, x => x.created_at));
  return { count: items.length, notes: items };
}

export async function listAttachments(actor: Actor, ticketId: string) {
  await visibleTicket(actor, ticketId);
  const cond = isIT(actor)
    ? eq(attachments.ticketId, ticketId)
    : and(eq(attachments.ticketId, ticketId), eq(attachments.visibility, 'USER_VISIBLE'));
  const rows = await db.select({ a: attachments, uploadedByName: users.name }).from(attachments)
    .leftJoin(users, eq(users.id, attachments.uploadedBy)).where(cond);
  const items = rows.map(r => serializeAttachment({ ...r.a, uploadedByName: r.uploadedByName })).sort((a, b) => chrono(a, b, x => x.uploaded_at));
  return { count: items.length, attachments: items };
}

export async function getHistory(actor: Actor, ticketId: string) {
  await visibleTicket(actor, ticketId);
  const rows = await db.select({ a: auditLogs, performedByName: users.name }).from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.performedBy)).where(eq(auditLogs.ticketId, ticketId));
  const items = rows.map(r => serializeAuditLog({ ...r.a, performedByName: r.performedByName })).sort((a, b) => chrono(a, b, x => x.performed_at));
  return { count: items.length, audit_logs: items };
}

export async function listWorkers(actor: Actor) {
  requireIT(actor);
  const rows = await db.select({ id: users.id, name: users.name, role: users.role, department: users.department })
    .from(users).where(inArray(users.role, ['IT_WORKER', 'SYSTEM_ADMIN']));
  return { workers: rows };
}

export async function listVendors(actor: Actor) {
  requireIT(actor);
  const rows = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).orderBy(vendors.name);
  return { vendors: rows };
}
