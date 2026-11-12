import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, dutySchedules } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import {
  cancelSchedule, clearDutyCache, createSchedule, effectiveStatus, getDutyState, listSchedules, swapDuty, updateSchedule,
} from '~/server/services/duty';
import { acknowledgeTicket } from '~/server/services/ticketing/triage';
import { toActor } from '~/server/services/ticketing/common';
import { CLAIM, claimsOf, roleHas } from '~/utils/permissions';
import { isITRole, isDutyRole } from '~/utils/roles';
import { dbUtcToIso, isoToDbUtc, isoToLocalInput, localInputToIso } from '~/utils/utcTime';
import { IT_A, IT_B, PM, closeAll, seedTicket, seedUsers } from './helpers';

const H = 3_600_000;
const iso = (h: number) => new Date(Date.now() + h * H).toISOString();
const mk = (user: typeof IT_A, s: number, e: number) => createSchedule(PM.id, { user_id: user.id, start_at: iso(s), end_at: iso(e) });

beforeAll(async () => { await seedUsers(); await seedRbac(); await loadRbac(); });
afterAll(async () => {
  await db.delete(auditLogs).where(eq(auditLogs.performedBy, IT_A.id));
  await db.delete(dutySchedules).where(inArray(dutySchedules.userId, [IT_A.id, IT_B.id]));
  await closeAll();
});

const wipe = async () => { await db.delete(dutySchedules).where(inArray(dutySchedules.userId, [IT_A.id, IT_B.id])); clearDutyCache(); };

describe('klaim duty dinamis', () => {
  it('dutyActive menggabungkan klaim DUTY_ENGINEER tanpa mengubah peran', () => {
    expect(roleHas('IT_WORKER', CLAIM.DUTY)).toBe(false);
    expect(roleHas('IT_WORKER', CLAIM.DUTY, true)).toBe(true);
    expect(isDutyRole('IT_WORKER', true)).toBe(true);
    expect(isITRole('IT_WORKER', true)).toBe(true);
    expect(claimsOf('IT_WORKER', true)).toEqual(expect.arrayContaining(claimsOf('IT_WORKER')));
    expect(claimsOf('IT_WORKER')).not.toContain(CLAIM.DUTY);
    expect(claimsOf('IT_WORKER', true)).toContain(CLAIM.DUTY);
  });
});

describe('getDutyState', () => {
  it('aktif hanya di dalam jendela, ISO UTC, dan next dalam 24 jam', async () => {
    await wipe();
    expect((await getDutyState(IT_A.id)).active).toBe(false);
    await mk(IT_A, -1, 2);
    await mk(IT_A, 5, 8);
    await mk(IT_A, 30, 33);
    const s = await getDutyState(IT_A.id);
    expect(s.active).toBe(true);
    expect(s.endAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/);
    expect(Date.parse(s.endAt!) - Date.now()).toBeGreaterThan(1.9 * H);
    expect(Date.parse(s.nextStartAt!) - Date.now()).toBeLessThan(5.1 * H);
  });

  it('jadwal dibatalkan, belum mulai, dan lewat tidak memberi akses', async () => {
    await wipe();
    const c = await mk(IT_A, -1, 2);
    await cancelSchedule(c.id);
    await mk(IT_A, 3, 5);
    await db.insert(dutySchedules).values({
      id: 'DTY-T-PAST', userId: IT_A.id, startAt: isoToDbUtc(iso(-9)), endAt: isoToDbUtc(iso(-3)), status: 'ACTIVE',
      createdBy: PM.id, createdAt: isoToDbUtc(iso(0)), updatedAt: isoToDbUtc(iso(0)),
    });
    clearDutyCache();
    expect((await getDutyState(IT_A.id)).active).toBe(false);
  });

  it('cache tidak melewati akhir shift', async () => {
    await wipe();
    await mk(IT_A, -1, 1);
    const s = await getDutyState(IT_A.id, Date.now());
    expect(s.active).toBe(true);
    expect((await getDutyState(IT_A.id, Date.now() + 2 * H)).active).toBe(false);
  });
});

describe('CRUD jadwal', () => {
  it('menolak overlap, jendela terbalik, dan non-IT', async () => {
    await wipe();
    await mk(IT_A, 1, 5);
    await expect(mk(IT_A, 4, 6)).rejects.toMatchObject({ statusCode: 409 });
    await expect(mk(IT_A, 5, 6)).resolves.toBeTruthy(); // bersebelahan, bukan overlap
    await expect(mk(IT_A, 9, 8)).rejects.toMatchObject({ statusCode: 400 });
    await expect(createSchedule(PM.id, { user_id: 'T-REQ', start_at: iso(1), end_at: iso(2) })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('update memeriksa overlap, cancel melepas slot, status turunan', async () => {
    await wipe();
    const a = await mk(IT_A, 1, 3);
    const b = await mk(IT_A, 4, 6);
    await expect(updateSchedule(b.id, { user_id: IT_A.id, start_at: iso(2), end_at: iso(6) })).rejects.toMatchObject({ statusCode: 409 });
    await cancelSchedule(a.id);
    await expect(updateSchedule(b.id, { user_id: IT_A.id, start_at: iso(2), end_at: iso(6) })).resolves.toBeTruthy();
    const list = await listSchedules({ userId: IT_A.id, includeCancelled: true });
    expect(list.find(x => x.id === a.id)!.status).toBe('CANCELLED');
    expect(list.find(x => x.id === b.id)!.status).toBe('SCHEDULED');
    expect(effectiveStatus({ status: 'SCHEDULED', startAt: '2026-01-01 00:00:00', endAt: '2026-01-01 08:00:00' }, '2026-01-01 04:00:00')).toBe('ACTIVE');
  });
});

describe('swap', () => {
  it('menutup jadwal lama sekarang dan membuat jadwal pengganti sampai end_at asli', async () => {
    await wipe();
    const cur = await mk(IT_A, -1, 6);
    const r = await swapDuty(PM.id, { schedule_id: cur.id, new_user_id: IT_B.id, notes: 'sakit' });
    expect(r.current.end_at).toBe(cur.end_at);
    expect(Date.parse(r.previous.end_at)).toBeLessThanOrEqual(Date.now() + 1000);
    expect(r.current.notes).toContain('sakit');
    expect((await getDutyState(IT_A.id)).active).toBe(false);
    expect((await getDutyState(IT_B.id)).active).toBe(true);
    await expect(swapDuty(PM.id, { schedule_id: cur.id, new_user_id: IT_B.id })).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('audit on_duty', () => {
  it('log yang ditulis saat ON DUTY ditandai, di luar shift tidak', async () => {
    await wipe();
    const t1 = await seedTicket({ status: 'DRAFT' });
    const t2 = await seedTicket({ status: 'DRAFT' });
    await acknowledgeTicket(PM, { ticketId: t1 });
    await acknowledgeTicket({ ...toActor(PM), dutyActive: true }, { ticketId: t2 });
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, 'TIKET_DIAKUI'));
    expect(logs.find(l => l.ticketId === t1)!.onDuty).toBe(0);
    expect(logs.find(l => l.ticketId === t2)!.onDuty).toBe(1);
  });
});

describe('konversi zona', () => {
  it('ISO UTC <-> DB UTC <-> input lokal konsisten', () => {
    const z = '2026-11-12T17:30:00.000Z';
    expect(isoToDbUtc(z)).toBe('2026-11-12 17:30:00');
    expect(dbUtcToIso('2026-11-12 17:30:00')).toBe(z);
    expect(localInputToIso(isoToLocalInput(z))).toBe(z);
  });
});
