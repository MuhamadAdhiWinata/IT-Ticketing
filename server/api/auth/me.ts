import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { getCurrentUser } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  return successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatarUrl: user.avatarUrl,
  });
});
