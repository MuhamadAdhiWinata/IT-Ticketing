import { and, gte, lte, sql, eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { loadOrgMaps, resolveCompanyOf, resolveDivisionOf } from '~/server/utils/org';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const period = (query.period as string) || 'today';
  const user = getCurrentUser(event);
  const userId = getCurrentUserId(event);
  const limit = Math.min(parseInt(query.limit as string) || 20, 50);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 19);
  const todayEnd = now.toISOString().slice(0, 19);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStart = sevenDaysAgo.toISOString().slice(0, 19);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19);

  // RBAC: USER_NON_IT only sees own tickets
  const userFilter = user?.role === 'USER_NON_IT'
    ? eq(tickets.requestedBy, userId)
    : undefined;

  // Summary counts (all tickets, not filtered by period)
  const [todayCount, sevenDayCount, monthCount] = await Promise.all([
    db.select({ cnt: sql<number>`COUNT(*)` }).from(tickets)
      .where(and(userFilter, gte(tickets.createdAt, todayStart), lte(tickets.createdAt, todayEnd)))
      .then(r => Number(r[0]?.cnt || 0)),
    db.select({ cnt: sql<number>`COUNT(*)` }).from(tickets)
      .where(and(userFilter, gte(tickets.createdAt, sevenDaysStart), lte(tickets.createdAt, todayEnd)))
      .then(r => Number(r[0]?.cnt || 0)),
    db.select({ cnt: sql<number>`COUNT(*)` }).from(tickets)
      .where(and(userFilter, gte(tickets.createdAt, monthStart), lte(tickets.createdAt, todayEnd)))
      .then(r => Number(r[0]?.cnt || 0)),
  ]);

  // Period-filtered log
  let periodStart: string;
  if (period === '7days') {
    periodStart = sevenDaysStart;
  } else if (period === 'month') {
    periodStart = monthStart;
  } else {
    periodStart = todayStart;
  }

  const periodTickets = await db.query.tickets.findMany({
    where: and(userFilter, gte(tickets.createdAt, periodStart), lte(tickets.createdAt, todayEnd)),
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit,
  });

  // Resolve requester identity (name + company/division)
  const userIds = [...new Set(periodTickets.map(t => t.requestedBy))];
  const userList = userIds.length > 0
    ? await db.query.users.findMany({ where: (u, { inArray: i }) => i(u.id, userIds) })
    : [];
  const maps = await loadOrgMaps(userList.map(u => u.companyId), userList.map(u => u.divisionId));
  const userMap = new Map(userList.map(u => [u.id, u]));

  const log = periodTickets.map(t => {
    const requester = userMap.get(t.requestedBy);
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      requestedByName: requester?.name || '',
      requestedByDept: requester?.department || t.requestedByDept || '',
      requested_by_company: requester ? (resolveCompanyOf(requester, maps) || '') : '',
      requested_by_division: requester ? (resolveDivisionOf(requester, maps) || '') : '',
      created_at: t.createdAt,
    };
  });

  return successResponse({
    summary: { today: todayCount, sevenDays: sevenDayCount, month: monthCount },
    period,
    log,
  });
});
