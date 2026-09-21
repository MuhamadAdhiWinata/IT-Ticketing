import { eq, and, or, like, between, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const workerId = query.workerId || null;
  const startDate = query.startDate || null;
  const endDate = query.endDate || null;

  let worklogsData = await db.query.worklogs.findMany({
    where: (wl, { eq: e, and: a, between: b, sql: s }: any) => {
      const conditions: any[] = [];
      if (workerId) conditions.push(e(wl.workerId, workerId as string));
      if (startDate && endDate) {
        conditions.push(a(s`${wl.date} >= ${startDate}`, s`${wl.date} <= ${endDate}`));
      } else if (startDate) {
        conditions.push(s`${wl.date} >= ${startDate}`);
      } else if (endDate) {
        conditions.push(s`${wl.date} <= ${endDate}`);
      }
      return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
    },
  });

  let dailyTicketsCount = 0;
  let completedInRangeCount = 0;
  let onProgressCount = 0;
  let totalHoursInRange = 0;

  const uniqueTicketIds = new Set<string>();

  worklogsData.forEach(wl => {
    uniqueTicketIds.add(wl.ticketId);
    totalHoursInRange += (wl.durationMinutes || 0) / 60;
  });
  dailyTicketsCount = uniqueTicketIds.size;

  const relevantTickets = await getTicketsWithRelations((t, { eq: e, or: o, and: a }: any) => {
    const conditions: any[] = [];
    if (workerId) conditions.push(e(t.assignedTo, workerId as string));

    if (startDate && endDate) {
      conditions.push(a(sql`${t.createdAt} >= ${startDate} 00:00:00`, sql`${t.createdAt} <= ${endDate} 23:59:59`));
    } else if (startDate) {
      conditions.push(sql`${t.createdAt} >= ${startDate} 00:00:00`);
    } else if (endDate) {
      conditions.push(sql`${t.createdAt} <= ${endDate} 23:59:59`);
    }

    return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
  });

  relevantTickets.forEach(t => {
    if (t.status === 'SELESAI') completedInRangeCount++;
    if (t.status === 'PROCESS' || t.status === 'DELEGASI') onProgressCount++;
  });

  return successResponse({
    dailyTicketsCount,
    completedInRangeCount,
    onProgressCount,
    totalHoursInRange: totalHoursInRange.toFixed(1),
  });
});
