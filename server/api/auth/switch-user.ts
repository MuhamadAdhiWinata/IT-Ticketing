import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { userId } = body;

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' });
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.id, userId),
  });
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  return successResponse(user);
});
