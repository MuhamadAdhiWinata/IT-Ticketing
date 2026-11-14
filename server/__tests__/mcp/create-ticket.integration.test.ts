import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { categories, projectKendala, submodules, tickets, users } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { PM, REQ, IT_A, as, closeAll, seedUsers } from './helpers';

const form = (over: Record<string, unknown> = {}) => ({
  title: 'CRT uji MI014', contact: 'wa 0812', description: 'Form MI014 gagal simpan', expected_behavior: 'Tersimpan',
  category: 'IT Programmer', project_kendala: 'CRT App', submodule: 'CRT Modul', since_at: '2026-11-10 08:00',
  affected_scope: 'SATU_PENGGUNA', work_status: 'DAPAT_MENUNGGU', evidence_steps: '<p>klik simpan</p>', unit: 'IIE', ...over,
});

beforeAll(async () => {
  await seedUsers(); await seedRbac(); await loadRbac();
  await db.insert(categories).values({ id: 'CRT-CAT', name: 'IT Programmer' }).onDuplicateKeyUpdate({ set: { name: 'IT Programmer' } });
  const cat = (await db.select().from(categories).where(eq(categories.name, 'IT Programmer')))[0]!;
  await db.insert(projectKendala).values({ id: 'CRT-APP', categoryId: cat.id, name: 'CRT App' }).onDuplicateKeyUpdate({ set: { name: 'CRT App' } });
  await db.insert(submodules).values({ id: 'CRT-MOD', projectKendalaId: 'CRT-APP', name: 'CRT Modul' }).onDuplicateKeyUpdate({ set: { name: 'CRT Modul' } });
  await db.update(users).set({ unit: 'IIE' }).where(inArray(users.id, [PM.id, REQ.id, IT_A.id]));
});
afterAll(async () => {
  await db.delete(submodules).where(eq(submodules.id, 'CRT-MOD'));
  await db.delete(projectKendala).where(eq(projectKendala.id, 'CRT-APP'));
  await db.delete(categories).where(eq(categories.id, 'CRT-CAT'));
  await closeAll();
});

describe('whoami dan form schema', () => {
  it('whoami: peran dan klaim', async () => {
    const r = await (await as(PM)).call('whoami');
    expect(r.data).toMatchObject({ id: PM.id, role: 'PM' });
    expect(r.data.claims).toContain('ticket.triage');
    const q = await (await as(REQ)).call('whoami');
    expect(q.data.claims).not.toContain('it.access');
  });

  it('form schema: aplikasi dan modul dari master, enum tiket', async () => {
    const r = await (await as(IT_A)).call('get_ticket_form_schema');
    const app = r.data.categories.find((c: any) => c.name === 'IT Programmer').applications.find((a: any) => a.name === 'CRT App');
    expect(app.modules).toEqual(['CRT Modul']);
    expect(r.data.units).toContain('IIE');
    expect(r.data.work_statuses.map((o: any) => o.value)).toContain('TERGANGGU');
  });
});

describe('create_ticket', () => {
  it('membuat tiket DRAFT diterbitkan atas nama pemanggil, lalu bisa dicari lewat isi dan filter', async () => {
    const w = await as(IT_A);
    const r = await w.call('create_ticket', form());
    expect(r.isError).toBe(false);
    expect(r.data).toMatchObject({ status: 'DRAFT', issued: true, requested_by: IT_A.id, channel: 'FORM' });

    const found = await w.call('search_tickets', { q: 'MI014', project_kendala: 'CRT App', submodule: 'CRT Modul' });
    expect(found.data.tickets.map((t: any) => t.id)).toContain(r.data.id);
    const none = await w.call('search_tickets', { q: 'MI014', project_kendala: 'Lain' });
    expect(none.data.tickets).toHaveLength(0);
  });

  it('aplikasi/modul di luar master ditolak; field wajib dicek', async () => {
    const w = await as(IT_A);
    expect((await w.call('create_ticket', form({ project_kendala: 'Ngawur' }))).isError).toBe(true);
    expect((await w.call('create_ticket', form({ submodule: 'Ngawur' }))).isError).toBe(true);
    expect((await w.call('create_ticket', form({ work_status: 'TERGANGGU' }))).isError).toBe(true);
    expect((await w.call('create_ticket', form({ evidence_steps: undefined }))).isError).toBe(true);
  });

  it('idempotencyKey: kirim ulang tidak membuat tiket ganda', async () => {
    const w = await as(IT_A);
    const key = `crt-idem-${Date.now()}`;
    const a = await w.call('create_ticket', form({ title: 'CRT idem', idempotencyKey: key }));
    const b = await w.call('create_ticket', form({ title: 'CRT idem', idempotencyKey: key }));
    expect(b.data.id).toBe(a.data.id);
    expect(b.data.idempotent_replay).toBe(true);
  });

  it('atas nama hanya untuk intake; non-intake diabaikan', async () => {
    const pm = await (await as(PM)).call('create_ticket', form({ title: 'CRT behalf', behalfUserId: REQ.id }));
    expect(pm.data).toMatchObject({ requested_by: REQ.id, created_by: PM.id });
    const w = await (await as(IT_A)).call('create_ticket', form({ title: 'CRT behalf2', behalfUserId: REQ.id }));
    expect(w.data.requested_by).toBe(IT_A.id);
  });

  it('parentTicketId menautkan tiket; link_tickets mengubah dan menghapus tautan', async () => {
    const w = await as(IT_A);
    const parent = await w.call('create_ticket', form({ title: 'CRT induk' }));
    const child = await w.call('create_ticket', form({ title: 'CRT anak', parentTicketId: parent.data.id }));
    const other = await w.call('create_ticket', form({ title: 'CRT lain' }));
    const ref = async (id: string) => (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!.referencedTicketId;
    expect(await ref(child.data.id)).toBe(parent.data.id);

    expect((await w.call('link_tickets', { ticketId: child.data.id, referencedTicketId: other.data.id })).isError).toBe(false);
    expect(await ref(child.data.id)).toBe(other.data.id);
    expect((await w.call('link_tickets', { ticketId: child.data.id })).isError).toBe(false);
    expect(await ref(child.data.id)).toBeNull();

    expect((await w.call('link_tickets', { ticketId: child.data.id, referencedTicketId: child.data.id })).isError).toBe(true);
    expect((await w.call('link_tickets', { ticketId: child.data.id, referencedTicketId: 'TCK-TIDAK-ADA' })).isError).toBe(true);
    expect((await (await as(REQ)).call('link_tickets', { ticketId: child.data.id, referencedTicketId: other.data.id })).isError).toBe(true);
    expect((await w.call('create_ticket', form({ parentTicketId: 'TCK-TIDAK-ADA' }))).isError).toBe(true);
  });
});

describe('catatan panjang', () => {
  it('komentar dan catatan internal menerima sampai 20000 karakter', async () => {
    const w = await as(IT_A);
    const t = await w.call('create_ticket', form({ title: 'CRT panjang' }));
    expect((await w.call('add_internal_note', { ticketId: t.data.id, note: 'x'.repeat(5000) })).isError).toBe(false);
    expect((await w.call('add_comment', { ticketId: t.data.id, message: 'x'.repeat(5000) })).isError).toBe(false);
  });
});
