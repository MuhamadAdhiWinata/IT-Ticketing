import { CLAIM } from '~/utils/permissions';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { revealMcpToken, revokeMcpToken } from '~/server/services/ticketing/mcp-auth';

export default defineEventHandler(async (event) => {
  const user = await requireClaim(event, CLAIM.IT);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Token ID required' });

  if (event.method === 'GET') {
    return successResponse({ token: await revealMcpToken(id, user.id) });
  }

  if (event.method === 'DELETE') {
    if (!(await revokeMcpToken(id, user.id))) {
      throw createError({ statusCode: 404, statusMessage: 'Token tidak ditemukan atau sudah non-aktif' });
    }
    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
