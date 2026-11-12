import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { createSchedule } from '~/server/services/duty';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  const user = await requireClaim(event, CLAIM.MANAGE_DUTY);
  return successResponse(await createSchedule(user.id, await readBody(event)));
});
