import { inArray, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // Tiket yang dimiliki worker: yang ditugasi langsung atau yang menjadikannya anggota.
  const workerTicketIds = query.workerId
    ? (await db.query.ticketMembers.findMany({
        where: (m: any, { eq: e }: any) => e(m.userId, query.workerId as string),
      })).map((m: any) => m.ticketId)
    : [];

  const results = await getTicketsWithRelations((t: any, { eq: e, or: o, like: l, and: a }: any) => {
    const resolvedConditions: any[] = [];
    if (query.status) resolvedConditions.push(e(t.status, query.status as string));
    if (query.category) resolvedConditions.push(e(t.category, query.category as string));
    if (query.priority) resolvedConditions.push(e(t.priority, query.priority as string));

    if (query.workerId) {
      resolvedConditions.push(
        workerTicketIds.length > 0
          ? o(e(t.assignedTo, query.workerId as string), inArray(t.id, workerTicketIds))
          : e(t.assignedTo, query.workerId as string),
      );
    }

    if (query.startDate && query.endDate) {
      resolvedConditions.push(a(sql`${t.createdAt} >= ${query.startDate} 00:00:00`, sql`${t.createdAt} <= ${query.endDate} 23:59:59`));
    } else if (query.startDate) {
      resolvedConditions.push(sql`${t.createdAt} >= ${query.startDate} 00:00:00`);
    } else if (query.endDate) {
      resolvedConditions.push(sql`${t.createdAt} <= ${query.endDate} 23:59:59`);
    }

    if (resolvedConditions.length === 0) return undefined;
    return resolvedConditions.length === 1 ? resolvedConditions[0] : a(...resolvedConditions);
  });

  return successResponse(results);
});
