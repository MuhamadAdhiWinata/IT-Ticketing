import { createError } from 'h3';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~/server/database/client';
import { tickets, ticketMembers } from '~/server/database/schema';
import { fileStorage } from '~/server/services/storage';
import { sanitizeFilename } from '~/server/utils/upload';

export type DbExec = typeof db;

export interface Actor {
  id: string;
  name: string;
  role: string;
}

export const IT_ROLES = ['IT_WORKER', 'SYSTEM_ADMIN'];
export const isIT = (a: Actor) => IT_ROLES.includes(a.role);

export function toActor(user: { id: string; name: string; role: string }): Actor {
  return { id: user.id, name: user.name, role: user.role };
}

export function fail(status: number, message: string, data?: Record<string, unknown>): never {
  throw createError({ statusCode: status, statusMessage: message, data });
}

export function requireIT(actor: Actor) {
  if (!isIT(actor)) fail(403, 'Forbidden: hanya IT_WORKER atau SYSTEM_ADMIN');
}

export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  fail(400, r.error.issues.map(i => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
}

export function nowTs(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export function hm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ms dipaksa naik monoton supaya urutan leksikografis ID = urutan pembuatan.
let lastMs = 0;
export function newId(prefix: string): string {
  const ms = Math.max(Date.now(), lastMs + 1);
  lastMs = ms;
  return `${prefix}-${ms}-${Math.random().toString(36).slice(2, 6)}`;
}

// Memakai transaksi yang diberikan pemanggil (savepoint) atau membuka yang baru.
export function inTx<T>(exec: DbExec | undefined, fn: (tx: DbExec) => Promise<T>): Promise<T> {
  return (exec ?? db).transaction(tx => fn(tx as unknown as DbExec));
}

export async function lockTicket(tx: DbExec, id: string) {
  const rows = await tx.select().from(tickets).where(eq(tickets.id, id)).for('update');
  if (!rows[0]) fail(404, 'Ticket not found');
  return rows[0];
}

export async function getTicketRow(exec: DbExec, id: string) {
  const rows = await exec.select().from(tickets).where(eq(tickets.id, id));
  if (!rows[0]) fail(404, 'Ticket not found');
  return rows[0];
}

export async function getMemberIds(exec: DbExec, ticketId: string): Promise<string[]> {
  const rows = await exec.select({ userId: ticketMembers.userId }).from(ticketMembers).where(eq(ticketMembers.ticketId, ticketId));
  return rows.map(r => r.userId);
}

export async function ticketSummary(exec: DbExec, id: string) {
  const t = await getTicketRow(exec, id);
  return {
    id: t.id,
    ticket_number: t.ticketNumber,
    status: t.status,
    assigned_to: t.assignedTo,
    process_started_at: t.processStartedAt,
    completed_at: t.completedAt,
  };
}

// ── File ──
export const VISIBILITIES = ['USER_VISIBLE', 'INTERNAL_ONLY'] as const;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export interface UploadInput {
  fileName: string;
  data: Buffer;
  visibility?: (typeof VISIBILITIES)[number];
}

// File yang sudah tertulis ke storage dihapus bila langkah DB sesudahnya gagal.
export async function withFileCleanup<T>(fn: (track: string[]) => Promise<T>): Promise<T> {
  const stored: string[] = [];
  try {
    return await fn(stored);
  } catch (e) {
    await Promise.all(stored.map(p => fileStorage.delete(p)));
    throw e;
  }
}

export async function storeFile(track: string[], ticketId: string, file: UploadInput) {
  if (file.data.length === 0) fail(400, `File kosong: ${file.fileName}`);
  if (file.data.length > MAX_FILE_BYTES) fail(400, `File melebihi 50 MB: ${file.fileName}`);
  const fileName = sanitizeFilename(file.fileName || 'file');
  const safeId = ticketId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const relPath = `uploads/${safeId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${fileName}`;
  const uploaded = await fileStorage.upload({ name: fileName, size: file.data.length, data: file.data }, relPath);
  track.push(relPath);
  return { fileName, url: uploaded.url, fileSize: `${(file.data.length / 1024).toFixed(1)} KB` };
}
