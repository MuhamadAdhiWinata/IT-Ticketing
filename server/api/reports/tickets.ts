import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const conditions: any[] = [];

  if (query.status) conditions.push(eq(tickets.status, query.status));
  if (query.category) conditions.push(eq(tickets.category, query.category));
  if (query.priority) conditions.push(eq(tickets.priority, query.priority));
  if (query.workerId) {
    conditions.push((args: any) => {
      const { or, like } = args;
      return or(
        like(tickets.assignedTo, query.workerId),
        like(tickets.primaryWorkerId, query.workerId),
      );
    });
  }

  const results = conditions.length > 0
    ? await db.query.tickets.findMany({ where: (t, { eq: e, or: o, like: l }) => {
        const conds: any[] = [];
        if (query.status) conds.push(e(t.status, query.status));
        if (query.category) conds.push(e(t.category, query.category));
        if (query.priority) conds.push(e(t.priority, query.priority));
        if (query.workerId) conds.push(o(l(t.assignedTo, `%${query.workerId}%`), l(t.primaryWorkerId, `%${query.workerId}%`)));
        return conds.length === 1 ? conds[0] : conds.reduce((acc, c) => ({ and: () => c }));
      }})
    : await db.query.tickets.findMany();

  return successResponse(results);
});
