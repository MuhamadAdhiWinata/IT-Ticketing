import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { mcpTokens, users } from '~/server/database/schema';
import { type Actor, newId, nowTs } from './common';

export const TOKEN_PREFIX = 'itk_';
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export async function createMcpToken(userId: string, name: string) {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) throw new Error(`User ${userId} tidak ditemukan`);
  const token = TOKEN_PREFIX + randomBytes(32).toString('hex');
  const id = newId('MCPT');
  await db.insert(mcpTokens).values({ id, userId, name, tokenHash: hash(token), createdAt: nowTs() });
  return { id, token };
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
