// Terapkan migrasi Master Data & Notifikasi (vendors, notifications, SLA) ke DB lokal.
// Jalankan: npx tsx -r dotenv/config scripts/apply-master-migration.ts
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const ALTER_CATEGORIES = [
  'ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `sla_critical` INT DEFAULT 1',
  'ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `sla_high` INT DEFAULT 4',
  'ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `sla_medium` INT DEFAULT 8',
  'ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `sla_low` INT DEFAULT 24'
];

const CREATE_VENDORS = `CREATE TABLE IF NOT EXISTS \`vendors\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL UNIQUE,
  \`contact_name\` VARCHAR(255),
  \`email\` VARCHAR(255),
  \`phone\` VARCHAR(50),
  \`address\` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

const CREATE_NOTIFICATIONS = `CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`ticket_id\` VARCHAR(50),
  \`type\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`is_read\` TINYINT UNSIGNED DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL,
  INDEX \`idx_notif_user\` (\`user_id\`),
  INDEX \`idx_notif_read\` (\`is_read\`),
  CONSTRAINT \`fk_notif_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
  CONSTRAINT \`fk_notif_ticket\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL wajib diisi di .env');
  const conn = await mysql.createConnection(url);

  for (const sql of ALTER_CATEGORIES) {
    try { await conn.query(sql); } catch (e) { /* ignore if column exists */ }
  }
  await conn.query(CREATE_VENDORS);
  await conn.query(CREATE_NOTIFICATIONS);
  
  console.log('[MIGRATE] Tabel vendors, notifications & SLA categories siap');
  await conn.end();
}

main().catch((e) => { console.error('[MIGRATE] Gagal:', e.message); process.exit(1); });
