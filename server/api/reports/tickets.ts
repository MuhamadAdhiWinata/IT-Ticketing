import { eq, and, or, like, between, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const conditions: any[] = [];

  if (query.status) conditions.push(eq(tickets.status, query.status as string));
  if (query.category) conditions.push(eq(tickets.category, query.category as string));
  if (query.priority) conditions.push(eq(tickets.priority, query.priority as string));

    if (query.workerId) {
      const workerTickets = await db.query.ticketMembers.findMany({
        where: (m, { eq: e }) => e(m.userId, query.workerId as string),
      });
      const workerTicketIds = new Set(workerTickets.map(m => m.ticketId));
      results = results.filter(t => t.assignedTo === query.workerId || workerTicketIds.has(t.id));
    }

  if (query.startDate && query.endDate) {
    conditions.push(between(tickets.createdAt, `${query.startDate} 00:00:00`, `${query.endDate} 23:59:59`));
  } else if (query.startDate) {
    conditions.push(sql`${tickets.createdAt} >= ${query.startDate} 00:00:00`);
  } else if (query.endDate) {
    conditions.push(sql`${tickets.createdAt} <= ${query.endDate} 23:59:59`);
  }

  let results;
  if (conditions.length > 0) {
    results = await getTicketsWithRelations((t, { eq: e, or: o, like: l, and: a }: any) => {
      const resolvedConditions: any[] = [];
      if (query.status) resolvedConditions.push(e(t.status, query.status as string));
      if (query.category) resolvedConditions.push(e(t.category, query.category as string));
      if (query.priority) resolvedConditions.push(e(t.priority, query.priority as string));

      if (query.workerId) {
        resolvedConditions.push(e(t.assignedTo, query.workerId as string));
      }

      if (query.startDate && query.endDate) {
        resolvedConditions.push(a(sql`${t.createdAt} >= ${query.startDate} 00:00:00`, sql`${t.createdAt} <= ${query.endDate} 23:59:59`));
      } else if (query.startDate) {
        resolvedConditions.push(sql`${t.createdAt} >= ${query.startDate} 00:00:00`);
      } else if (query.endDate) {
        resolvedConditions.push(sql`${t.createdAt} <= ${query.endDate} 23:59:59`);
      }

      return resolvedConditions.length === 1 ? resolvedConditions[0] : a(...resolvedConditions);
    });
  } else {
    results = await getTicketsWithRelations();
  }

  return successResponse(results);
});