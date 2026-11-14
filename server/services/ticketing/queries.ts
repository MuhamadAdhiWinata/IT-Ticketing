import { itRoles } from '~/utils/roles';
import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, ticketMembers, worklogs, users, vendors, files, auditLogs, categories, projectKendala, submodules } from '~/server/database/schema';
import { getTriageMaster } from '~/server/services/triage-master';
import { PERMISSIONS, roleHas } from '~/utils/permissions';
import { AFFECTED_SCOPES, CHANNELS, TICKET_TYPES, UNITS, WORK_STATUSES } from '~/utils/ticketSpec';
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

export async function searchTickets(actor: Actor, input: {
  q?: string; status?: string; limit?: number; category?: string; project_kendala?: string; submodule?: string;
}) {
  const limit = cap(input.limit, 10, 50);
  const conds = [];
  const q = input.q?.trim();
  if (q) {
    const p = `%${q.replace(/[\\%_]/g, m => `\\${m}`)}%`;
    const byRequester = db.select({ id: users.id }).from(users).where(like(users.name, p));
    // Deskripsi dan bukti ikut dicari supaya kode referensi di dalam isi tiket (mis. kode form) bisa ditemukan.
    conds.push(or(like(tickets.id, p), like(tickets.title, p), like(tickets.ticketNumber, p), like(tickets.description, p), like(tickets.evidenceSteps, p), inArray(tickets.requestedBy, byRequester))!);
  }
  if (input.status) conds.push(eq(tickets.status, input.status));
  if (input.category) conds.push(eq(tickets.category, input.category));
  if (input.project_kendala) conds.push(eq(tickets.projectKendala, input.project_kendala));
  if (input.submodule) conds.push(eq(tickets.submodule, input.submodule));
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
    ? eq(files.ticketId, ticketId)
    : and(eq(files.ticketId, ticketId), eq(files.visibility, 'USER_VISIBLE'));
  const rows = await db.select({ a: files, uploadedByName: users.name }).from(files)
    .leftJoin(users, eq(users.id, files.uploadedBy)).where(cond);
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
    .from(users).where(inArray(users.role, itRoles()));
  return { workers: rows };
}

// Identitas pemilik token dan klaim aksi yang dimilikinya.
export async function whoami(actor: Actor) {
  const u = (await db.select().from(users).where(eq(users.id, actor.id)))[0];
  if (!u) fail(404, 'User not found');
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, unit: u.unit, is_pic: !!u.isPic, duty_active: !!actor.dutyActive,
    claims: PERMISSIONS.map(p => p.key).filter(k => !k.startsWith('menu.') && roleHas(u.role, k, !!actor.dutyActive)),
  };
}

// Nilai valid untuk create_ticket: master aplikasi/modul dari DB, enum dari spesifikasi tiket.
export async function getFormSchema() {
  const [cats, apps, mods, triage] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),
    db.select().from(projectKendala).orderBy(projectKendala.name),
    db.select().from(submodules).orderBy(submodules.name),
    getTriageMaster(),
  ]);
  return {
    required: ['title', 'contact', 'description', 'expected_behavior', 'category', 'project_kendala', 'since_at', 'affected_scope', 'work_status'],
    conditional: [
      'location wajib bila category = Support IT',
      'workaround wajib bila work_status = TERGANGGU',
      'evidence_steps wajib (teks atau gambar) kecuali ada lampiran',
      'unit wajib bila akun pembuat belum punya unit',
      'priority CRITICAL butuh attachmentCount >= 1',
    ],
    text_format: 'description, expected_behavior, evidence_steps, workaround: teks biasa atau HTML (<p>, <ul>, <li>, <strong>); markdown tidak dirender',
    categories: cats.map(c => ({
      name: c.name,
      applications: apps.filter(a => a.categoryId === c.id).map(a => ({
        name: a.name, modules: mods.filter(m => m.projectKendalaId === a.id).map(m => m.name),
      })),
    })),
    units: UNITS,
    priorities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    affected_scopes: AFFECTED_SCOPES,
    work_statuses: WORK_STATUSES,
    channels: { options: CHANNELS, note: 'hanya diterapkan untuk peran intake (PM/Duty); lainnya selalu FORM' },
    ticket_types: TICKET_TYPES,
    impacts: triage.impacts.filter(i => i.is_active).map(({ id, label }) => ({ id, label })),
    urgencies: triage.urgencies.filter(i => i.is_active).map(({ id, label }) => ({ id, label })),
    since_at_format: 'YYYY-MM-DD HH:MM (atau dengan T)',
  };
}

export async function listVendors(actor: Actor) {
  requireIT(actor);
  const rows = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).orderBy(vendors.name);
  return { vendors: rows };
}
