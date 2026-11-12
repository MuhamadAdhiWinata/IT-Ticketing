import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { updateSchedule } from '~/server/services/duty';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireClaim(event, CLAIM.MANAGE_DUTY);
  return successResponse(await updateSchedule(getRouterParam(event, 'id')!, await readBody(event)));
});
