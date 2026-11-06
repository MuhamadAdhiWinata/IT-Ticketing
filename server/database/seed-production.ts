import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { users, userPreferences, companySettings } from './schema';

// Seeder production: data kosong, hanya akun admin + baris company_settings 'default'.
// Tidak menghapus apa pun dan aman diulang: yang sudah ada dilewati.
// Kategori, aplikasi, perusahaan, divisi, dan user lain diisi admin lewat menu Master Data.

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

console.log('[SEED:PROD] Selesai.');
process.exit(0);
