import { and, asc, eq, gt, gte, lt, lte, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~/server/database/client';
import { dutySchedules, users } from '~/server/database/schema';
import { createNotification } from '~/server/utils/notifications';
import { dbUtcToIso, isoToDbUtc, nowDbUtc, ONE_DAY_MS } from '~/utils/utcTime';
import { isITRole } from '~/utils/roles';
import { fail, newId, parse } from './ticketing/common';

export interface DutyState {
  active: boolean;
  endAt: string | null; // ISO UTC, hanya saat aktif
  nextStartAt: string | null; // ISO UTC, jadwal berikutnya dalam 24 jam
}

// Cache per user. Berlaku sampai paling cepat: 60 detik, akhir shift, atau awal jadwal berikutnya,
// jadi pergantian shift tidak pernah terlambat dari batas itu. Ditulis ulang oleh setiap perubahan jadwal.
const cache = new Map<string, { state: DutyState; validUntil: number }>();
const TTL_MS = 60_000;

export const clearDutyCache = () => cache.clear();

export async function getDutyState(userId: string, nowMs = Date.now()): Promise<DutyState> {
  const hit = cache.get(userId);
  if (hit && hit.validUntil > nowMs) return hit.state;

  const now = nowDbUtc(nowMs);
  const live = and(eq(dutySchedules.userId, userId), ne(dutySchedules.status, 'CANCELLED'));
  const [current] = await db.select({ endAt: dutySchedules.endAt }).from(dutySchedules)
    .where(and(live, lte(dutySchedules.startAt, now), gt(dutySchedules.endAt, now)))
    .orderBy(sql`${dutySchedules.endAt} desc`).limit(1);
  const [next] = await db.select({ startAt: dutySchedules.startAt }).from(dutySchedules)
    .where(and(live, gt(dutySchedules.startAt, now), lte(dutySchedules.startAt, nowDbUtc(nowMs + ONE_DAY_MS))))
    .orderBy(asc(dutySchedules.startAt)).limit(1);

  const state: DutyState = {
    active: !!current,
    endAt: current ? dbUtcToIso(current.endAt) : null,
    nextStartAt: next ? dbUtcToIso(next.startAt) : null,
  };
  const edges = [nowMs + TTL_MS, current && Date.parse(state.endAt!), next && Date.parse(state.nextStartAt!)]
    .filter((x): x is number => typeof x === 'number');
  cache.set(userId, { state, validUntil: Math.min(...edges) });
  return state;
}

type Row = typeof dutySchedules.$inferSelect;

export function effectiveStatus(r: Pick<Row, 'status' | 'startAt' | 'endAt'>, now = nowDbUtc()): string {
  if (r.status === 'CANCELLED') return 'CANCELLED';
  if (now < r.startAt) return 'SCHEDULED';
  return now < r.endAt ? 'ACTIVE' : 'COMPLETED';
}

const serialize = (r: Row & { userName?: string | null; userDivision?: string | null }, now = nowDbUtc()) => ({
  id: r.id,
  user_id: r.userId,
  user_name: r.userName ?? '',
  start_at: dbUtcToIso(r.startAt),
  end_at: dbUtcToIso(r.endAt),
  status: effectiveStatus(r, now),
  notes: r.notes,
  created_by: r.createdBy,
  created_at: dbUtcToIso(r.createdAt),
  updated_at: dbUtcToIso(r.updatedAt),
});

const isoField = z.string().refine(v => !Number.isNaN(Date.parse(v)), 'harus waktu ISO 8601');

const ScheduleSchema = z.object({
  user_id: z.string().min(1),
  start_at: isoField,
  end_at: isoField,
  notes: z.string().trim().max(2000).nullish(),
});

async function requireDutyUser(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) fail(404, 'Pengguna tidak ditemukan');
  if (!isITRole(u.role)) fail(400, `Pengguna ${u.name} bukan anggota tim IT`);
  return u;
}

async function assertNoOverlap(userId: string, startAt: string, endAt: string, ignoreId?: string) {
  const [clash] = await db.select({ id: dutySchedules.id, startAt: dutySchedules.startAt, endAt: dutySchedules.endAt })
    .from(dutySchedules)
    .where(and(
      eq(dutySchedules.userId, userId), ne(dutySchedules.status, 'CANCELLED'),
      lt(dutySchedules.startAt, endAt), gt(dutySchedules.endAt, startAt),
      ignoreId ? ne(dutySchedules.id, ignoreId) : undefined,
    )).limit(1);
  if (clash) fail(409, `Bentrok dengan jadwal ${clash.id} (${dbUtcToIso(clash.startAt)} - ${dbUtcToIso(clash.endAt)})`);
}

function parseWindow(v: { start_at: string; end_at: string }) {
  const startAt = isoToDbUtc(v.start_at);
  const endAt = isoToDbUtc(v.end_at);
  if (endAt <= startAt) fail(400, 'end_at harus setelah start_at');
  return { startAt, endAt };
}

export async function listSchedules(q: { from?: string; to?: string; userId?: string; includeCancelled?: boolean } = {}) {
  const now = nowDbUtc();
  const rows = await db.select({ s: dutySchedules, userName: users.name }).from(dutySchedules)
    .innerJoin(users, eq(users.id, dutySchedules.userId))
    .where(and(
      q.userId ? eq(dutySchedules.userId, q.userId) : undefined,
      q.from ? gte(dutySchedules.endAt, isoToDbUtc(q.from)) : undefined,
      q.to ? lte(dutySchedules.startAt, isoToDbUtc(q.to)) : undefined,
      q.includeCancelled ? undefined : ne(dutySchedules.status, 'CANCELLED'),
    ))
    .orderBy(asc(dutySchedules.startAt));
  return rows.map(r => serialize({ ...r.s, userName: r.userName }, now));
}

async function getSchedule(id: string) {
  const [r] = await db.select({ s: dutySchedules, userName: users.name }).from(dutySchedules)
    .innerJoin(users, eq(users.id, dutySchedules.userId)).where(eq(dutySchedules.id, id));
  if (!r) fail(404, 'Jadwal tidak ditemukan');
  return { ...r.s, userName: r.userName };
}

export async function createSchedule(creatorId: string, input: unknown) {
  const v = parse(ScheduleSchema, input);
  const { startAt, endAt } = parseWindow(v);
  const u = await requireDutyUser(v.user_id);
  if (endAt <= nowDbUtc()) fail(400, 'Jadwal baru harus berakhir di masa depan');
  await assertNoOverlap(v.user_id, startAt, endAt);
  const ts = nowDbUtc();
  const id = newId('DTY');
  await db.insert(dutySchedules).values({
    id, userId: v.user_id, startAt, endAt, status: 'SCHEDULED', notes: v.notes ?? null,
    createdBy: creatorId, createdAt: ts, updatedAt: ts,
  });
  clearDutyCache();
  await createNotification({
    userId: v.user_id, type: 'ASSIGNED', title: 'Jadwal Duty Engineer',
    message: `Anda dijadwalkan Duty Engineer ${dbUtcToIso(startAt)} s/d ${dbUtcToIso(endAt)}`,
  }).catch(() => {});
  return serialize({ ...(await getSchedule(id)), userName: u.name });
}

export async function updateSchedule(id: string, input: unknown) {
  const cur = await getSchedule(id);
  if (effectiveStatus(cur) === 'CANCELLED' || effectiveStatus(cur) === 'COMPLETED') fail(409, 'Jadwal sudah selesai atau dibatalkan');
  const v = parse(ScheduleSchema, input);
  const { startAt, endAt } = parseWindow(v);
  await requireDutyUser(v.user_id);
  await assertNoOverlap(v.user_id, startAt, endAt, id);
  await db.update(dutySchedules).set({ userId: v.user_id, startAt, endAt, notes: v.notes ?? null, updatedAt: nowDbUtc() })
    .where(eq(dutySchedules.id, id));
  clearDutyCache();
  return serialize(await getSchedule(id));
}

export async function cancelSchedule(id: string) {
  const cur = await getSchedule(id);
  if (effectiveStatus(cur) === 'COMPLETED') fail(409, 'Jadwal sudah selesai');
  await db.update(dutySchedules).set({ status: 'CANCELLED', updatedAt: nowDbUtc() }).where(eq(dutySchedules.id, id));
  clearDutyCache();
  return serialize(await getSchedule(id));
}

const SwapSchema = z.object({
  schedule_id: z.string().min(1),
  new_user_id: z.string().min(1),
  notes: z.string().trim().max(2000).nullish(),
});

// Serah terima: jadwal lama berakhir sekarang, pengganti bertugas sekarang sampai end_at asli.
export async function swapDuty(creatorId: string, input: unknown) {
  const v = parse(SwapSchema, input);
  const old = await getSchedule(v.schedule_id);
  const now = nowDbUtc();
  if (effectiveStatus(old, now) !== 'ACTIVE') fail(409, 'Hanya jadwal yang sedang berjalan yang bisa ditukar');
  if (old.userId === v.new_user_id) fail(400, 'Petugas pengganti harus pengguna lain');
  const next = await requireDutyUser(v.new_user_id);
  await assertNoOverlap(v.new_user_id, now, old.endAt);

  const id = newId('DTY');
  const note = v.notes ? `Serah terima dari ${old.userName} ke ${next.name}: ${v.notes}` : `Serah terima dari ${old.userName} ke ${next.name}`;
  await db.transaction(async (tx) => {
    await tx.update(dutySchedules).set({ endAt: now, status: 'COMPLETED', notes: [old.notes, note].filter(Boolean).join('\n'), updatedAt: now })
      .where(eq(dutySchedules.id, old.id));
    await tx.insert(dutySchedules).values({
      id, userId: v.new_user_id, startAt: now, endAt: old.endAt, status: 'ACTIVE', notes: note,
      createdBy: creatorId, createdAt: now, updatedAt: now,
    });
  });
  clearDutyCache();
  await createNotification({
    userId: v.new_user_id, type: 'ASSIGNED', title: 'Serah terima Duty Engineer',
    message: `Anda menggantikan ${old.userName} sebagai Duty Engineer sampai ${dbUtcToIso(old.endAt)}`,
  }).catch(() => {});
  return { previous: serialize({ ...old, endAt: now, status: 'COMPLETED' }), current: serialize(await getSchedule(id)) };
}
