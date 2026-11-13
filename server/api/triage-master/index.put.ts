import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { saveTriageMaster } from '~/server/services/triage-master';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireClaim(event, CLAIM.MANAGE_MASTER);
  return successResponse(await saveTriageMaster(await readBody(event)));
});
