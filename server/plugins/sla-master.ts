import { getSlaMaster } from '~/server/services/sla-master';

// Saat start: isi master SLA bila masih kosong (idempoten). Tanpa migrasi 0010 server tetap jalan.
export default defineNitroPlugin(async () => {
  try {
    await getSlaMaster();
  } catch (e: any) {
    console.error('[sla-master] seed/load gagal (sudah menjalankan drizzle-kit migrate?):', e?.message);
  }
});
