// Terapkan migrasi identitas Perusahaan/Divisi ke DB lokal (aditif, aman dijalankan ulang).
// Jalankan: npx tsx -r dotenv/config scripts/apply-org-migration.ts
//
// Catatan collation: seluruh tabel lama memakai utf8mb4_unicode_ci (default DB).
// Tabel baru juga harus sama, kalau tidak pembuatan FK gagal dengan errno 150.
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const TARGET_COLLATION = 'utf8mb4_unicode_ci';

async function tableInfo(conn: any, table: string) {
  const [rows] = await conn.query(
    `SELECT TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return rows.length > 0 ? (rows as any)[0].TABLE_COLLATION as string : null;
}

async function rowCount(conn: any, table: string) {
  const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
  return Number((rows as any)[0]?.cnt || 0);
}

async function hasColumn(conn: any, table: string, column: string) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}

async function hasIndex(conn: any, table: string, index: string) {
  const [rows] = await conn.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, [index]);
  return rows.length > 0;
}

async function hasConstraint(conn: any, constraint: string) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?`,
    [constraint],
  );
  return Number((rows as any)[0]?.cnt || 0) > 0;
}

const CREATE_COMPANIES = `CREATE TABLE IF NOT EXISTS \`companies\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${TARGET_COLLATION}`;

const CREATE_DIVISIONS = `CREATE TABLE IF NOT EXISTS \`divisions\` (
  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
  \`company_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  INDEX \`idx_division_company\` (\`company_id\`),
  CONSTRAINT \`fk_division_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${TARGET_COLLATION}`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL wajib diisi di .env');
  const conn = await mysql.createConnection(url);

  // Bila tabel terlanjur dibuat dengan collation salah, buang lalu buat ulang.
  // Aman karena keduanya masih kosong pada migrasi pertama.
  const companiesCollation = await tableInfo(conn, 'companies');
  if (companiesCollation && companiesCollation !== TARGET_COLLATION) {
    const count = await rowCount(conn, 'companies');
    if (count > 0) {
      throw new Error(`companies memakai collation ${companiesCollation} dan berisi ${count} baris. Migrasi otomatis dihentikan.`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DROP TABLE IF EXISTS `divisions`');
    await conn.query('DROP TABLE IF EXISTS `companies`');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`[MIGRATE] Tabel lama (collation ${companiesCollation}) dibuang, dibuat ulang`);
  }

  await conn.query(CREATE_COMPANIES);
  await conn.query(CREATE_DIVISIONS);
  console.log(`[MIGRATE] Tabel companies & divisi siap (collation ${TARGET_COLLATION})`);

  if (!(await hasColumn(conn, 'users', 'company_id'))) {
    await conn.query('ALTER TABLE `users` ADD COLUMN `company_id` VARCHAR(50) NULL AFTER `department`');
    console.log('[MIGRATE] users.company_id ditambahkan');
  } else {
    console.log('[MIGRATE] users.company_id sudah ada, dilewati');
  }

  if (!(await hasColumn(conn, 'users', 'division_id'))) {
    await conn.query('ALTER TABLE `users` ADD COLUMN `division_id` VARCHAR(50) NULL AFTER `company_id`');
    console.log('[MIGRATE] users.division_id ditambahkan');
  } else {
    console.log('[MIGRATE] users.division_id sudah ada, dilewati');
  }

  if (!(await hasIndex(conn, 'users', 'idx_users_company'))) {
    await conn.query('ALTER TABLE `users` ADD INDEX `idx_users_company` (`company_id`)');
    console.log('[MIGRATE] index idx_users_company dibuat');
  }
  if (!(await hasIndex(conn, 'users', 'idx_users_division'))) {
    await conn.query('ALTER TABLE `users` ADD INDEX `idx_users_division` (`division_id`)');
    console.log('[MIGRATE] index idx_users_division dibuat');
  }
  if (!(await hasConstraint(conn, 'fk_users_company'))) {
    await conn.query('ALTER TABLE `users` ADD CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)');
    console.log('[MIGRATE] FK fk_users_company dibuat');
  }
  if (!(await hasConstraint(conn, 'fk_users_division'))) {
    await conn.query('ALTER TABLE `users` ADD CONSTRAINT `fk_users_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`)');
    console.log('[MIGRATE] FK fk_users_division dibuat');
  }

  const [tables] = await conn.query('SHOW TABLES');
  console.log('[MIGRATE] Tabel:', (tables as any[]).map(r => Object.values(r)[0]).join(', '));
  await conn.end();
  console.log('[MIGRATE] Selesai.');
}

main().catch((e) => { console.error('[MIGRATE] Gagal:', e.message); process.exit(1); });
