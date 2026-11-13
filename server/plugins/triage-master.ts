import { getTriageMaster } from '~/server/services/triage-master';

// Saat start: isi master Dampak/Urgensi/Prioritas bila masih kosong (idempoten). Tanpa migrasi 0009 server tetap jalan.
export default defineNitroPlugin(async () => {
  try {
    await getTriageMaster();
  } catch (e: any) {
    console.error('[triage-master] seed/load gagal (sudah menjalankan drizzle-kit migrate?):', e?.message);
  }
});
