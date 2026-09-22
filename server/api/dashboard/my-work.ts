import { getCurrentUserId } from '~/server/utils/user-context';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const userId = getCurrentUserId(event);

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'User ID required' });
  }

  // Fetch tickets where user is assigned, requested, or has worklogs
  const results = await getTicketsWithRelations((t, { eq: e, or: o, sql: s }: any) => o(
    e(t.assignedTo, userId),
    e(t.requestedBy, userId),
    // For worklogs, it's easier to fetch all then filter or use a subquery.
    // Given typical ticket counts, fetching and filtering is fine.
  ));

  // Also include tickets where the user has at least one worklog
  const allTickets = await getTicketsWithRelations();

  const myWorkTickets = allTickets.filter(t => {
    if (t.assignedTo === userId) return true;
    if (t.requestedBy === userId) return true;
    if (t.worklogs?.some(wl => wl.workerId === userId)) return true;
    return false;
  });

  return successResponse(myWorkTickets);
});
