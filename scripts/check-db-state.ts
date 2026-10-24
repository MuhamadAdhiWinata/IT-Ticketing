import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

(async () => {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) throw new Error('DATABASE_URL belum di-set di .env');
  const c = await mysql.createConnection(dbUri);
  const [comp] = await c.query('SELECT id, name FROM companies');
  const [div] = await c.query('SELECT id, company_id, name FROM divisions');
  const [smkU] = await c.query('SELECT id FROM users WHERE id LIKE ?', ['SMK-%']);
  const [tk] = await c.query('SELECT id FROM tickets WHERE title LIKE ?', ['Smoke test%']);
  const [usr001] = await c.query('SELECT id, company_id, division_id, department FROM users WHERE id = ?', ['USR-001']);
  console.log('companies:', JSON.stringify(comp));
  console.log('divisions:', JSON.stringify(div));
  console.log('leftover SMK users:', JSON.stringify(smkU));
  console.log('leftover smoke tickets:', JSON.stringify(tk));
  console.log('USR-001 restored:', JSON.stringify(usr001));
  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
