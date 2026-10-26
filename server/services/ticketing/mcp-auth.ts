import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { mcpTokens, users } from '~/server/database/schema';
import { type Actor, fail, newId, nowTs } from './common';

export const TOKEN_PREFIX = 'itk_';
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

// Kunci dari JWT_SECRET: mengganti secret membuat token lama tidak bisa ditampilkan (autentikasi tetap jalan lewat hash).
const encKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET wajib diisi');
  return createHash('sha256').update(`mcp-token:${secret}`).digest();
};

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', encKey(), iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), body].map(b => b.toString('base64')).join('.');
}

function decrypt(blob: string): string {
  const [iv, tag, body] = blob.split('.').map(p => Buffer.from(p, 'base64')) as [Buffer, Buffer, Buffer];
  const d = createDecipheriv('aes-256-gcm', encKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString('utf8');
}

export async function createMcpToken(userId: string, name: string) {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) throw new Error(`User ${userId} tidak ditemukan`);
  const token = TOKEN_PREFIX + randomBytes(32).toString('hex');
  const id = newId('MCPT');
  await db.insert(mcpTokens).values({ id, userId, name, tokenHash: hash(token), tokenEnc: encrypt(token), createdAt: nowTs() });
  return { id, token };
}

// Hanya pemilik, hanya token aktif, hanya token yang dibuat setelah fitur ini ada.
export async function revealMcpToken(id: string, ownerId: string): Promise<string> {
  const row = (await db.select().from(mcpTokens)
    .where(and(eq(mcpTokens.id, id), eq(mcpTokens.userId, ownerId), isNull(mcpTokens.revokedAt))))[0];
  if (!row) fail(404, 'Token tidak ditemukan atau sudah non-aktif');
  if (!row.tokenEnc) fail(409, 'Token ini dibuat sebelum fitur lihat token, tidak dapat ditampilkan. Buat token baru.');
  try {
    return decrypt(row.tokenEnc);
  } catch {
    fail(409, 'Token tidak dapat didekripsi (kunci server berubah). Buat token baru.');
  }
}

// ownerId diisi dari jalur web: user hanya boleh mencabut token miliknya.
export async function revokeMcpToken(id: string, ownerId?: string) {
  const where = and(eq(mcpTokens.id, id), isNull(mcpTokens.revokedAt), ownerId ? eq(mcpTokens.userId, ownerId) : undefined);
  const res = await db.update(mcpTokens).set({ revokedAt: nowTs() }).where(where);
  return (res as any)[0]?.affectedRows ?? 0;
}

export async function listMcpTokens(ownerId?: string) {
  return db.select({
    id: mcpTokens.id, userId: mcpTokens.userId, name: mcpTokens.name,
    createdAt: mcpTokens.createdAt, lastUsedAt: mcpTokens.lastUsedAt, revokedAt: mcpTokens.revokedAt,
    canReveal: sql<number>`${mcpTokens.tokenEnc} is not null`,
  }).from(mcpTokens).where(ownerId ? eq(mcpTokens.userId, ownerId) : undefined);
}

// Identitas actor selalu berasal dari baris DB (role terkini), bukan dari klaim di token.
export async function authenticateMcp(bearer: string | undefined): Promise<Actor | null> {
  const token = bearer?.replace(/^Bearer\s+/i, '').trim();
  if (!token?.startsWith(TOKEN_PREFIX)) return null;
  const rows = await db.select({ tokenId: mcpTokens.id, user: users }).from(mcpTokens)
    .innerJoin(users, eq(users.id, mcpTokens.userId))
    .where(and(eq(mcpTokens.tokenHash, hash(token)), isNull(mcpTokens.revokedAt)));
  const row = rows[0];
  if (!row) return null;
  await db.update(mcpTokens).set({ lastUsedAt: nowTs() }).where(eq(mcpTokens.id, row.tokenId));
  return { id: row.user.id, name: row.user.name, role: row.user.role };
}
