import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { getCurrentUser } from '~/server/utils/user-context';
import { shapeUserRow } from '~/server/utils/org';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  return successResponse(await shapeUserRow(user));
});
