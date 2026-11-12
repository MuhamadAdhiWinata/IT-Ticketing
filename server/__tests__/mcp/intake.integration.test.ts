import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { acknowledgeTicket, startTriage, acceptTicket, confirmDuty, triageTicket, updateExecution, closeTicket } from '~/server/services/ticketing/triage';
import { transitionStatus } from '~/server/services/ticketing/workflow';
import { DUTY, IT_A, IT_B, PM, REQ, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(seedUsers);
afterAll(closeAll);

const row = async (id: string) => (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!;

describe('Akui / Terima', () => {
  it('Akui mengisi acknowledgedAt sekali (idempoten)', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(acknowledgeTicket(IT_A, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await acknowledgeTicket(PM, { ticketId: id });
    const first = (await row(id)).acknowledgedAt;
    expect(first).toBeTruthy();
    await acknowledgeTicket(PM, { ticketId: id });
    expect((await row(id)).acknowledgedAt).toBe(first);
  });
  it('Akui ditolak untuk pemohon', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(acknowledgeTicket(REQ, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
  });
  it('Terima hanya oleh Pelaksana', async () => {
    const id = await seedTicket({ status: 'DRAFT', assignedTo: IT_A.id });
    await expect(acceptTicket(IT_B, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await acceptTicket(IT_A, { ticketId: id });
    expect((await row(id)).acceptedAt).toBeTruthy();
  });
});

describe('Mulai Triase', () => {
  it('hanya PM/admin, wajib sudah diakui, idempoten', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(startTriage(PM, { ticketId: id })).rejects.toMatchObject({ statusCode: 409 });
    await acknowledgeTicket(PM, { ticketId: id });
    await expect(startTriage(IT_A, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await startTriage(PM, { ticketId: id });
    const first = (await row(id)).triagedAt;
    expect(first).toBeTruthy();
    await startTriage(PM, { ticketId: id });
    expect((await row(id)).triagedAt).toBe(first);
  });
  it('menyimpan triase otomatis mengisi triagedAt', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await triageTicket(PM, { ticketId: id, ticket_type: 'PERTANYAAN' });
    expect((await row(id)).triagedAt).toBeTruthy();
  });
});

describe('Triase PM', () => {
  it('hanya PM/admin yang boleh', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(triageTicket(IT_A, { ticketId: id, ticket_type: 'INSIDEN' })).rejects.toMatchObject({ statusCode: 403 });
  });
  it('Insiden: prioritas otomatis dari matriks', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await triageTicket(PM, { ticketId: id, ticket_type: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI' });
    const t = await row(id);
    expect([t.ticketType, t.priority]).toEqual(['INSIDEN', 'CRITICAL']);
  });
  it('ubah prioritas manual/jenis wajib alasan', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await triageTicket(PM, { ticketId: id, ticket_type: 'INSIDEN', impact: 'SEDANG', urgency: 'SEDANG' });
    await expect(triageTicket(PM, { ticketId: id, priority: 'P1' })).rejects.toMatchObject({ statusCode: 400 });
    await triageTicket(PM, { ticketId: id, priority: 'P1', change_reason: 'berdampak ujian' });
    expect((await row(id)).priority).toBe('CRITICAL');
    await expect(triageTicket(PM, { ticketId: id, ticket_type: 'PERTANYAAN' })).rejects.toMatchObject({ statusCode: 400 });
  });
  it('simpan ulang tanpa perubahan tidak menimpa prioritas manual', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await triageTicket(PM, { ticketId: id, ticket_type: 'INSIDEN', impact: 'SEDANG', urgency: 'SEDANG' });
    await triageTicket(PM, { ticketId: id, priority: 'P2', change_reason: 'ujian' });
    await triageTicket(PM, { ticketId: id, ticket_type: 'INSIDEN', impact: 'SEDANG', urgency: 'SEDANG' });
    expect((await row(id)).priority).toBe('HIGH');
  });
  it('prioritas hanya untuk Insiden', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(triageTicket(PM, { ticketId: id, ticket_type: 'PERTANYAAN', priority: 'P2' })).rejects.toMatchObject({ statusCode: 400 });
  });
  it('PL: Data wajib persetujuan PIC', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await expect(triageTicket(PM, { ticketId: id, ticket_type: 'PL_DATA', catalog_item: 'PL-02' })).rejects.toMatchObject({ statusCode: 400 });
    await triageTicket(PM, { ticketId: id, ticket_type: 'PL_DATA', catalog_item: 'PL-02', data_approval_note: 'disetujui PIC 6/11' });
    expect((await row(id)).catalogItem).toBe('PL-02');
  });
  it('pengalihan Duplikat wajib tiket valid dan menutup tiket', async () => {
    const orig = await seedTicket({ status: 'PROCESS' });
    const dup = await seedTicket({ status: 'DRAFT' });
    await expect(triageTicket(PM, { ticketId: dup, transfer_target: 'DUPLIKAT' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(triageTicket(PM, { ticketId: dup, transfer_target: 'DUPLIKAT', duplicate_of: 'NOPE' })).rejects.toMatchObject({ statusCode: 400 });
    await triageTicket(PM, { ticketId: dup, transfer_target: 'DUPLIKAT', duplicate_of: orig });
    const t = await row(dup);
    expect([t.status, t.transferTarget, t.referencedTicketId]).toEqual(['SELESAI', 'DUPLIKAT', orig]);
  });
});

describe('Duty Engineer', () => {
  it('Insiden P1/P2 tidak bisa diproses tanpa konfirmasi', async () => {
    const id = await seedTicket({ status: 'DRAFT', ticketType: 'INSIDEN', priority: 'HIGH', assignedTo: IT_A.id });
    await expect(transitionStatus(PM, { ticketId: id, to: 'PROCESS' })).rejects.toMatchObject({ statusCode: 400 });
    await expect(confirmDuty(IT_A, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await confirmDuty(DUTY, { ticketId: id });
    const t = await row(id);
    expect([t.dutyConfirmedBy, !!t.dutyConfirmedAt]).toEqual(['Duty', true]);
    await transitionStatus(PM, { ticketId: id, to: 'PROCESS' });
    expect((await row(id)).status).toBe('PROCESS');
  });
  it('Insiden P3 tidak butuh konfirmasi', async () => {
    const id = await seedTicket({ status: 'DRAFT', ticketType: 'INSIDEN', priority: 'MEDIUM', assignedTo: IT_A.id });
    await transitionStatus(PM, { ticketId: id, to: 'PROCESS' });
    expect((await row(id)).status).toBe('PROCESS');
  });
});

describe('Eksekusi Pelaksana', () => {
  it('Menunggu Pemohon mencatat mulai dan akhir', async () => {
    const id = await seedTicket({ status: 'PROCESS', assignedTo: IT_A.id });
    await updateExecution(IT_A, { ticketId: id, waiting: true });
    expect((await row(id)).waitingStartedAt).toBeTruthy();
    await expect(updateExecution(IT_A, { ticketId: id, waiting: true })).rejects.toMatchObject({ statusCode: 409 });
    await updateExecution(IT_A, { ticketId: id, waiting: false });
    expect((await row(id)).waitingEndedAt).toBeTruthy();
  });
  it('Tertahan Oleh dan tautan Odoo', async () => {
    const id = await seedTicket({ status: 'PROCESS', assignedTo: IT_A.id });
    await updateExecution(IT_A, { ticketId: id, blocked_by: 'RILIS', odoo_task_url: 'https://odoo.test/9' });
    const t = await row(id);
    expect([t.blockedBy, t.odooTaskUrl]).toEqual(['RILIS', 'https://odoo.test/9']);
    await expect(updateExecution(IT_A, { ticketId: id, odoo_task_url: 'javascript:1' })).rejects.toMatchObject({ statusCode: 400 });
  });
  it('Tutup hanya PM dan hanya tiket SELESAI', async () => {
    const id = await seedTicket({ status: 'SELESAI' });
    await expect(closeTicket(IT_A, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await closeTicket(PM, { ticketId: id });
    expect((await row(id)).closedAt).toBeTruthy();
    const open = await seedTicket({ status: 'PROCESS' });
    await expect(closeTicket(PM, { ticketId: open })).rejects.toMatchObject({ statusCode: 409 });
  });
});
