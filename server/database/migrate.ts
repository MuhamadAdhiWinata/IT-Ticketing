import mysql from 'mysql2/promise';

import { config } from 'dotenv';
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in .env');
}

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
  });

  console.log('[MIGRANT] Membaca data tiket...');
  const [ticketRows]: any = await pool.execute('SELECT * FROM tickets');
  console.log(`[MIGRANT] Ditemukan ${ticketRows.length} tiket`);

  let totalMigrated = 0;

  for (const ticket of ticketRows) {
    const t = ticket as any;

    if (t.worklogs && Array.isArray(t.worklogs)) {
      for (const wl of t.worklogs) {
        try {
          await pool.execute(
            `INSERT INTO worklogs (id, ticket_id, stage_key, worker_id, worker_name, date, start_at, finish_at, duration_minutes, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [wl.id, t.id, wl.stageKey, wl.worker_id, wl.worker_name, wl.date, wl.start_at, wl.finish_at, wl.duration_minutes || 0, wl.description, wl.created_at]
          );
          totalMigrated++;
        } catch (e: any) {
          if (!e.message?.includes('Duplicate')) console.error(e.message);
        }
      }
    }

    if (t.comments && Array.isArray(t.comments)) {
      for (const c of t.comments) {
        try {
          await pool.execute(
            `INSERT INTO comments (id, ticket_id, user_id, user_name, user_role, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [c.id, t.id, c.user_id, c.user_name, c.user_role, c.message, c.created_at]
          );
          totalMigrated++;
        } catch (e: any) {
          if (!e.message?.includes('Duplicate')) console.error(e.message);
        }
      }
    }

    if (t.internal_notes && Array.isArray(t.internal_notes)) {
      for (const n of t.internal_notes) {
        try {
          await pool.execute(
            `INSERT INTO internal_notes (id, ticket_id, author_id, author_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [n.id, t.id, n.author_id, n.author_name, n.note, n.created_at]
          );
          totalMigrated++;
        } catch (e: any) {
          if (!e.message?.includes('Duplicate')) console.error(e.message);
        }
      }
    }

    if (t.audit_logs && Array.isArray(t.audit_logs)) {
      for (const a of t.audit_logs) {
        try {
          await pool.execute(
            `INSERT INTO audit_logs (id, ticket_id, action, performed_at, performed_by, performed_by_name, detail, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, t.id, a.action, a.performed_at, a.performed_by, a.performed_by_name, a.detail || null, a.notes || null]
          );
          totalMigrated++;
        } catch (e: any) {
          if (!e.message?.includes('Duplicate')) console.error(e.message);
        }
      }
    }

    if (t.attachments && Array.isArray(t.attachments)) {
      for (const a of t.attachments) {
        try {
          await pool.execute(
            `INSERT INTO attachments (id, ticket_id, stage, visibility, file_name, file_size, file_path, uploaded_by, uploaded_by_name, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, t.id, a.stage, a.visibility, a.file_name, a.file_size || null, a.file_path || null, a.uploaded_by, a.uploaded_by_name, a.uploaded_at]
          );
          totalMigrated++;
        } catch (e: any) {
          if (!e.message?.includes('Duplicate')) console.error(e.message);
        }
      }
    }
  }
  console.log(`[MIGRANT] ${totalMigrated} record dimigrasikan.`);

  await pool.end();
  console.log('[MIGRANT] Selesai!');
}

main().catch((e) => { console.error(e); process.exit(1); });
