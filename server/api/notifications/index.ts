import { db } from '~/server/database/client';
import { notifications } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const results = await db.query.notifications.findMany({
    where: (n, { eq: e }) => e(n.userId, user.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });

  return successResponse(results);
});