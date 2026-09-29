import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event);
  const userId = getCurrentUserId(event);
  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit as string) || 20, 50);

  // RBAC: USER_NON_IT only sees their own tickets
  const whereClause = user?.role === 'USER_NON_IT'
    ? eq(tickets.requestedBy, userId)
    : undefined;

  const recentTickets = await db.query.tickets.findMany({
    where: whereClause,
    orderBy: (t, { desc: d }) => d(t.createdAt),
    limit,
  });

  // Resolve requester names
  const userIds = [...new Set(recentTickets.map(t => t.requestedBy))];
  const userList = userIds.length > 0
    ? await db.query.users.findMany({
        where: (u, { inArray: i }) => i(u.id, userIds),
      })
    : [];
  const userMap = new Map(userList.map(u => [u.id, u.name]));

  const activities = recentTickets.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    category: t.category,
    requestedByName: userMap.get(t.requestedBy) || '',
    requestedByDept: t.requestedByDept || '',
    created_at: t.createdAt,
  }));

  return successResponse(activities);
});
