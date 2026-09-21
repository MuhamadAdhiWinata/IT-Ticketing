import { sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeWorklog, serializeTicket } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const results = await db.query.worklogs.findMany({
    where: (wl, { eq: e, and: a, between: b }: any) => {
      const conditions: any[] = [];
      if (query.workerId) conditions.push(e(wl.workerId, query.workerId as string));
      if (query.startDate && query.endDate) {
        conditions.push(b(wl.date, query.startDate as string, query.endDate as string));
      } else if (query.startDate) {
        conditions.push(sql`${wl.date} >= ${query.startDate}`);
      } else if (query.endDate) {
        conditions.push(sql`${wl.date} <= ${query.endDate}`);
      }
      return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
    },
    orderBy: (wl, { desc }) => [desc(wl.createdAt)],
  });

  // Fetch related tickets
  const ticketIds = [...new Set(results.map(wl => wl.ticketId))];
  const ticketMap = new Map();
  if (ticketIds.length > 0) {
    const ticketList = await db.query.tickets.findMany({
      where: (t, { inArray: i }) => i(t.id, ticketIds),
    });
    ticketList.forEach(t => ticketMap.set(t.id, t));
  }

  const formatted = results.map(wl => {
    const ticket = ticketMap.get(wl.ticketId);
    return {
      ticketId: wl.ticketId,
      ticketTitle: ticket?.title || '',
      ...serializeWorklog(wl),
    };
  });

  return successResponse(formatted);
});
