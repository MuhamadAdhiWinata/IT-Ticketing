import { loadRbac, seedRbac } from '~/server/services/rbac';

// Saat start: benih peran/klaim/menu bawaan (idempoten) lalu muat matriks dari DB.
// Bila tabel belum dimigrasi, server tetap jalan dengan matriks bawaan di utils/permissions.ts.
export default defineNitroPlugin(async () => {
  try {
    await seedRbac();
    await loadRbac();
  } catch (e: any) {
    console.error('[rbac] seed/load gagal (sudah menjalankan drizzle-kit migrate?):', e?.message);
  }
});
