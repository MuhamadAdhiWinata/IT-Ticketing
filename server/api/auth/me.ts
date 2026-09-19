import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'X-User-Id');
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'User ID header missing' });
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.id, userId),
  });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return successResponse(user);
});
