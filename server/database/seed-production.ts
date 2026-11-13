import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { seedRbac } from '../services/rbac';
import { seedSlaMaster } from '../services/sla-master';
import { importDataset } from '../services/import';
import { IMPORT_DATASETS } from '../../utils/importSpec';
import { users, userPreferences, companySettings, categories } from './schema';

// Seeder production: data kosong, hanya akun admin, company_settings 'default', dan 2 kategori.
// Tidak menghapus apa pun dan aman diulang: yang sudah ada dilewati.
// Aplikasi/Kendala, perusahaan, divisi, dan user lain diisi admin lewat menu Master Data.

const ADMIN = { id: 'ADMIN-001', name: 'Administrator IT', email: 'sysadmin@company.co.id', department: 'Enterprise IT Governance' };
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

console.log('[SEED:PROD] Mulai...');

const existingAdmin = (await db.select({ id: users.id }).from(users).where(eq(users.email, ADMIN.email)))[0];
if (existingAdmin) {
  console.log(`[SEED:PROD] Admin ${ADMIN.email} sudah ada, dilewati (password tidak diubah).`);
} else {
  const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString('base64url');
  await db.insert(users).values({
    ...ADMIN, role: 'SYSTEM_ADMIN', passwordHash: await bcrypt.hash(password, 10), companyId: null, divisionId: null, avatarUrl: null,
  });
  await db.insert(userPreferences).values({ userId: ADMIN.id, darkMode: 0 }).onDuplicateKeyUpdate({ set: { darkMode: 0 } });
  console.log(`[SEED:PROD] Admin dibuat: ${ADMIN.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`[SEED:PROD] Password sementara (catat sekarang, tidak ditampilkan lagi): ${password}`);
  }
}

// Dibaca GET /api/settings/company (publik, halaman login); tanpa baris ini tema jatuh ke bawaan kode.
await db.insert(companySettings).values({
  id: 'default', companyName: 'Neutron', primaryColor: '#b10202', primaryHoverColor: '#920202', primaryActiveColor: '#740101',
  createdAt: now, updatedAt: now,
}).onDuplicateKeyUpdate({ set: { id: 'default' } });
console.log("[SEED:PROD] company_settings 'default' siap.");

// Form tiket mencari kategori dengan nama persis ini; tanpa keduanya tiket tidak bisa dibuat.
await db.insert(categories).values([
  { id: 'CAT-01', name: 'Support IT' },
  { id: 'CAT-02', name: 'IT Programmer' },
]).onDuplicateKeyUpdate({ set: { name: sql`name` } });
console.log('[SEED:PROD] categories: Support IT, IT Programmer siap.');

await seedRbac();
console.log('[SEED:PROD] peran, klaim, dan menu bawaan siap.');

await seedSlaMaster();
console.log('[SEED:PROD] master SLA bawaan siap.');

// Opsional: SEED_DIR=<folder> berisi <dataset>.csv (format = template di menu Import), mis. users.csv, companies.csv.
// Diimpor berurutan dengan aturan yang sama dengan UI (id baru dibuat, id lama diperbarui, semua-atau-tidak per file).
const seedDir = process.env.SEED_DIR;
if (seedDir) {
  for (const { key } of IMPORT_DATASETS) {
    const file = resolve(process.cwd(), seedDir, `${key}.csv`);
    if (!existsSync(file)) continue;
    const r = await importDataset(key, readFileSync(file, 'utf8'));
    if (r.errorCount) {
      console.error(`[SEED:PROD] ${key}.csv gagal (${r.errorCount} kesalahan):`);
      r.errors.forEach(e => console.error(`  baris ${e.line}: ${e.message}`));
      process.exit(1);
    }
    console.log(`[SEED:PROD] ${key}.csv: ${r.created} dibuat, ${r.updated} diperbarui.`);
    r.passwords.forEach(p => console.log(`[SEED:PROD] Password sementara ${p.email}: ${p.password}`));
  }
}

console.log('[SEED:PROD] Selesai.');
process.exit(0);
