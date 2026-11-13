import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, tickets } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { moveTicketPhase } from '~/server/services/ticketing/workflow';
import { derivePhase } from '~/utils/ticketSpec';
import { IT_A, PM, REQ, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(async () => { await seedUsers(); await seedRbac(); await loadRbac(); });
afterAll(closeAll);

const phaseOf = async (id: string) => derivePhase((await db.select().from(tickets).where(eq(tickets.id, id)))[0]!);
const logs = async (id: string) => (await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).filter(l => l.action === 'FASE_DIPINDAHKAN');

describe('pindah fase (kanban)', () => {
  it('maju dan mundur bebas, tiap perpindahan tercatat di audit log', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await db.update(tickets).set({ ticketType: 'PERTANYAAN', solutionType: 'PANDUAN', resolutionSummary: 'ok' }).where(eq(tickets.id, id));
    for (const to of ['Diakui', 'Ditriase', 'Dikerjakan', 'Menunggu Pemohon', 'Dikerjakan', 'Selesai', 'Dikerjakan', 'Ditriase', 'Baru'] as const) {
      await moveTicketPhase(PM, { ticketId: id, to });
      expect(await phaseOf(id)).toBe(to);
    }
    const l = await logs(id);
    expect(l).toHaveLength(9);
    expect(l[0]!.detail).toBe('Baru -> Diakui');
    expect(l.at(-1)!.detail).toBe('Ditriase -> Baru');
    expect(l.every(x => x.performedBy === PM.id)).toBe(true);
  });

  it('menolak: fase sama, ke Dikerjakan tanpa triase, fase awal oleh non-PM, non-IT', async () => {
    const id = await seedTicket({ status: 'DRAFT', acknowledged: true });
    await expect(moveTicketPhase(PM, { ticketId: id, to: 'Diakui' })).rejects.toMatchObject({ statusCode: 409 });
    await expect(moveTicketPhase(PM, { ticketId: id, to: 'Dikerjakan' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(moveTicketPhase(IT_A, { ticketId: id, to: 'Baru' })).rejects.toMatchObject({ statusCode: 403 });
    await expect(moveTicketPhase(REQ, { ticketId: id, to: 'Ditriase' })).rejects.toMatchObject({ statusCode: 403 });
    expect(await logs(id)).toHaveLength(0);
  });

  it('worker boleh Dikerjakan <-> Menunggu Pemohon <-> Selesai', async () => {
    const id = await seedTicket({ status: 'PROCESS', triaged: true, assignedTo: IT_A.id });
    await expect(moveTicketPhase(IT_A, { ticketId: id, to: 'Menunggu Pemohon' })).rejects.toMatchObject({ statusCode: 400 });
    await db.update(tickets).set({ solutionType: 'PANDUAN', resolutionSummary: 'ok' }).where(eq(tickets.id, id));
    await moveTicketPhase(IT_A, { ticketId: id, to: 'Menunggu Pemohon' });
    expect(await phaseOf(id)).toBe('Menunggu Pemohon');
    await expect(moveTicketPhase(IT_A, { ticketId: id, to: 'Selesai' })).rejects.toMatchObject({ statusCode: 409 });
    await db.update(tickets).set({ verifiedAt: '2026-10-01 09:00:00' }).where(eq(tickets.id, id));
    await moveTicketPhase(IT_A, { ticketId: id, to: 'Selesai' });
    expect(await phaseOf(id)).toBe('Selesai');
    await moveTicketPhase(IT_A, { ticketId: id, to: 'Dikerjakan' });
    expect(await phaseOf(id)).toBe('Dikerjakan');
    expect(await logs(id)).toHaveLength(3);
  });
});
