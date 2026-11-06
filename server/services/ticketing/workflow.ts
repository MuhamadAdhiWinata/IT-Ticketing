import { z } from 'zod';
import { eq, count } from 'drizzle-orm';
import { tickets, worklogs, auditLogs, vendors, files as filesTbl } from '~/server/database/schema';
import { createNotification } from '~/server/utils/notifications';
import { getValidTransitions, isValidTransition } from '~/server/utils/ticket-lifecycle';
import {
  type Actor, type DbExec, type UploadInput,
  fail, hm, inTx, lockTicket, newId, nowTs, parse, requireIT, ticketSummary, withFileCleanup,
} from './common';
import { insertAttachments } from './attachments';

export const STATUSES = ['DRAFT', 'PROCESS', 'DELEGASI', 'SELESAI'] as const;

const DelegationSchema = z.object({
  type: z.enum(['DELEGASI_VENDOR', 'DELEGASI_TEKNISI']),
  vendor_id: z.string().optional(),
  vendor_name: z.string().optional(),
  technician_id: z.string().optional(),
  technician_name: z.string().optional(),
  reference_no: z.string().max(100).optional(),
  notes: z.string().max(20000).optional(),
}).superRefine((d, ctx) => {
  if (d.type === 'DELEGASI_VENDOR' && !d.vendor_id && !d.vendor_name) {
    ctx.addIssue({ code: 'custom', message: 'vendor_id atau vendor_name wajib untuk DELEGASI_VENDOR', path: ['vendor_id'] });
  }
  if (d.type === 'DELEGASI_TEKNISI' && !d.technician_id && !d.technician_name) {
    ctx.addIssue({ code: 'custom', message: 'technician_id atau technician_name wajib untuk DELEGASI_TEKNISI', path: ['technician_name'] });
  }
});

const urlField = z.string().trim().max(500).refine(u => /^https?:\/\/\S+$/i.test(u), 'harus URL http(s)');

const SolutionSchema = z.object({
  type: z.enum(['SEMENTARA', 'PERMANEN']),
  summary: z.string().trim().min(1).max(5000),
  odoo_task_url: urlField.optional(),
  tech_debt_url: urlField.optional(),
}).superRefine((d, ctx) => {
  if (d.type !== 'SEMENTARA') return;
  if (!d.odoo_task_url) ctx.addIssue({ code: 'custom', message: 'odoo_task_url wajib untuk solusi SEMENTARA', path: ['odoo_task_url'] });
  if (!d.tech_debt_url) ctx.addIssue({ code: 'custom', message: 'tech_debt_url wajib untuk solusi SEMENTARA', path: ['tech_debt_url'] });
});

const TransitionSchema = z.object({
  ticketId: z.string().min(1),
  to: z.enum(STATUSES),
  notes: z.string().trim().max(20000).optional(),
  delegation: DelegationSchema.optional(),
  solution: SolutionSchema.optional(),
});

// Transisi -> tahap UI (stages/complete). Transisi lain (kanban) hanya mengubah status.
const STAGE_BY_TRANSITION: Record<string, 'START_WORK' | 'IN_PROGRESS' | 'DELEGATION'> = {
  'DRAFT>PROCESS': 'START_WORK',
  'PROCESS>SELESAI': 'IN_PROGRESS',
  'PROCESS>DELEGASI': 'DELEGATION',
};

function rejectTransition(from: string, to: string): never {
  const allowed = getValidTransitions(from);
  fail(409, `Cannot transition from ${from} to ${to}. Transisi yang diizinkan dari ${from}: ${allowed.join(', ') || '(tidak ada)'}`, {
    current_status: from,
    allowed_transitions: allowed,
  });
}

export async function transitionStatus(
  actor: Actor,
  input: z.input<typeof TransitionSchema> & { files?: UploadInput[] },
  exec?: DbExec,
) {
  requireIT(actor);
  const v = parse(TransitionSchema, input);
  const files = input.files ?? [];

  return withFileCleanup(track => inTx(exec, async (tx) => {
    const t = await lockTicket(tx, v.ticketId);
    if (t.status === 'SELESAI' && v.to === 'PROCESS') return reopenIn(tx, actor, t);
    if (!isValidTransition(t.status, v.to)) rejectTransition(t.status, v.to);

    const stageKey = STAGE_BY_TRANSITION[`${t.status}>${v.to}`];
    if (v.to === 'DELEGASI' && !v.delegation) fail(400, 'delegation: wajib untuk transisi ke DELEGASI');
    if (v.to !== 'DELEGASI' && v.delegation) fail(400, 'delegation: hanya untuk transisi ke DELEGASI');
    if (v.solution && v.to !== 'SELESAI') fail(400, 'solution: hanya untuk transisi ke SELESAI');

    const ts = nowTs();
    const patch: Partial<typeof tickets.$inferInsert> = { status: v.to };
    if (stageKey === 'START_WORK') {
      if (t.priority === 'CRITICAL' && files.length === 0) {
        const [row] = await tx.select({ cnt: count() }).from(filesTbl).where(eq(filesTbl.ticketId, t.id));
        if (!row?.cnt) fail(400, 'Tiket CRITICAL membutuhkan minimal 1 lampiran dokumen pendukung sebelum diproses');
      }
      patch.processStartedAt = t.processStartedAt || ts;
      patch.issuedAt = t.issuedAt || ts;
    } else if (stageKey === 'IN_PROGRESS') {
      patch.completedAt = ts;
      if (v.solution) {
        patch.solutionType = v.solution.type;
        patch.resolutionSummary = v.solution.summary;
        patch.odooTaskUrl = v.solution.odoo_task_url ?? null;
        patch.techDebtUrl = v.solution.tech_debt_url ?? null;
      }
    } else if (stageKey === 'DELEGATION' && v.delegation) {
      const d = v.delegation;
      let vendorName = d.vendor_name;
      if (d.vendor_id) {
        const vendor = (await tx.select().from(vendors).where(eq(vendors.id, d.vendor_id)))[0];
        if (!vendor) fail(400, `vendor_id ${d.vendor_id} tidak ditemukan`);
        vendorName = vendor.name;
      }
      Object.assign(patch, {
        delegationType: d.type,
        vendorId: d.vendor_id ?? null,
        vendorName: vendorName ?? null,
        technicianId: d.technician_id ?? null,
        technicianName: d.technician_name ?? null,
        referenceNo: d.reference_no ?? null,
        delegationNotes: d.notes ?? null,
        delegatedAt: ts,
      });
    } else if (t.status === 'DELEGASI' && v.to === 'PROCESS') {
      patch.returnedAt = ts;
      if (v.notes) patch.returnedNotes = v.notes;
    }
    await tx.update(tickets).set(patch).where(eq(tickets.id, v.ticketId));

    await tx.insert(auditLogs).values({
      id: newId('AUD'),
      ticketId: v.ticketId,
      action: stageKey ? `TAHAP_${stageKey}_SELESAI` : 'STATUS_DIUBAH',
      performedAt: ts,
      performedBy: actor.id,
      detail: `${t.status} -> ${v.to}`,
      notes: v.notes || '',
    });

    let attachments: Awaited<ReturnType<typeof insertAttachments>> = [];
    if (stageKey) {
      if (v.notes) {
        await tx.insert(worklogs).values({
          id: newId('WL'),
          ticketId: v.ticketId,
          stageKey,
          workerId: actor.id,
          date: ts.slice(0, 10),
          startAt: hm(),
          finishAt: hm(),
          durationMinutes: 0,
          description: v.notes,
          createdAt: ts,
        });
      }
      attachments = await insertAttachments(tx, track, actor, v.ticketId, stageKey, 'USER_VISIBLE', ts, files);
    } else if (files.length > 0) {
      fail(400, 'files: lampiran hanya didukung pada transisi DRAFT>PROCESS, PROCESS>SELESAI, PROCESS>DELEGASI');
    }

    if (t.requestedBy !== actor.id) {
      await createNotification({
        userId: t.requestedBy,
        ticketId: v.ticketId,
        type: 'ASSIGNED',
        title: 'Status Tiket Berubah',
        message: `Status tiket ${t.ticketNumber || t.id} berubah dari ${t.status} menjadi ${v.to}`,
      }, tx);
    }

    return { previous_status: t.status, ticket: await ticketSummary(tx, v.ticketId), attachments };
  }));
}

async function reopenIn(tx: DbExec, actor: Actor, t: typeof tickets.$inferSelect) {
  if (t.status !== 'SELESAI') fail(409, 'Hanya tiket dengan status SELESAI yang dapat dibuka ulang', { current_status: t.status });
  await tx.update(tickets).set({ status: 'PROCESS', completedAt: null, reopenCount: t.reopenCount + 1 }).where(eq(tickets.id, t.id));
  await createNotification({
    userId: t.requestedBy,
    ticketId: t.id,
    type: 'ASSIGNED',
    title: 'Tiket Dibuka Ulang',
    message: `Tiket ${t.ticketNumber || t.id} dibuka ulang oleh ${actor.name} (IT)`,
  }, tx);
  await tx.insert(auditLogs).values({
    id: newId('AUD'),
    ticketId: t.id,
    action: 'TIKET_DIBUKA_ULANG',
    performedAt: nowTs(),
    performedBy: actor.id,
    detail: 'Tiket dibuka ulang dari SELESAI ke PROCESS oleh IT',
  });
  return { previous_status: 'SELESAI', ticket: await ticketSummary(tx, t.id), attachments: [] };
}

export async function reopenTicket(actor: Actor, input: { ticketId: string }, exec?: DbExec) {
  requireIT(actor);
  return inTx(exec, async (tx) => reopenIn(tx, actor, await lockTicket(tx, input.ticketId)));
}
