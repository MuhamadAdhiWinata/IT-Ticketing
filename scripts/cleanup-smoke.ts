import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

(async () => {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) throw new Error('DATABASE_URL belum di-set di .env');
  const c = await mysql.createConnection(dbUri);
  await c.query('SET FOREIGN_KEY_CHECKS = 0');
  const [r] = await c.query('DELETE FROM tickets WHERE title LIKE ?', ['Smoke test%']);
  console.log('smoke tickets removed:', JSON.stringify((r as any).affectedRows));
  await c.query('SET FOREIGN_KEY_CHECKS = 1');
  const [left] = await c.query('SELECT id, title FROM tickets WHERE title LIKE ?', ['Smoke test%']);
  console.log('remaining:', JSON.stringify(left));
  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
