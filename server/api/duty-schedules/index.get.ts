import { requireClaim } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { listSchedules } from '~/server/services/duty';
import { CLAIM } from '~/utils/permissions';

export default defineEventHandler(async (event) => {
  await requireClaim(event, CLAIM.IT);
  const q = getQuery(event);
  return successResponse(await listSchedules({
    from: q.from as string | undefined,
    to: q.to as string | undefined,
    userId: q.user_id as string | undefined,
    includeCancelled: q.include_cancelled === '1',
  }));
});
