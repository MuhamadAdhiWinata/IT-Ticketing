import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { getTriageMaster, saveTriageMaster } from '~/server/services/triage-master';
import { triageTicket } from '~/server/services/ticketing/triage';
import { DEFAULT_MATRIX, IMPACTS, PRIORITY_LEVELS, URGENCIES } from '~/utils/ticketSpec';
import { PM, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(async () => { await seedUsers(); await seedRbac(); await loadRbac(); });

const base = async () => {
  const m = await getTriageMaster();
  return {
    impacts: m.impacts, urgencies: m.urgencies, priorities: m.priorities, matrix: m.matrix,
  };
};
afterAll(async () => {
  // kembalikan nilai awal agar test lain tidak terpengaruh (tiket yang memakai KRITIS dilepas dulu)
  await db.update(tickets).set({ impact: null }).where(eq(tickets.impact, 'KRITIS'));
  await saveTriageMaster({
    impacts: IMPACTS.map(o => ({ id: o.value, label: o.label })),
    urgencies: URGENCIES.map(o => ({ id: o.value, label: o.label })),
    priorities: PRIORITY_LEVELS,
    matrix: DEFAULT_MATRIX,
  });
  await closeAll();
});

describe('master triase', () => {
  it('benih nilai awal: 3 dampak, 3 urgensi, P1-P4, matriks lengkap', async () => {
    const m = await getTriageMaster();
    expect(m.impacts.map(x => x.id)).toEqual(['LUAS', 'SEDANG', 'TERBATAS']);
    expect(m.urgencies.map(x => x.id)).toEqual(['TINGGI', 'SEDANG', 'RENDAH']);
    expect(m.priorities.map(x => x.id)).toEqual(['P1', 'P2', 'P3', 'P4']);
    expect(m.matrix.LUAS!.TINGGI).toBe('P1');
  });

  it('validasi: ID ganda, P bukan 4, sel matriks ke ID tak dikenal, label kosong', async () => {
    const b = await base();
    await expect(saveTriageMaster({ ...b, impacts: [...b.impacts, b.impacts[0]!] })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveTriageMaster({ ...b, priorities: b.priorities.slice(0, 3) })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveTriageMaster({ ...b, matrix: { ...b.matrix, NOPE: { TINGGI: 'P1' } } })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveTriageMaster({ ...b, urgencies: [{ id: 'X1', label: ' ' }] })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('master baru dipakai triase; matriks yang diubah mengubah saran prioritas; penghapusan yang dipakai ditolak', async () => {
    const b = await base();
    await saveTriageMaster({
      ...b,
      impacts: [...b.impacts, { id: 'KRITIS', label: 'Kritis Nasional', is_active: true }],
      matrix: { ...b.matrix, KRITIS: { TINGGI: 'P1', SEDANG: 'P1', RENDAH: 'P2' } },
    });
    const id = await seedTicket({ status: 'DRAFT', acknowledged: true });
    await triageTicket(PM, { ticketId: id, ticket_type: 'INSIDEN', impact: 'KRITIS', urgency: 'RENDAH' });
    const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
    expect(t!.impact).toBe('KRITIS');
    expect(t!.priority).toBe('HIGH'); // P2 dari matriks

    await expect(triageTicket(PM, { ticketId: id, impact: 'TIDAK_ADA' })).rejects.toMatchObject({ statusCode: 400 });

    const cur = await base();
    const { KRITIS: _gone, ...matrix } = cur.matrix;
    await expect(saveTriageMaster({ ...cur, impacts: cur.impacts.filter(x => x.id !== 'KRITIS'), matrix })).rejects.toMatchObject({ statusCode: 409 });
  });
});
