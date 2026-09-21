import { eq, and, or, like } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const results = await getTicketsWithRelations((t, { eq: e, or: o, like: l, and: a }: any) => {
    const conditions: any[] = [];
    if (query.status) conditions.push(e(t.status, query.status as string));
    if (query.category) conditions.push(e(t.category, query.category as string));
    if (query.priority) conditions.push(e(t.priority, query.priority as string));
    return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
  });

  let totalTickets = results.length;
  let completedCount = results.filter(t => t.status === 'SELESAI').length;
  let inProgressCount = results.filter(t => t.status === 'PROCESS' || t.status === 'DELEGASI').length;
  let totalWorklogHours = 0;
  results.forEach(t => {
    t.worklogs?.forEach(wl => {
      totalWorklogHours += (wl.durationMinutes || 0) / 60;
    });
  });

  return successResponse({
    totalTickets,
    completedCount,
    inProgressCount,
    totalWorklogHours: totalWorklogHours.toFixed(2),
  });
});
