import { eq, and, or, like, between, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { worklogs, tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

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
    with: {
      ticket: true,
    },
    orderBy: (wl, { desc }) => [desc(wl.createdAt)],
  });

  const formatted = results.map(wl => ({
    ticketId: wl.ticketId,
    ticketTitle: wl.ticket?.title,
    ...wl,
  }));

  return successResponse(formatted);
});
