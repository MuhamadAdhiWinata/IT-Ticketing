import { z } from 'zod';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { createMcpToken, listMcpTokens } from '~/server/services/ticketing/mcp-auth';
import { parse } from '~/server/services/ticketing/common';

const MAX_ACTIVE = 5;
const CreateSchema = z.object({ name: z.string().trim().min(1, 'Nama wajib diisi').max(100) });

// Token MCP hanya untuk IT; USER_NON_IT ditolak 403. Token mentah hanya dikembalikan saat dibuat.
export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');

  if (event.method === 'GET') {
    const rows = await listMcpTokens(user.id);
    return successResponse(rows.map(t => ({
      id: t.id,
      name: t.name,
      created_at: t.createdAt,
      last_used_at: t.lastUsedAt,
      revoked_at: t.revokedAt,
    })));
  }

  if (event.method === 'POST') {
    const { name } = parse(CreateSchema, await readBody(event));
    const active = (await listMcpTokens(user.id)).filter(t => !t.revokedAt).length;
    if (active >= MAX_ACTIVE) {
      throw createError({ statusCode: 409, statusMessage: `Maksimal ${MAX_ACTIVE} token aktif. Cabut token lama dahulu.` });
    }
    const { id, token } = await createMcpToken(user.id, name);
    return successResponse({ id, token });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
