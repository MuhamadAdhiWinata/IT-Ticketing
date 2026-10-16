import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';
import { getCurrentUserId } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  const userId = getCurrentUserId(event);
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const results = await getTicketsWithRelations((t: any, { eq: e, or: o }: any) =>
    o(e(t.createdBy, userId), e(t.requestedBy, userId))
  );

  return successResponse(results);
});
