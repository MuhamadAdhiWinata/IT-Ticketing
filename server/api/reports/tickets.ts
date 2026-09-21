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
    conditions.push(or(
      eq(tickets.assignedTo, query.workerId as string),
      sql`${tickets.supportingMembers} LIKE '%"${query.workerId}"%'`, // Assuming supportingMembers is JSON array of IDs
      sql`${worklogs.workerId} = ${query.workerId}` // Join with worklogs to filter by worker
    ));
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
        resolvedConditions.push(o(
          e(t.assignedTo, query.workerId as string),
          sql`${t.supportingMembers} LIKE '%"${query.workerId}"%'`, // Assuming supportingMembers is JSON array of IDs
          // For worklogs, we need a subquery or join, which is more complex in findMany where clause directly.
          // For simplicity, we filter worklogs data client-side if workerId is present.
        ));
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