import { or, and, like, eq, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = (query.q as string || '').trim();
  const limit = Math.min(parseInt(query.limit as string) || 8, 20);
  const user = getCurrentUser(event);
  const userId = getCurrentUserId(event);

  const userRole = user?.role;

  if (!q) {
    const whereClause = userRole === 'USER_NON_IT'
      ? eq(tickets.requestedBy, userId)
      : undefined;

    const results = await db.query.tickets.findMany({
      where: whereClause,
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit,
    });
    return successResponse(await enrichTickets(results));
  }

  // Find user IDs matching name
  const matchingUsers = await db.query.users.findMany({
    where: (u, { like: l }) => l(u.name, `%${q}%`),
    columns: { id: true },
  });
  const matchingUserIds = matchingUsers.map(u => u.id);

  const searchPattern = `%${q}%`;

  // Build OR conditions: ticket id, title, or requester in matching users
  const conditions: any[] = [
    like(tickets.id, searchPattern),
    like(tickets.title, searchPattern),
  ];
  if (matchingUserIds.length > 0) {
    conditions.push(
      sql`${tickets.requestedBy} IN (${sql.join(matchingUserIds.map(id => sql`${id}`), sql`, `)})`
    );
  }

  let baseWhere = or(...conditions);
  if (userRole === 'USER_NON_IT') {
    baseWhere = or(
      and(baseWhere, eq(tickets.requestedBy, userId)),
      eq(tickets.requestedBy, userId),
    );
  }

  const results = await db.query.tickets.findMany({
    where: baseWhere,
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit,
  });

  return successResponse(await enrichTickets(results));
});

async function enrichTickets(ticketList: any[]) {
  if (ticketList.length === 0) return [];

  const userIds = [
    ...new Set(
      ticketList.map(t => t.requestedBy).filter(Boolean)
    ),
  ];

  if (userIds.length === 0) {
    return ticketList.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      requestedByName: '',
      requestedByDept: t.requestedByDept || '',
    }));
  }

  const userList = await db.query.users.findMany({
    where: (u, { inArray: i }) => i(u.id, userIds),
  });
  const userMap = new Map(userList.map(u => [u.id, u.name]));

  return ticketList.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    requestedByName: userMap.get(t.requestedBy) || '',
    requestedByDept: t.requestedByDept || '',
  }));
}
