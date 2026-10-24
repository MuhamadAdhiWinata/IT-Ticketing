// Terapkan migrasi Diskusi Tiket (komentar + internal note) ke DB lokal (aditif, aman dijalankan ulang).
// Jalankan: npx tsx -r dotenv/config scripts/apply-discussion-migration.ts
//
// Blok DDL identik dengan migrate.sql baris 37-60. Collation dipaksa utf8mb4_unicode_ci
// seperti tabel lain; kalau beda, pembuatan FK gagal errno 150.
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const CREATE_COMMENTS = `CREATE TABLE IF NOT EXISTS \`comments\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`ticket_id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`user_name\` VARCHAR(255) NOT NULL,
  \`user_role\` VARCHAR(50) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL,
  INDEX \`idx_comments_ticket\` (\`ticket_id\`),
  CONSTRAINT \`fk_comments_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`),
  CONSTRAINT \`fk_comments_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

const CREATE_INTERNAL_NOTES = `CREATE TABLE IF NOT EXISTS \`internal_notes\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`ticket_id\` VARCHAR(50) NOT NULL,
  \`author_id\` VARCHAR(50) NOT NULL,
  \`author_name\` VARCHAR(255) NOT NULL,
  \`note\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL,
  INDEX \`idx_internal_notes_ticket\` (\`ticket_id\`),
  CONSTRAINT \`fk_internal_notes_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`),
  CONSTRAINT \`fk_internal_notes_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL wajib diisi di .env');
  const conn = await mysql.createConnection(url);

  await conn.query(CREATE_COMMENTS);
  await conn.query(CREATE_INTERNAL_NOTES);
  console.log('[MIGRATE] Tabel comments & internal_notes siap');

  const [tables] = await conn.query('SHOW TABLES');
  console.log('[MIGRATE] Tabel:', (tables as any[]).map(r => Object.values(r)[0]).join(', '));
  await conn.end();
  console.log('[MIGRATE] Selesai.');
}

main().catch((e) => { console.error('[MIGRATE] Gagal:', e.message); process.exit(1); });
