import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { revokeMcpToken } from '~/server/services/ticketing/mcp-auth';

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');
  if (event.method !== 'DELETE') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Token ID required' });

  if (!(await revokeMcpToken(id, user.id))) {
    throw createError({ statusCode: 404, statusMessage: 'Token tidak ditemukan atau sudah dicabut' });
  }
  return successResponse({ success: true });
});
