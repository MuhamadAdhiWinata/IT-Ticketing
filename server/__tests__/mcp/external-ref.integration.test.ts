import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { categories, projectKendala, users } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { IT_A, as, closeAll, seedUsers } from './helpers';

const form = (over: Record<string, unknown> = {}) => ({
  title: 'XREF uji', contact: 'wa 0812', description: 'tanpa kode di isi', expected_behavior: 'ok',
  category: 'IT Programmer', project_kendala: 'XREF App', since_at: '2026-11-10 08:00',
  affected_scope: 'SATU_PENGGUNA', work_status: 'DAPAT_MENUNGGU', evidence_steps: '<p>x</p>', unit: 'IIE', ...over,
});

beforeAll(async () => {
  await seedUsers(); await seedRbac(); await loadRbac();
  await db.insert(categories).values({ id: 'XREF-CAT', name: 'IT Programmer' }).onDuplicateKeyUpdate({ set: { name: 'IT Programmer' } });
  const cat = (await db.select().from(categories).where(eq(categories.name, 'IT Programmer')))[0]!;
  await db.insert(projectKendala).values({ id: 'XREF-APP', categoryId: cat.id, name: 'XREF App' }).onDuplicateKeyUpdate({ set: { name: 'XREF App' } });
  await db.update(users).set({ unit: 'IIE' }).where(eq(users.id, IT_A.id));
});
afterAll(async () => {
  await db.delete(projectKendala).where(eq(projectKendala.id, 'XREF-APP'));
  await db.delete(categories).where(eq(categories.id, 'XREF-CAT'));
  await closeAll();
});

describe('external_ref', () => {
  it('disimpan, muncul di detail dan hasil cari, cocok persis lewat filter, dan ikut pencarian teks', async () => {
    const w = await as(IT_A);
    const a = await w.call('create_ticket', form({ external_ref: 'MI014 / D-MST-039' }));
    const b = await w.call('create_ticket', form({ title: 'XREF lain', external_ref: 'MI014 / D-MST-040' }));
    expect(a.isError).toBe(false);
    expect(a.data.external_ref).toBe('MI014 / D-MST-039');

    const exact = await w.call('search_tickets', { external_ref: 'MI014 / D-MST-039' });
    expect(exact.data.tickets.map((t: any) => t.id)).toEqual([a.data.id]);
    expect(exact.data.tickets[0].external_ref).toBe('MI014 / D-MST-039');

    const text = await w.call('search_tickets', { q: 'D-MST-04' });
    expect(text.data.tickets.map((t: any) => t.id)).toContain(b.data.id);

    const detail = await w.call('get_ticket', { ticketId: a.data.id });
    expect(detail.data.external_ref).toBe('MI014 / D-MST-039');
  });

  it('opsional dan dibatasi 100 karakter', async () => {
    const w = await as(IT_A);
    const none = await w.call('create_ticket', form({ title: 'XREF kosong' }));
    expect(none.data.external_ref).toBeNull();
    expect((await w.call('create_ticket', form({ external_ref: 'x'.repeat(101) }))).isError).toBe(true);
  });
});
