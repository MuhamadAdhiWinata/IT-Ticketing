import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { swapDuty } from '~/server/services/duty';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  const user = await requireClaim(event, CLAIM.MANAGE_DUTY);
  return successResponse(await swapDuty(user.id, await readBody(event)));
});
