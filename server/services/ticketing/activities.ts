import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { worklogs, users } from '~/server/database/schema';
import { serializeWorklog } from '~/server/utils/serialize';
import {
  type Actor, type DbExec, type UploadInput, IT_ROLES,
  fail, inTx, lockTicket, newId, nowTs, parse, requireIT, ticketSummary, withFileCleanup, hm,
} from './common';
import { insertAttachments } from './attachments';
import { activityStagesFor, defaultActivityStage } from './permissions';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (t: string) => {
  const [h, m] = t.split(/[:.]/).map(Number);
  return (h || 0) * 60 + (m || 0);
};
const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const ActivitySchema = z.object({
  ticketId: z.string().min(1),
  stageKey: z.string().min(1).optional(),
  description: z.string().trim().max(5000, 'Deskripsi maksimal 5000 karakter').default(''),
});

// "Kirim" di UI: worklog baru tanpa mengubah status (Rule 18). Setiap panggilan = satu record baru.
export async function addActivity(
  actor: Actor,
  input: { ticketId: string; stageKey?: string; description?: string; files?: UploadInput[] },
  exec?: DbExec,
) {
  requireIT(actor);
  const v = parse(ActivitySchema, input);
  const files = input.files ?? [];
  if (!v.description && files.length === 0) fail(400, 'description: wajib diisi (atau lampirkan file)');

  return withFileCleanup(track => inTx(exec, async (tx) => {
    const ticket = await lockTicket(tx, v.ticketId);
    const allowed = activityStagesFor(ticket.status);
    const stageKey = v.stageKey ?? defaultActivityStage(ticket.status);
    if (!allowed.includes(stageKey as any)) {
      fail(409, `stageKey ${stageKey} tidak tersedia pada status ${ticket.status}`, { allowed_stages: allowed });
    }

    const ts = nowTs();
    const row = {
      id: newId('WL'),
      ticketId: v.ticketId,
      stageKey,
      workerId: actor.id,
      date: localDate(),
      startAt: hm(),
      finishAt: hm(),
      durationMinutes: 0,
      description: v.description,
      createdAt: ts,
    };
    await tx.insert(worklogs).values(row);
    const attachments = await insertAttachments(tx, track, actor, v.ticketId, stageKey, 'USER_VISIBLE', ts, files);

    return {
      activity: serializeWorklog({ ...row, workerName: actor.name }),
      attachments,
      ticket: await ticketSummary(tx, v.ticketId),
    };
  }));
}

const TimeSchema = z.object({
  ticketId: z.string().min(1),
  date: z.string().regex(DATE, 'date harus YYYY-MM-DD').optional(),
  start_at: z.string().regex(TIME, 'start_at harus HH:MM'),
  finish_at: z.string().regex(TIME, 'finish_at harus HH:MM'),
  duration_minutes: z.number().int().min(0).max(24 * 60).optional(),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi').max(5000),
  stageKey: z.enum(['ASSIGN', 'IN_PROGRESS', 'COMPLETION']).default('IN_PROGRESS'),
});

// Log harian (DailyWorkView). `workerId` hanya diisi jalur web; tool MCP tidak pernah meneruskannya.
export async function logWorkTime(
  actor: Actor,
  input: z.input<typeof TimeSchema>,
  opts: { workerId?: string } = {},
  exec?: DbExec,
) {
  requireIT(actor);
  const v = parse(TimeSchema, input);
  const s = toMin(v.start_at);
  const f = toMin(v.finish_at);
  if (f <= s) fail(400, 'finish_at harus setelah start_at');
  const date = v.date ?? localDate();

  return inTx(exec, async (tx) => {
    const ticket = await lockTicket(tx, v.ticketId);
    if (ticket.status === 'DRAFT') fail(409, 'Tiket masih DRAFT; mulai proses dahulu sebelum mencatat jam kerja');

    let workerId = actor.id;
    let workerName = actor.name;
    if (opts.workerId && opts.workerId !== actor.id) {
      const target = (await tx.select().from(users).where(eq(users.id, opts.workerId)))[0];
      if (!target || !IT_ROLES.includes(target.role)) fail(400, 'worker_id bukan pengguna IT');
      workerId = target.id;
      workerName = target.name;
    }

    const existing = await tx.select().from(worklogs)
      .where(and(eq(worklogs.workerId, workerId), eq(worklogs.date, date))).for('update');
    for (const log of existing) {
      if (s < toMin(log.finishAt) && f > toMin(log.startAt)) {
        fail(400, 'Jam kerja tumpang tindih dengan log lain', { conflicting_log: log.id });
      }
    }

    const row = {
      id: newId('WL'),
      ticketId: v.ticketId,
      stageKey: v.stageKey,
      workerId,
      date,
      startAt: v.start_at,
      finishAt: v.finish_at,
      durationMinutes: v.duration_minutes ?? f - s,
      description: v.description,
      createdAt: nowTs(),
    };
    await tx.insert(worklogs).values(row);
    return {
      activity: serializeWorklog({ ...row, workerName }),
      ticket: await ticketSummary(tx, v.ticketId),
    };
  });
}
