// Migrasi rename master "Aplikasi/Project" -> "Project/Kendala":
//   - tabel  `subcategories`             -> `project_kendala`
//   - kolom  `tickets.aplikasi_project`  -> `project_kendala`
//   - kolom  `submodules.subcategory_id` -> `project_kendala_id`
//   - index & FK ikut disesuaikan dengan server/database/schema.ts
// Semua pernyataan metadata-only (RENAME/CHANGE COLUMN), jadi data utuh.
//
// Jalankan : npx tsx -r dotenv/config scripts/apply-project-kendala-migration.ts
// Rollback : npx tsx -r dotenv/config scripts/apply-project-kendala-migration.ts --rollback
// Idempoten: tiap langkah dicek dulu lewat information_schema, aman diulang.
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const OLD_TABLE = 'subcategories';
const NEW_TABLE = 'project_kendala';
const OLD_FK = 'fk_submodule_subcategory';
const NEW_FK = 'fk_submodule_project_kendala';
const OLD_TICKET_COL = 'aplikasi_project';
const NEW_TICKET_COL = 'project_kendala';
const OLD_SUB_COL = 'subcategory_id';
const NEW_SUB_COL = 'project_kendala_id';
const OLD_SUB_INDEX = 'idx_submodule_subcategory';
const NEW_SUB_INDEX = 'idx_submodule_project_kendala';
const OLD_PK_INDEX = 'idx_subcategory_category';
const NEW_PK_INDEX = 'idx_project_kendala_category';

type Count = { tickets: number; project_kendala: number; submodules: number };

async function tableExists(c: mysql.Connection, name: string) {
  const [rows] = await c.query(
    'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [name]
  );
  return Number((rows as any[])[0].n) > 0;
}

async function columnExists(c: mysql.Connection, table: string, col: string) {
  const [rows] = await c.query(
    'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, col]
  );
  return Number((rows as any[])[0].n) > 0;
}

async function indexExists(c: mysql.Connection, table: string, idx: string) {
  const [rows] = await c.query(
    'SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [table, idx]
  );
  return Number((rows as any[])[0].n) > 0;
}

async function indexList(c: mysql.Connection, table: string): Promise<string[]> {
  const [rows] = await c.query(
    'SELECT DISTINCT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return (rows as any[]).map((r) => r.name).sort();
}

// Nama FK di `submodules` yang menunjuk ke tabel master Project/Kendala.
async function findSubmoduleFk(c: mysql.Connection): Promise<string | null> {
  const [rows] = await c.query(
    `SELECT k.CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE k
     WHERE k.TABLE_SCHEMA = DATABASE() AND k.TABLE_NAME = 'submodules'
       AND k.REFERENCED_TABLE_NAME IN (?, ?) LIMIT 1`,
    [OLD_TABLE, NEW_TABLE]
  );
  const list = rows as any[];
  return list.length ? list[0].name : null;
}

async function counts(c: mysql.Connection): Promise<Count> {
  const pkTable = (await tableExists(c, NEW_TABLE)) ? NEW_TABLE : OLD_TABLE;
  const [tk] = await c.query('SELECT COUNT(*) AS n FROM `tickets`');
  const [pk] = await c.query(`SELECT COUNT(*) AS n FROM \`${pkTable}\``);
  const [sm] = await c.query('SELECT COUNT(*) AS n FROM `submodules`');
  return {
    tickets: Number((tk as any[])[0].n),
    project_kendala: Number((pk as any[])[0].n),
    submodules: Number((sm as any[])[0].n),
  };
}

async function backup(c: mysql.Connection) {
  const [tickets] = await c.query('SELECT * FROM `tickets`');
  const [submodules] = await c.query('SELECT * FROM `submodules`');
  const pkTable = (await tableExists(c, NEW_TABLE)) ? NEW_TABLE : OLD_TABLE;
  const [pk] = await c.query(`SELECT * FROM \`${pkTable}\``);
  const file = join(tmpdir(), `it-ticketing-backup-project-kendala-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({ tickets, submodules, [pkTable]: pk }, null, 2), 'utf8');
  return file;
}

async function runSql(c: mysql.Connection, label: string, statement: string) {
  console.log(`  - ${label}`);
  await c.query(statement);
}

// Pastikan index FK sesuai nama di schema.ts: rename dari nama lama, atau buat baru
// bila sejak awal tidak ada (DB lokal kadang dibuat tanpa index deklarasi Drizzle).
async function ensureSubmoduleIndex(c: mysql.Connection, from: string, to: string, column: string) {
  if (await indexExists(c, 'submodules', from)) {
    await runSql(c, `rename index ${from} -> ${to}`, `ALTER TABLE \`submodules\` RENAME INDEX \`${from}\` TO \`${to}\``);
  } else if (!(await indexExists(c, 'submodules', to))) {
    await runSql(c, `add index ${to}`, `ALTER TABLE \`submodules\` ADD INDEX \`${to}\` (\`${column}\`)`);
  }
}

async function migrate(c: mysql.Connection) {
  console.log('[MIGRATE] Langkah forward (rename -> Project/Kendala)');

  const needSubCol = await columnExists(c, 'submodules', OLD_SUB_COL);
  if (needSubCol) {
    const fkName = await findSubmoduleFk(c);
    if (fkName) await runSql(c, `drop foreign key ${fkName}`, `ALTER TABLE \`submodules\` DROP FOREIGN KEY \`${fkName}\``);
    await runSql(c, `submodules.${OLD_SUB_COL} -> ${NEW_SUB_COL}`,
      `ALTER TABLE \`submodules\` CHANGE COLUMN \`${OLD_SUB_COL}\` \`${NEW_SUB_COL}\` VARCHAR(50) NOT NULL`);
  }

  if (await tableExists(c, OLD_TABLE)) {
    await runSql(c, `rename table ${OLD_TABLE} -> ${NEW_TABLE}`, `RENAME TABLE \`${OLD_TABLE}\` TO \`${NEW_TABLE}\``);
  }

  if (await indexExists(c, NEW_TABLE, OLD_PK_INDEX)) {
    await runSql(c, `rename index ${OLD_PK_INDEX}`, `ALTER TABLE \`${NEW_TABLE}\` RENAME INDEX \`${OLD_PK_INDEX}\` TO \`${NEW_PK_INDEX}\``);
  }

  if (await columnExists(c, 'tickets', OLD_TICKET_COL)) {
    await runSql(c, `tickets.${OLD_TICKET_COL} -> ${NEW_TICKET_COL}`,
      `ALTER TABLE \`tickets\` CHANGE COLUMN \`${OLD_TICKET_COL}\` \`${NEW_TICKET_COL}\` VARCHAR(100) NULL AFTER \`category\``);
  }

  await ensureSubmoduleIndex(c, OLD_SUB_INDEX, NEW_SUB_INDEX, NEW_SUB_COL);

  if ((await findSubmoduleFk(c)) === null && (await tableExists(c, NEW_TABLE)) && (await columnExists(c, 'submodules', NEW_SUB_COL))) {
    await runSql(c, `add foreign key ${NEW_FK}`,
      `ALTER TABLE \`submodules\` ADD CONSTRAINT \`${NEW_FK}\` FOREIGN KEY (\`${NEW_SUB_COL}\`) REFERENCES \`${NEW_TABLE}\` (\`id\`) ON DELETE CASCADE`);
  }
}

async function rollback(c: mysql.Connection) {
  console.log('[MIGRATE] Langkah rollback (kembali ke nama lama)');

  const needSubCol = await columnExists(c, 'submodules', NEW_SUB_COL);
  if (needSubCol) {
    const fkName = await findSubmoduleFk(c);
    if (fkName) await runSql(c, `drop foreign key ${fkName}`, `ALTER TABLE \`submodules\` DROP FOREIGN KEY \`${fkName}\``);
    await runSql(c, `submodules.${NEW_SUB_COL} -> ${OLD_SUB_COL}`,
      `ALTER TABLE \`submodules\` CHANGE COLUMN \`${NEW_SUB_COL}\` \`${OLD_SUB_COL}\` VARCHAR(50) NOT NULL`);
  }

  if (await tableExists(c, NEW_TABLE)) {
    await runSql(c, `rename table ${NEW_TABLE} -> ${OLD_TABLE}`, `RENAME TABLE \`${NEW_TABLE}\` TO \`${OLD_TABLE}\``);
  }

  if (await indexExists(c, OLD_TABLE, NEW_PK_INDEX)) {
    await runSql(c, `rename index ${NEW_PK_INDEX}`, `ALTER TABLE \`${OLD_TABLE}\` RENAME INDEX \`${NEW_PK_INDEX}\` TO \`${OLD_PK_INDEX}\``);
  }

  if (await columnExists(c, 'tickets', NEW_TICKET_COL)) {
    await runSql(c, `tickets.${NEW_TICKET_COL} -> ${OLD_TICKET_COL}`,
      `ALTER TABLE \`tickets\` CHANGE COLUMN \`${NEW_TICKET_COL}\` \`${OLD_TICKET_COL}\` VARCHAR(100) NULL AFTER \`category\``);
  }

  await ensureSubmoduleIndex(c, NEW_SUB_INDEX, OLD_SUB_INDEX, OLD_SUB_COL);

  if ((await findSubmoduleFk(c)) === null && (await tableExists(c, OLD_TABLE)) && (await columnExists(c, 'submodules', OLD_SUB_COL))) {
    await runSql(c, `add foreign key ${OLD_FK}`,
      `ALTER TABLE \`submodules\` ADD CONSTRAINT \`${OLD_FK}\` FOREIGN KEY (\`${OLD_SUB_COL}\`) REFERENCES \`${OLD_TABLE}\` (\`id\`) ON DELETE CASCADE`);
  }
}

async function verify(c: mysql.Connection, forward: boolean) {
  const expect = forward ? NEW_TABLE : OLD_TABLE;
  const expectCol = forward ? NEW_TICKET_COL : OLD_TICKET_COL;
  const expectSubCol = forward ? NEW_SUB_COL : OLD_SUB_COL;
  const pkIndex = forward ? NEW_PK_INDEX : OLD_PK_INDEX;
  const subIndex = forward ? NEW_SUB_INDEX : OLD_SUB_INDEX;
  const stalePkIndex = forward ? OLD_PK_INDEX : NEW_PK_INDEX;
  const staleSubIndex = forward ? OLD_SUB_INDEX : NEW_SUB_INDEX;

  const checks: [string, boolean][] = [
    [`tabel \`${expect}\` ada`, await tableExists(c, expect)],
    [`tabel lama \`${forward ? OLD_TABLE : NEW_TABLE}\` hilang`, !(await tableExists(c, forward ? OLD_TABLE : NEW_TABLE))],
    [`tickets.${expectCol} ada`, await columnExists(c, 'tickets', expectCol)],
    [`submodules.${expectSubCol} ada`, await columnExists(c, 'submodules', expectSubCol)],
    ['foreign key terpasang', (await findSubmoduleFk(c)) !== null],
    [`index \`${pkIndex}\` sesuai schema`, await indexExists(c, expect, pkIndex)],
    [`index \`${subIndex}\` sesuai schema`, await indexExists(c, 'submodules', subIndex)],
    ['tidak ada index nama lama tersisa',
      !(await indexExists(c, expect, stalePkIndex)) &&
      !(await indexExists(c, 'submodules', staleSubIndex))],
  ];

  for (const [label, ok] of checks) console.log(`  ${ok ? 'OK  ' : 'GAGAL'} ${label}`);

  const [sample] = await c.query(
    `SELECT \`${expectCol}\` AS v FROM \`tickets\` WHERE \`${expectCol}\` IS NOT NULL AND \`${expectCol}\` <> '' LIMIT 3`
  );
  const values = (sample as any[]).map((r) => r.v);
  console.log(`  sampel ${expectCol}: ${values.length ? JSON.stringify(values) : '(belum ada isi)'}`);
  console.log(`  index submodules: ${JSON.stringify(await indexList(c, 'submodules'))}`);
  console.log(`  index ${expect}: ${JSON.stringify(await indexList(c, expect))}`);

  return checks.every(([, ok]) => ok);
}

async function main() {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) throw new Error('DATABASE_URL belum di-set di .env');

  const mode = process.argv.includes('--rollback') ? 'rollback' : 'migrate';
  const conn = await mysql.createConnection({ uri: dbUri, multipleStatements: true });

  const [ver] = await conn.query('SELECT VERSION() AS v');
  console.log(`[MIGRATE] Server ${(ver as any[])[0].v}`);
  console.log(`[MIGRATE] Mode: ${mode}`);

  const before = await counts(conn);
  console.log('[MIGRATE] Sebelum:', JSON.stringify(before));

  const backupFile = await backup(conn);
  console.log(`[MIGRATE] Backup ditulis ke ${backupFile}`);

  if (mode === 'rollback') await rollback(conn);
  else await migrate(conn);

  const after = await counts(conn);
  console.log('[MIGRATE] Sesudah :', JSON.stringify(after));

  const preserved =
    before.tickets === after.tickets &&
    before.project_kendala === after.project_kendala &&
    before.submodules === after.submodules;
  console.log(`[MIGRATE] Jumlah baris ${preserved ? 'utuh' : 'BERUBAH!'}`);

  const ok = await verify(conn, mode === 'migrate');
  await conn.end();

  if (!ok || !preserved) {
    console.error('[MIGRATE] Verifikasi gagal. Pulihkan lewat backup bila perlu.');
    process.exit(1);
  }
  console.log('[MIGRATE] Selesai, verifikasi lulus.');
}

main().catch((e) => {
  console.error('[MIGRATE] ERROR', e.message ?? e);
  process.exit(1);
});
