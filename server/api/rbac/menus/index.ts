import { db } from '~/server/database/client';
import { requireRole } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { ADMIN_ROLE } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireRole(event, ADMIN_ROLE);
  return successResponse(await db.query.menus.findMany());
});
