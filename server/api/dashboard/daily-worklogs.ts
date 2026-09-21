import { eq, and, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { worklogs, tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeWorklog } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const startDate = query.startDate || '';
  const endDate = query.endDate || '';
  const workerId = query.workerId || '';

  const results = await db.query.worklogs.findMany({
    where: (wl, { eq: e, and: a, sql: s }: any) => {
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
    orderBy: (wl, { asc }) => [asc(wl.date), asc(wl.startAt)],
  });

  const ticketIds = [...new Set(results.map(wl => wl.ticketId))];
  const ticketMap = new Map();
  if (ticketIds.length > 0) {
    const ticketList = await db.query.tickets.findMany({
      where: (t, { inArray: i }) => i(t.id, ticketIds),
    });
    ticketList.forEach(t => ticketMap.set(t.id, t));
  }

  const formatted = results.map(wl => ({
    ticketId: wl.ticketId,
    ticketTitle: ticketMap.get(wl.ticketId)?.title || '',
    ticketStatus: ticketMap.get(wl.ticketId)?.status || '',
    ...serializeWorklog(wl),
  }));

  return successResponse(formatted);
});
