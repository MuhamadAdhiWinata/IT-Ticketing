import { config } from 'dotenv';
import { resolve } from 'path';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

config({ path: resolve(process.cwd(), '.env') });

// Test integrasi menulis ke DB sungguhan: wajib DB terpisah, tidak pernah DATABASE_URL.
export default async function setup() {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error('DATABASE_URL_TEST wajib diisi (DB test terpisah). Test dibatalkan.');
  }
  const dbName = new URL(testUrl.replace(/^mysql2:/, 'mysql:')).pathname.slice(1);
  if (testUrl === process.env.DATABASE_URL || !/test/i.test(dbName)) {
    throw new Error(`DATABASE_URL_TEST ("${dbName}") harus berbeda dari DATABASE_URL dan namanya memuat "test".`);
  }

  const conn = await mysql.createConnection(testUrl);
  // Mulai dari skema bersih supaya hasil test tidak bergantung pada run sebelumnya.
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables]: any = await conn.query('SHOW TABLES');
  for (const row of tables) await conn.query(`DROP TABLE IF EXISTS \`${Object.values(row)[0]}\``);
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await migrate(drizzle(conn), { migrationsFolder: resolve(process.cwd(), 'drizzle') });
  await conn.end();
}
