import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '~/server/database/client';
import type { Actor } from '~/server/services/ticketing/common';
import { withIdempotency } from '~/server/services/ticketing/idempotency';
import { getAllowedActions } from '~/server/services/ticketing/permissions';
import * as q from '~/server/services/ticketing/queries';
import { addActivity, logWorkTime } from '~/server/services/ticketing/activities';
import { addComment, addInternalNote } from '~/server/services/ticketing/discussion';
import { assignTicket, addMembers } from '~/server/services/ticketing/assignment';
import { reopenTicket, transitionStatus, STATUSES } from '~/server/services/ticketing/workflow';
import { addAttachments, ATTACH_STAGES } from '~/server/services/ticketing/attachments';
import { VISIBILITIES, MAX_FILE_BYTES } from '~/server/services/ticketing/common';

type Kind = 'read' | 'write' | 'workflow' | 'attachment' | 'discovery';
export const TOOL_KINDS: Record<string, Kind> = {};

const ticketId = z.string().min(1).describe('ID tiket, mis. TCK-202610-123');
const idem = z.string().min(8).max(100).optional()
  .describe('Kunci unik per aksi. Kirim ulang dengan kunci yang sama saat retry agar tidak terduplikasi.');

function errorResult(e: any) {
  const status = e?.statusCode ?? 500;
  const message = status >= 500 ? 'Internal error' : (e?.statusMessage || e?.message || 'Error');
  if (status >= 500) console.error('[mcp] tool error', e);
  return { isError: true as const, content: [{ type: 'text' as const, text: JSON.stringify({ error: message, status, ...(e?.data ?? {}) }) }] };
}

export function buildMcpServer(actor: Actor) {
  const server = new McpServer({ name: 'it-ticketing', version: '1.0.0' }, {
    instructions:
      'Interface operasional IT-Ticketing untuk worker. Panggil get_allowed_actions sebelum menulis. ' +
      'Minta konfirmasi worker sebelum transition_ticket_status, reopen_ticket, assign_ticket, atau add_ticket_members. ' +
      'Identitas pencatat selalu dari token; jangan kirim author/worker. Baca ulang data setelah menulis untuk verifikasi.',
  });

  const def = <S extends z.ZodRawShape>(
    name: string, kind: Kind, description: string, shape: S,
    fn: (args: z.infer<z.ZodObject<S>>) => Promise<unknown>,
    opts: { write?: boolean; destructive?: boolean } = {},
  ) => {
    TOOL_KINDS[name] = kind;
    server.registerTool(name, {
      description,
      inputSchema: shape,
      annotations: { readOnlyHint: !opts.write, destructiveHint: !!opts.destructive, idempotentHint: !opts.write, openWorldHint: false },
    }, (async (args: any) => {
      try {
        const out = await fn(args);
        return { content: [{ type: 'text' as const, text: JSON.stringify(out) }], structuredContent: undefined };
      } catch (e) {
        return errorResult(e);
      }
    }) as any);
  };

  // Tulis memakai idempotensi: kunci + hasil disimpan dalam transaksi yang sama dengan aksi.
  const idempotent = <A extends { idempotencyKey?: string }>(tool: string, args: A, run: (tx: typeof db) => Promise<unknown>) =>
    withIdempotency(actor.id, args.idempotencyKey, tool, run as any);

  // ── Discovery ──
  def('get_allowed_actions', 'discovery',
    'Status tiket saat ini, transisi status yang valid, aksi yang boleh dilakukan caller, tahap aktivitas yang tersedia, dan aturan workflow. Panggil sebelum menulis.',
    { ticketId }, a => getAllowedActions(db, actor, a.ticketId));
  def('search_tickets', 'discovery', 'Cari tiket berdasarkan ID, nomor, judul, atau nama pemohon.',
    { q: z.string().optional(), status: z.enum(STATUSES).optional(), limit: z.number().int().optional() }, a => q.searchTickets(actor, a));
  def('list_workers', 'discovery', 'Daftar pengguna IT (untuk assign_ticket / add_ticket_members).', {}, () => q.listWorkers(actor));
  def('list_vendors', 'discovery', 'Daftar vendor (untuk delegasi pada transition_ticket_status).', {}, () => q.listVendors(actor));

  // ── Read ──
  def('list_my_tickets', 'read', 'Tiket yang ditugaskan kepada atau diikuti caller (pemohon: tiket miliknya).',
    { status: z.enum(STATUSES).optional(), limit: z.number().int().optional() }, a => q.listMyTickets(actor, a));
  def('get_ticket', 'read', 'Detail tiket lengkap: aktivitas (worklog), audit trail, lampiran, member, delegasi, SLA.',
    { ticketId }, a => q.getTicketDetail(actor, a.ticketId));
  def('list_ticket_activities', 'read', 'Seluruh aktivitas (worklog) tiket, urut kronologis.', { ticketId }, a => q.listActivities(actor, a.ticketId));
  def('list_ticket_comments', 'read', 'Komentar diskusi tiket (terlihat pemohon dan IT), urut kronologis.', { ticketId }, a => q.listComments(actor, a.ticketId));
  def('list_internal_notes', 'read', 'Catatan internal tiket (hanya IT).', { ticketId }, a => q.listInternalNotes(actor, a.ticketId));
  def('get_ticket_history', 'read', 'Audit trail tiket (perubahan status, penugasan, dsb.).', { ticketId }, a => q.getHistory(actor, a.ticketId));
  def('list_ticket_attachments', 'attachment', 'Daftar lampiran tiket sesuai visibilitas caller. file_path adalah URL /api/uploads/... pada aplikasi.',
    { ticketId }, a => q.listAttachments(actor, a.ticketId));

  // ── Write ──
  def('add_ticket_activity', 'write',
    'Tambah aktivitas (worklog "Kirim") baru pada tiket. Selalu membuat record baru, tidak menimpa yang lama, dan TIDAK mengubah status tiket.',
    {
      ticketId,
      description: z.string().min(1).max(5000).describe('Catatan pekerjaan'),
      stageKey: z.enum(['ASSIGN', 'IN_PROGRESS', 'COMPLETION']).optional().describe('Default mengikuti status tiket; lihat get_allowed_actions.add_ticket_activity.stages'),
      idempotencyKey: idem,
    },
    a => idempotent('add_ticket_activity', a, tx => addActivity(actor, a, tx)), { write: true });

  def('log_work_time', 'write',
    'Catat log jam kerja (seperti Log Harian) pada tiket yang sudah diproses. Ditolak bila jam tumpang tindih dengan log lain milik caller.',
    {
      ticketId,
      description: z.string().min(1).max(5000),
      start_at: z.string().describe('HH:MM'),
      finish_at: z.string().describe('HH:MM'),
      date: z.string().optional().describe('YYYY-MM-DD, default hari ini'),
      duration_minutes: z.number().int().optional().describe('Default finish - start'),
      stageKey: z.enum(['ASSIGN', 'IN_PROGRESS', 'COMPLETION']).optional(),
      idempotencyKey: idem,
    },
    a => idempotent('log_work_time', a, tx => logWorkTime(actor, a, {}, tx)), { write: true });

  def('add_comment', 'write', 'Tambah komentar diskusi pada tiket (terlihat pemohon dan IT). Maks 2000 karakter. Bukan aktivitas kerja.',
    { ticketId, message: z.string().min(1).max(2000), idempotencyKey: idem },
    a => idempotent('add_comment', a, tx => addComment(actor, a, tx)), { write: true });

  def('add_internal_note', 'write', 'Tambah catatan internal (hanya IT, tidak terlihat pemohon). Maks 2000 karakter.',
    { ticketId, note: z.string().min(1).max(2000), idempotencyKey: idem },
    a => idempotent('add_internal_note', a, tx => addInternalNote(actor, a, tx)), { write: true });

  // ── Workflow ──
  def('transition_ticket_status', 'workflow',
    'Ubah status lewat workflow yang sama dengan UI: DRAFT>PROCESS (Mulai Proses), PROCESS>SELESAI (Selesaikan), PROCESS>DELEGASI (wajib delegation), PROCESS>DRAFT, DELEGASI>PROCESS, SELESAI>PROCESS (buka ulang). Minta konfirmasi worker dulu. Gagal bila transisi tidak valid, dengan daftar transisi yang diizinkan.',
    {
      ticketId,
      to: z.enum(STATUSES),
      notes: z.string().max(5000).optional().describe('Dicatat sebagai audit note dan worklog tahap terkait'),
      delegation: z.object({
        type: z.enum(['DELEGASI_VENDOR', 'DELEGASI_TEKNISI']),
        vendor_id: z.string().optional(),
        vendor_name: z.string().optional(),
        technician_id: z.string().optional(),
        technician_name: z.string().optional(),
        reference_no: z.string().optional(),
        notes: z.string().optional(),
      }).optional().describe('Wajib bila to=DELEGASI'),
      idempotencyKey: idem,
    },
    a => idempotent('transition_ticket_status', a, tx => transitionStatus(actor, a, tx)), { write: true, destructive: true });

  def('reopen_ticket', 'workflow', 'Buka ulang tiket SELESAI kembali ke PROCESS. Hanya IT. Minta konfirmasi worker dulu.',
    { ticketId, idempotencyKey: idem },
    a => idempotent('reopen_ticket', a, tx => reopenTicket(actor, a, tx)), { write: true, destructive: true });

  def('assign_ticket', 'workflow',
    'Tetapkan assignee tiket (satu per tiket). userId dikosongkan = ambil untuk diri sendiri. Menugaskan orang lain hanya untuk SYSTEM_ADMIN. Terkunci setelah SELESAI. Minta konfirmasi worker dulu.',
    { ticketId, userId: z.string().optional(), idempotencyKey: idem },
    a => idempotent('assign_ticket', a, tx => assignTicket(actor, a, tx)), { write: true, destructive: true });

  def('add_ticket_members', 'workflow', 'Tambah pekerja pendukung (member) ke tiket selama belum SELESAI. Yang sudah member dilewati.',
    { ticketId, userIds: z.array(z.string().min(1)).min(1).max(20), idempotencyKey: idem },
    a => idempotent('add_ticket_members', a, tx => addMembers(actor, a, tx)), { write: true });

  // ── Attachment ──
  def('add_attachment', 'attachment',
    `Unggah lampiran ke tiket (konten base64, maks ${MAX_FILE_BYTES / 1024 / 1024} MB). Hanya IT.`,
    {
      ticketId,
      fileName: z.string().min(1).max(200),
      contentBase64: z.string().min(1),
      stage: z.enum(ATTACH_STAGES).optional(),
      visibility: z.enum(VISIBILITIES).optional(),
      idempotencyKey: idem,
    },
    a => idempotent('add_attachment', a, tx => addAttachments(actor, {
      ticketId: a.ticketId, stage: a.stage, visibility: a.visibility,
      files: [{ fileName: a.fileName, data: Buffer.from(a.contentBase64, 'base64') }],
    }, tx)), { write: true });

  return server;
}
