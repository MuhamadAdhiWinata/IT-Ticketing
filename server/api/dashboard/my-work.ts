import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const userId = getHeader(event, 'X-User-Id') || '';

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'User ID required' });
  }

  const allTickets = await db.query.tickets.findMany();

  const myTickets = allTickets.filter(t => {
    if (t.assignedTo === userId) return true;
    if (t.requestedBy === userId) return true;
    if (t.supportingMembers?.includes(userId)) return true;
    if (t.worklogs?.some(wl => wl.worker_id === userId)) return true;
    return false;
  });

  return successResponse(myTickets);
});
