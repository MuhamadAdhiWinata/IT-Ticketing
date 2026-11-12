import { requireRole } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { listRbac } from '~/server/services/rbac';
import { ADMIN_ROLE } from '~/utils/permissions';

// Data lengkap hak akses (peran, klaim, menu): khusus SYSTEM_ADMIN.
export default defineEventHandler(async (event) => {
  await requireRole(event, ADMIN_ROLE);
  return successResponse(await listRbac());
});
