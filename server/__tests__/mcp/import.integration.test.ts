import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray, like } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '~/server/database/client';
import { companies, divisions, users, categories, projectKendala, submodules, vendors } from '~/server/database/schema';
import { loadRbac, seedRbac } from '~/server/services/rbac';
import { exportCsv, importDataset, templateCsv } from '~/server/services/import';
import { IMPORT_DATASETS } from '~/utils/importSpec';
import { CLAIM, roleHas } from '~/utils/permissions';
import { parseCsv } from '~/utils/csv';
import { closeAll } from './helpers';

const P = 'IMPT-';
const csv = (...lines: string[]) => lines.join('\n');

beforeAll(async () => { await seedRbac(); await loadRbac(); });
afterAll(async () => {
  await db.delete(users).where(like(users.id, `${P}%`));
  await db.delete(submodules).where(like(submodules.id, `${P}%`));
  await db.delete(projectKendala).where(like(projectKendala.id, `${P}%`));
  await db.delete(categories).where(like(categories.id, `${P}%`));
  await db.delete(divisions).where(like(divisions.id, `${P}%`));
  await db.delete(companies).where(like(companies.id, `${P}%`));
  await db.delete(vendors).where(like(vendors.id, `${P}%`));
  await closeAll();
});

describe('klaim master.import', () => {
  it('hanya SYSTEM_ADMIN; peran lain tidak', () => {
    expect(roleHas('SYSTEM_ADMIN', CLAIM.IMPORT_MASTER)).toBe(true);
    for (const r of ['PM', 'DUTY_ENGINEER', 'IT_WORKER', 'USER_NON_IT']) expect(roleHas(r, CLAIM.IMPORT_MASTER)).toBe(false);
  });
});

describe('template dan ekspor', () => {
  it('template tiap dataset: header = kolom spec, satu baris contoh', () => {
    for (const d of IMPORT_DATASETS) {
      const t = parseCsv(templateCsv(d.key));
      expect(t[0]).toEqual(d.columns.map(c => c.name));
      expect(t).toHaveLength(2);
    }
  });

  it('dataset tidak dikenal ditolak', () => {
    expect(() => templateCsv('nope')).toThrowError(/tidak dikenal/);
  });
});

describe('import perusahaan, divisi, pengguna', () => {
  it('dryRun tidak menulis; apply membuat; ulang dengan id sama memperbarui', async () => {
    const file = csv('id,nama', `${P}C1,Impt Co Satu`, `${P}C2,Impt Co Dua`);
    const dry = await importDataset('companies', file, { dryRun: true });
    expect(dry).toMatchObject({ created: 2, updated: 0, errorCount: 0, applied: false });
    expect(await db.select().from(companies).where(like(companies.id, `${P}%`))).toHaveLength(0);

    expect(await importDataset('companies', file)).toMatchObject({ created: 2, applied: true });
    const again = await importDataset('companies', csv('id,nama', `${P}C1,Impt Co Satu Baru`));
    expect(again).toMatchObject({ created: 0, updated: 1, applied: true });
    const rows = await db.select().from(companies).where(inArray(companies.id, [`${P}C1`]));
    expect(rows[0]!.name).toBe('Impt Co Satu Baru');
  });

  it('semua-atau-tidak: satu baris salah membatalkan seluruh file', async () => {
    const r = await importDataset('companies', csv('id,nama', `${P}C3,Impt Co Tiga`, `${P}C4,`));
    expect(r.applied).toBe(false);
    expect(r.errors).toEqual([{ line: 3, message: 'kolom nama wajib diisi' }]);
    expect(await db.select().from(companies).where(inArray(companies.id, [`${P}C3`]))).toHaveLength(0);
  });

  it('id ganda di file, nama dipakai id lain, kolom wajib tak ada', async () => {
    const dup = await importDataset('companies', csv('id,nama', `${P}C5,A Impt`, `${P}C5,B Impt`));
    expect(dup.errors[0]!.message).toMatch(/dua kali/);
    const name = await importDataset('companies', csv('id,nama', `${P}C6,impt co dua`));
    expect(name.errors[0]!.message).toMatch(/sudah dipakai/);
    await expect(importDataset('companies', csv('id', 'X'))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('divisi: induk lewat nama atau id; tidak ditemukan ditolak; nama kembar ambigu', async () => {
    const ok = await importDataset('divisions', csv('id,perusahaan,nama', `${P}D1,Impt Co Dua,Keuangan`, `${P}D2,${P}C1,Keuangan`));
    expect(ok).toMatchObject({ created: 2, applied: true });
    const rows = await db.select().from(divisions).where(inArray(divisions.id, [`${P}D1`]));
    expect(rows[0]!.companyId).toBe(`${P}C2`);
    const bad = await importDataset('divisions', csv('id,perusahaan,nama', `${P}D3,Tidak Ada,X`));
    expect(bad.errors[0]!.message).toMatch(/tidak ditemukan/);
  });

  it('pengguna: validasi peran, email, unit, departemen', async () => {
    const head = 'id,nama,email,peran,perusahaan,divisi,departemen,unit,pic,password';
    const r = await importDataset('users', csv(
      head,
      `${P}U1,A,bukan-email,USER_NON_IT,,,Dept,IIE,TIDAK,`,
      `${P}U2,B,b@impt.test,PERAN_GAIB,,,Dept,IIE,TIDAK,`,
      `${P}U3,C,c@impt.test,USER_NON_IT,,,,IIE,TIDAK,`,
      `${P}U4,D,d@impt.test,USER_NON_IT,,,Dept,XYZ,TIDAK,`,
      `${P}U5,E,e@impt.test,USER_NON_IT,,,Dept,IIE,MUNGKIN,`,
      `${P}U6,F,f@impt.test,USER_NON_IT,,,Dept,IIE,TIDAK,pendek`,
    ));
    expect(r.applied).toBe(false);
    expect(r.errorCount).toBe(6);
  });

  it('pengguna: akun baru tanpa password diberi password acak sekali; akun lama tanpa password tetap; email unik', async () => {
    const head = 'id,nama,email,peran,perusahaan,divisi,departemen,unit,pic,password';
    const first = await importDataset('users', csv(
      head,
      `${P}U10,Satu,satu@impt.test,USER_NON_IT,Impt Co Dua,Keuangan,,iie,ya,`,
      `${P}U11,Dua,dua@impt.test,IT_WORKER,,,Support,,TIDAK,rahasia123`,
    ));
    expect(first).toMatchObject({ created: 2, applied: true });
    expect(first.passwords).toHaveLength(1);
    expect(first.passwords[0]!.id).toBe(`${P}U10`);

    const [u10] = await db.select().from(users).where(inArray(users.id, [`${P}U10`]));
    expect(u10).toMatchObject({ unit: 'IIE', isPic: 1, department: 'Keuangan', companyId: `${P}C2`, divisionId: `${P}D1` });
    expect(await bcrypt.compare(first.passwords[0]!.password, u10!.passwordHash!)).toBe(true);
    const [u11] = await db.select().from(users).where(inArray(users.id, [`${P}U11`]));
    expect(await bcrypt.compare('rahasia123', u11!.passwordHash!)).toBe(true);

    const upd = await importDataset('users', csv(head, `${P}U11,Dua Baru,dua@impt.test,IT_WORKER,,,Support,,TIDAK,`));
    expect(upd).toMatchObject({ created: 0, updated: 1, passwords: [] });
    const [after] = await db.select().from(users).where(inArray(users.id, [`${P}U11`]));
    expect(after!.name).toBe('Dua Baru');
    expect(after!.passwordHash).toBe(u11!.passwordHash);

    const clash = await importDataset('users', csv(head, `${P}U12,Tiga,DUA@impt.test,IT_WORKER,,,Support,,TIDAK,`));
    expect(clash.errors[0]!.message).toMatch(/sudah dipakai/);
  });

  it('pengguna: aktor tidak boleh menurunkan perannya sendiri', async () => {
    const head = 'id,nama,email,peran,departemen';
    const r = await importDataset('users', csv(head, `${P}U10,Satu,satu@impt.test,USER_NON_IT,Dept`), { actorId: `${P}U10` });
    expect(r.errors[0]!.message).toMatch(/sendiri/);
  });

  it('ekspor pengguna: password kosong, dapat diimpor ulang tanpa perubahan', async () => {
    const out = await exportCsv('users');
    const table = parseCsv(out);
    expect(table[0]).toEqual(IMPORT_DATASETS.find(d => d.key === 'users')!.columns.map(c => c.name));
    const row = table.find(x => x[0] === `${P}U10`)!;
    expect(row[row.length - 1]).toBe('');
    const mine = [table[0]!, ...table.filter(x => String(x[0]).startsWith(P))].map(x => x.join(',')).join('\n');
    expect(await importDataset('users', mine, { dryRun: true })).toMatchObject({ errorCount: 0, created: 0 });
  });
});

describe('import kategori, aplikasi, modul, vendor', () => {
  it('rantai kategori > aplikasi > modul lewat nama dan id', async () => {
    expect(await importDataset('categories', csv('id,nama', `${P}K1,Impt Kategori`))).toMatchObject({ created: 1, applied: true });
    expect(await importDataset('projectKendala', csv('id,kategori,nama', `${P}A1,Impt Kategori,Impt Aplikasi`))).toMatchObject({ created: 1, applied: true });
    expect(await importDataset('submodules', csv('id,aplikasi,nama', `${P}M1,Impt Aplikasi,Modul X`, `${P}M2,${P}A1,Modul Y`))).toMatchObject({ created: 2, applied: true });
    const rows = await db.select().from(submodules).where(inArray(submodules.id, [`${P}M1`]));
    expect(rows[0]!.projectKendalaId).toBe(`${P}A1`);
    const bad = await importDataset('submodules', csv('id,aplikasi,nama', `${P}M3,Tidak Ada,Z`));
    expect(bad.errors[0]!.message).toMatch(/tidak ditemukan/);
  });

  it('nama aplikasi kembar: pakai nama ditolak (ambigu), pakai id lolos', async () => {
    await importDataset('projectKendala', csv('id,kategori,nama', `${P}A2,${P}K1,Impt Aplikasi`));
    const amb = await importDataset('submodules', csv('id,aplikasi,nama', `${P}M4,Impt Aplikasi,Z`));
    expect(amb.errors[0]!.message).toMatch(/ambigu/);
    expect(await importDataset('submodules', csv('id,aplikasi,nama', `${P}M4,${P}A2,Z`))).toMatchObject({ created: 1, applied: true });
  });

  it('vendor: kolom opsional boleh kosong; email salah ditolak', async () => {
    expect(await importDataset('vendors', csv('id,nama,kontak,email,telepon,alamat', `${P}V1,Impt Vendor,,,,`))).toMatchObject({ created: 1, applied: true });
    const bad = await importDataset('vendors', csv('id,nama,email', `${P}V2,Impt Vendor Dua,salah`));
    expect(bad.errors[0]!.message).toMatch(/Email/);
  });

  it('pemisah titik koma dan header huruf besar diterima', async () => {
    const r = await importDataset('categories', 'ID;Nama\n' + `${P}K2;Impt Kategori Dua`);
    expect(r).toMatchObject({ created: 1, applied: true });
  });
});
