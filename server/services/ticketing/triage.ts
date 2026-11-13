import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { tickets, auditLogs, files as filesTbl } from '~/server/database/schema';
import { count } from 'drizzle-orm';
import { createNotification } from '~/server/utils/notifications';
import { canTriageRole, isDutyRole } from '~/utils/roles';
import { getTriageMaster } from '~/server/services/triage-master';
import {
  TICKET_TYPES, CATALOG_ITEMS, TRANSFER_TARGETS, BLOCKED_BY, P_TO_PRIORITY,
  priorityFromMatrix, priorityToP, values,
} from '~/utils/ticketSpec';
import { type Actor, type DbExec, fail, inTx, lockTicket, newId, nowTs, parse, requireIT, ticketSummary } from './common';

const reasonText = z.string().trim().max(2000);
const urlField = z.string().trim().max(500).refine(u => /^https?:\/\/\S+$/i.test(u), 'harus URL http(s)');

const TriageSchema = z.object({
  ticketId: z.string().min(1),
  ticket_type: z.enum(values(TICKET_TYPES)).optional(),
  // Nilai dicocokkan ke master Dampak/Urgensi (DB) di triageTicket.
  impact: z.string().trim().min(1).optional(),
  urgency: z.string().trim().min(1).optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  change_reason: reasonText.optional(),
  catalog_item: z.enum(values(CATALOG_ITEMS)).nullable().optional(),
  data_approval_note: reasonText.optional(),
  transfer_target: z.enum(values(TRANSFER_TARGETS)).optional(),
  duplicate_of: z.string().trim().min(1).optional(),
  data_complete: z.enum(['YA', 'TIDAK']).nullable().optional(),
});

const ExecutionSchema = z.object({
  ticketId: z.string().min(1),
  blocked_by: z.enum(values(BLOCKED_BY)).nullable().optional(),
  odoo_task_url: urlField.nullable().optional(),
  waiting: z.boolean().optional(),
});

const audit = (tx: DbExec, ticketId: string, actor: Actor, action: string, detail?: string, notes?: string) =>
  tx.insert(auditLogs).values({ id: newId('AUD'), ticketId, action, performedAt: nowTs(), performedBy: actor.id, onDuty: actor.dutyActive ? 1 : 0, detail: detail ?? null, notes: notes ?? null });

// Tombol "Akui": PM mengakui tiket baru. Idempoten; waktu pertama yang disimpan.
export async function acknowledgeTicket(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  if (!canTriageRole(actor.role, actor.dutyActive)) fail(403, 'Forbidden: hanya PM');
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, input.ticketId);
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI tidak dapat diakui');
    if (!t.acknowledgedAt) {
      await tx.update(tickets).set({ acknowledgedAt: nowTs() }).where(eq(tickets.id, t.id));
      await audit(tx, t.id, actor, 'TIKET_DIAKUI');
      if (t.requestedBy !== actor.id) {
        await createNotification({ userId: t.requestedBy, ticketId: t.id, type: 'ASSIGNED', title: 'Tiket Diakui', message: `Tiket ${t.ticketNumber || t.id} diakui oleh ${actor.name}` }, tx);
      }
    }
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Tombol "Mulai Triase": PM memindahkan tiket Diakui ke fase Ditriase. Idempoten.
export async function startTriage(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  if (!canTriageRole(actor.role, actor.dutyActive)) fail(403, 'Forbidden: hanya PM');
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, input.ticketId);
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI: triase terkunci');
    if (!t.acknowledgedAt) fail(409, 'Tiket belum diakui; klik Akui dahulu');
    if (!t.triagedAt) {
      await tx.update(tickets).set({ triagedAt: nowTs() }).where(eq(tickets.id, t.id));
      await audit(tx, t.id, actor, 'TRIASE_DIMULAI');
    }
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Tombol "Terima": hanya Pelaksana tiket.
export async function acceptTicket(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  requireIT(actor);
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, input.ticketId);
    if (t.assignedTo !== actor.id) fail(403, 'Forbidden: hanya Pelaksana tiket yang dapat menerima');
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI tidak dapat diterima');
    if (!t.acceptedAt) {
      await tx.update(tickets).set({ acceptedAt: nowTs() }).where(eq(tickets.id, t.id));
      await audit(tx, t.id, actor, 'TIKET_DITERIMA');
    }
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Konfirmasi Duty Engineer: nama + waktu. Wajib untuk Insiden P1/P2 sebelum diproses.
export async function confirmDuty(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  if (!isDutyRole(actor.role, actor.dutyActive)) fail(403, 'Forbidden: hanya Duty Engineer');
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, input.ticketId);
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI tidak dapat dikonfirmasi');
    await tx.update(tickets).set({ dutyConfirmedBy: actor.name, dutyConfirmedAt: nowTs() }).where(eq(tickets.id, t.id));
    await audit(tx, t.id, actor, 'KONFIRMASI_DUTY_ENGINEER', `Dikonfirmasi ${actor.name}`);
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Triase oleh PM: jenis, dampak, urgensi, prioritas, katalog, pengalihan. Pelaksana ditugaskan nanti, di fase Dikerjakan.
export async function triageTicket(actor: Actor, input: z.input<typeof TriageSchema>, exec?: DbExec) {
  if (!canTriageRole(actor.role, actor.dutyActive)) fail(403, 'Forbidden: hanya PM');
  const v = parse(TriageSchema, input);
  const master = await getTriageMaster();
  if (v.impact && !master.impacts.some(x => x.id === v.impact)) fail(400, `impact: ${v.impact} tidak ada di master Dampak`);
  if (v.urgency && !master.urgencies.some(x => x.id === v.urgency)) fail(400, `urgency: ${v.urgency} tidak ada di master Urgensi`);
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, v.ticketId);
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI: triase terkunci');

    const type = v.ticket_type ?? t.ticketType;
    const impact = v.impact ?? t.impact;
    const urgency = v.urgency ?? t.urgency;
    // ponytail: menyimpan triase lewat API/MCP tanpa klik "Mulai Triase" otomatis masuk fase Ditriase; urutan tombol dijaga UI.
    const patch: Partial<typeof tickets.$inferInsert> = t.triagedAt ? {} : { triagedAt: nowTs() };
    if (v.ticket_type) patch.ticketType = v.ticket_type;
    if (v.impact) patch.impact = v.impact;
    if (v.urgency) patch.urgency = v.urgency;

    const prevP = priorityToP(t.priority);
    const matrixP = priorityFromMatrix(impact, urgency, master.matrix);
    let reasonNeeded = !!(t.ticketType && v.ticket_type && v.ticket_type !== t.ticketType);
    // Matriks hanya menghitung ulang bila input dampak/urgensi/jenis berubah; override manual PM tidak ditimpa.
    const inputsChanged = (v.impact && v.impact !== t.impact) || (v.urgency && v.urgency !== t.urgency) || (v.ticket_type && v.ticket_type !== t.ticketType);
    if (type === 'INSIDEN') {
      const newP = v.priority ?? (inputsChanged ? matrixP : null) ?? prevP;
      if (newP && P_TO_PRIORITY[newP] !== t.priority) {
        patch.priority = P_TO_PRIORITY[newP];
        if (t.ticketType && prevP && newP !== prevP) reasonNeeded = true;
      }
      if (v.priority && matrixP && v.priority !== matrixP) reasonNeeded = true;
    } else if (v.priority) {
      fail(400, 'priority: hanya untuk tiket Insiden');
    }
    if (reasonNeeded && !v.change_reason) fail(400, 'change_reason: wajib saat mengubah jenis atau prioritas');
    if (v.change_reason) patch.changeReason = v.change_reason;

    if (v.catalog_item !== undefined) patch.catalogItem = v.catalog_item;
    if (v.data_complete !== undefined) patch.dataComplete = v.data_complete;
    if (v.data_approval_note !== undefined) patch.dataApprovalNote = v.data_approval_note || null;
    if (type === 'PL_DATA') {
      const approval = v.data_approval_note ?? t.dataApprovalNote;
      if (!approval?.trim()) {
        const [row] = await tx.select({ cnt: count() }).from(filesTbl).where(eq(filesTbl.ticketId, t.id));
        if (!row?.cnt) fail(400, 'data_approval_note: persetujuan PIC data wajib untuk PL: Data (catatan atau lampiran)');
      }
    }

    if (v.transfer_target) {
      if (v.transfer_target === 'DUPLIKAT') {
        if (!v.duplicate_of) fail(400, 'duplicate_of: wajib untuk pengalihan Duplikat');
        if (v.duplicate_of === t.id) fail(400, 'duplicate_of: tidak boleh tiket itu sendiri');
        const [dup] = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, v.duplicate_of));
        if (!dup) fail(400, `duplicate_of: tiket ${v.duplicate_of} tidak ditemukan`);
        patch.referencedTicketId = v.duplicate_of;
      }
      const ts = nowTs();
      patch.transferTarget = v.transfer_target;
      patch.status = 'SELESAI';
      patch.completedAt = ts;
    }

    if (Object.keys(patch).length > 0) await tx.update(tickets).set(patch).where(eq(tickets.id, t.id));

    const changed = Object.keys(patch).join(', ') || 'tanpa perubahan';
    await audit(tx, t.id, actor, v.transfer_target ? 'TIKET_DIALIHKAN' : 'TIKET_DITRIASE', changed, v.change_reason);
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Eksekusi Pelaksana: Tertahan Oleh, tautan Task Odoo, mulai/akhir Menunggu Pemohon.
export async function updateExecution(actor: Actor, input: z.input<typeof ExecutionSchema>, exec?: DbExec) {
  requireIT(actor);
  const v = parse(ExecutionSchema, input);
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, v.ticketId);
    if (t.status === 'SELESAI') fail(409, 'Tiket SELESAI: eksekusi terkunci');
    const patch: Partial<typeof tickets.$inferInsert> = {};
    if (v.blocked_by !== undefined) patch.blockedBy = v.blocked_by;
    if (v.odoo_task_url !== undefined) patch.odooTaskUrl = v.odoo_task_url;
    if (v.waiting === true) {
      if (t.waitingStartedAt && !t.waitingEndedAt) fail(409, 'Tiket sudah dalam status Menunggu Pemohon');
      patch.waitingStartedAt = nowTs();
      patch.waitingEndedAt = null;
    } else if (v.waiting === false) {
      if (!t.waitingStartedAt || t.waitingEndedAt) fail(409, 'Tiket tidak sedang Menunggu Pemohon');
      patch.waitingEndedAt = nowTs();
    }
    if (Object.keys(patch).length === 0) fail(400, 'Tidak ada perubahan');
    await tx.update(tickets).set(patch).where(eq(tickets.id, t.id));
    await audit(tx, t.id, actor, v.waiting === undefined ? 'EKSEKUSI_DIUBAH' : v.waiting ? 'MENUNGGU_PEMOHON_MULAI' : 'MENUNGGU_PEMOHON_SELESAI', Object.keys(patch).join(', '));
    return { ticket: await ticketSummary(tx, t.id) };
  });
}

// Tutup tiket SELESAI (status Ditutup). Hanya PM.
export async function closeTicket(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  if (!canTriageRole(actor.role, actor.dutyActive)) fail(403, 'Forbidden: hanya PM');
  return inTx(exec, async (tx) => {
    const t = await lockTicket(tx, input.ticketId);
    if (t.status !== 'SELESAI') fail(409, 'Hanya tiket SELESAI yang dapat ditutup');
    if (!t.closedAt) {
      await tx.update(tickets).set({ closedAt: nowTs() }).where(eq(tickets.id, t.id));
      await audit(tx, t.id, actor, 'TIKET_DITUTUP');
    }
    return { ticket: await ticketSummary(tx, t.id) };
  });
}
