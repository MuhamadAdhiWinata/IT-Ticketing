import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, files } from '~/server/database/schema';
import { transitionStatus, reopenTicket } from '~/server/services/ticketing/workflow';
import { IT_A, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(seedUsers);
afterAll(closeAll);

const row = async (id: string) => (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!;
const finish = (id: string, solution?: any) => transitionStatus(IT_A, { ticketId: id, to: 'SELESAI', solution });

describe('solusi penyelesaian', () => {
  it('PERMANEN tersimpan saat SELESAI', async () => {
    const id = await seedTicket({ status: 'PROCESS', assignedTo: IT_A.id });
    await finish(id, { type: 'PERMANEN', summary: 'akar masalah diperbaiki' });
    const t = await row(id);
    expect(t.solutionType).toBe('PERMANEN');
    expect(t.resolutionSummary).toBe('akar masalah diperbaiki');
    expect(t.odooTaskUrl).toBeNull();
  });

  it('SEMENTARA wajib kedua tautan', async () => {
    const id = await seedTicket({ status: 'PROCESS', assignedTo: IT_A.id });
    await expect(finish(id, { type: 'SEMENTARA', summary: 'workaround' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(finish(id, { type: 'SEMENTARA', summary: 'workaround', odoo_task_url: 'https://odoo.test/1' })).rejects.toMatchObject({ statusCode: 400 });
    expect((await row(id)).status).toBe('PROCESS');
    await finish(id, { type: 'SEMENTARA', summary: 'workaround', odoo_task_url: 'https://odoo.test/1', tech_debt_url: 'https://odoo.test/2' });
    const t = await row(id);
    expect([t.status, t.techDebtUrl]).toEqual(['SELESAI', 'https://odoo.test/2']);
  });

  it('tautan harus http(s)', async () => {
    const id = await seedTicket({ status: 'PROCESS', assignedTo: IT_A.id });
    await expect(finish(id, { type: 'SEMENTARA', summary: 'x', odoo_task_url: 'javascript:alert(1)', tech_debt_url: 'https://a.test' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('solution hanya untuk transisi ke SELESAI', async () => {
    const id = await seedTicket({ status: 'DRAFT', assignedTo: IT_A.id });
    await expect(transitionStatus(IT_A, { ticketId: id, to: 'PROCESS', solution: { type: 'PERMANEN', summary: 'x' } })).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('reopen counter', () => {
  it('bertambah 1 setiap buka ulang', async () => {
    const id = await seedTicket({ status: 'SELESAI', assignedTo: IT_A.id });
    expect((await row(id)).reopenCount).toBe(0);
    await reopenTicket(IT_A, { ticketId: id });
    expect((await row(id)).reopenCount).toBe(1);
    await finish(id);
    await reopenTicket(IT_A, { ticketId: id });
    expect((await row(id)).reopenCount).toBe(2);
  });
});

describe('CRITICAL wajib lampiran (server, dari tabel files)', () => {
  it('DRAFT>PROCESS ditolak tanpa berkas, lolos bila sudah ada berkas', async () => {
    const id = await seedTicket({ status: 'DRAFT', priority: 'CRITICAL', assignedTo: IT_A.id });
    await expect(transitionStatus(IT_A, { ticketId: id, to: 'PROCESS' })).rejects.toMatchObject({ statusCode: 400 });
    await db.insert(files).values({
      id: `F-T-${id}`, ticketId: id, fileName: 'bukti.pdf', fileSize: '1',
      filePath: '/api/uploads/x', stage: 'REQUEST', visibility: 'USER_VISIBLE', uploadedBy: IT_A.id, uploadedAt: '2026-10-01 08:00:00',
    });
    await transitionStatus(IT_A, { ticketId: id, to: 'PROCESS' });
    expect((await row(id)).status).toBe('PROCESS');
  });
});
