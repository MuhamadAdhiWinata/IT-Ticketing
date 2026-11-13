import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, tickets } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { reviewTicket, triageTicket } from '~/server/services/ticketing/triage';
import { derivePhase } from '~/utils/ticketSpec';
import { IT_A, OTHER_REQ, PM, REQ, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(async () => { await seedUsers(); await seedRbac(); await loadRbac(); });
afterAll(closeAll);

const row = async (id: string) => (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!;
const actions = async (id: string) => (await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).map(l => l.action);
const waiting = async () => {
  const id = await seedTicket({ status: 'PROCESS', triaged: true, assignedTo: IT_A.id });
  await db.update(tickets).set({ waitingStartedAt: '2026-10-01 09:00:00', submittedBy: IT_A.name, solutionType: 'PANDUAN', resolutionSummary: 'ok' }).where(eq(tickets.id, id));
  return id;
};

describe('pengecekan pemohon (fase Menunggu Pemohon)', () => {
  it('pemohon: mulai cek lalu lolos, dengan pelaku dan waktu tercatat', async () => {
    const id = await waiting();
    await expect(reviewTicket(REQ, { ticketId: id, action: 'pass' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(reviewTicket(OTHER_REQ, { ticketId: id, action: 'start' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(reviewTicket(PM, { ticketId: id, action: 'start' })).rejects.toMatchObject({ statusCode: 403 });
    await reviewTicket(REQ, { ticketId: id, action: 'start' });
    await expect(reviewTicket(REQ, { ticketId: id, action: 'start' })).rejects.toMatchObject({ statusCode: 409 });
    await reviewTicket(REQ, { ticketId: id, action: 'pass' });
    const t = await row(id);
    expect([t.reviewStartedBy, t.verifiedBy, t.reviewSkipped]).toEqual([REQ.name, REQ.name, 0]);
    expect(t.verifiedAt && t.reviewStartedAt).toBeTruthy();
    expect(await actions(id)).toEqual(expect.arrayContaining(['PENGECEKAN_DIMULAI', 'PENGECEKAN_LOLOS']));
  });

  it('belum sesuai: alasan wajib, kembali ke Dikerjakan', async () => {
    const id = await waiting();
    await reviewTicket(REQ, { ticketId: id, action: 'start' });
    await expect(reviewTicket(REQ, { ticketId: id, action: 'reject' })).rejects.toMatchObject({ statusCode: 400 });
    await reviewTicket(REQ, { ticketId: id, action: 'reject', reason: 'Printer masih macet' });
    expect(derivePhase(await row(id))).toBe('Dikerjakan');
    expect(await actions(id)).toContain('PENGECEKAN_DITOLAK');
  });

  it('PM: keputusan terkunci sebelum lolos; lewati butuh alasan lalu bisa selesai', async () => {
    const id = await waiting();
    await expect(reviewTicket(PM, { ticketId: id, action: 'finish', outcome: 'SELESAI' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(triageTicket(PM, { ticketId: id, transfer_target: 'IT_SUPPORT' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(reviewTicket(IT_A, { ticketId: id, action: 'skip', reason: 'x' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(reviewTicket(PM, { ticketId: id, action: 'skip' })).rejects.toMatchObject({ statusCode: 400 });
    await reviewTicket(PM, { ticketId: id, action: 'skip', reason: 'Pemohon tidak merespons 3 hari' });
    expect(await row(id)).toMatchObject({ reviewSkipped: 1, verifiedBy: PM.name });
    await reviewTicket(PM, { ticketId: id, action: 'finish', outcome: 'SELESAI' });
    const t = await row(id);
    expect([t.status, t.closedAt, derivePhase(t)]).toEqual(['SELESAI', null, 'Selesai']);
    expect(await actions(id)).toEqual(expect.arrayContaining(['PENGECEKAN_DILEWATI', 'TIKET_DISELESAIKAN']));
  });

  it('PM: lolos pemohon lalu Tutup atau Alihkan', async () => {
    const a = await waiting();
    await db.update(tickets).set({ verifiedAt: '2026-10-01 10:00:00', verifiedBy: REQ.name }).where(eq(tickets.id, a));
    await reviewTicket(PM, { ticketId: a, action: 'finish', outcome: 'DITUTUP' });
    expect((await row(a)).closedAt).toBeTruthy();

    const b = await waiting();
    await db.update(tickets).set({ verifiedAt: '2026-10-01 10:00:00' }).where(eq(tickets.id, b));
    await triageTicket(PM, { ticketId: b, transfer_target: 'IT_SUPPORT' });
    expect((await row(b)).transferTarget).toBe('IT_SUPPORT');
    expect((await row(b)).waitingEndedAt).toBeTruthy();
  });

  it('menolak di luar fase Menunggu Pemohon', async () => {
    const id = await seedTicket({ status: 'PROCESS', triaged: true, assignedTo: IT_A.id });
    await expect(reviewTicket(REQ, { ticketId: id, action: 'start' })).rejects.toMatchObject({ statusCode: 409 });
  });
});
