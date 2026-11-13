import { requireAuth } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { getTriageMaster } from '~/server/services/triage-master';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  return successResponse(await getTriageMaster());
});
