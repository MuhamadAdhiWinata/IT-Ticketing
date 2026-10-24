// Hapus data uji sisa dari skrip verifikasi.
// Endpoint DELETE /api/tickets/:id sudah ada, tetapi skrip ini berjalan tanpa sesi login,
// jadi penghapusan massal tetap lewat SQL: anak (audit_logs, dll.) memakai FK NO ACTION,
// jadi anaknya dihapus dulu baru tiketnya.
// Jalankan: npx tsx scripts/cleanup-test-data.ts
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const TEST_TICKET_TITLES = ['Smoke test%', 'Tiket uji identitas%'];
const CHILD_TABLES = ['audit_logs', 'attachments', 'worklogs', 'ticket_members'];

(async () => {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) throw new Error('DATABASE_URL belum di-set di .env');
  const c = await mysql.createConnection(dbUri);

  let total = 0;
  for (const pattern of TEST_TICKET_TITLES) {
    for (const table of CHILD_TABLES) {
      const [r] = await c.query(
        `DELETE FROM \`${table}\` WHERE ticket_id IN (SELECT id FROM (SELECT id FROM tickets WHERE title LIKE ?) AS t)`,
        [pattern]
      );
      if ((r as any).affectedRows) console.log(`  ${table}: ${(r as any).affectedRows} baris anak dihapus`);
    }
    const [d] = await c.query('DELETE FROM tickets WHERE title LIKE ?', [pattern]);
    console.log(`tiket uji "${pattern}" dihapus: ${(d as any).affectedRows}`);
    total += (d as any).affectedRows;
  }

  const [leftover] = await c.query(
    'SELECT (SELECT COUNT(1) FROM companies WHERE id IN (?, ?)) AS comp,' +
    ' (SELECT COUNT(1) FROM divisions WHERE id IN (?, ?)) AS dvs,' +
    ' (SELECT COUNT(1) FROM users WHERE id = ?) AS usr,' +
    ' (SELECT COUNT(1) FROM tickets WHERE title LIKE ?) AS tk',
    ['COMP-MAJU', 'COMP-KEDUA', 'DIV-KEUANGAN', 'DIV-OPS', 'USR-901', '%uji identitas%']
  );
  console.log('sisa data uji:', JSON.stringify(leftover));
  console.log(total >= 0 ? 'CLEANUP OK' : 'CLEANUP GAGAL');

  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
