import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { saveSlaMaster } from '~/server/services/sla-master';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireClaim(event, CLAIM.MANAGE_MASTER);
  return successResponse(await saveSlaMaster(await readBody(event)));
});
