import { requireAuth } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { getSlaMaster } from '~/server/services/sla-master';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  return successResponse(await getSlaMaster());
});
