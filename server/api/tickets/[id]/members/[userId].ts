import { eq, and } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { ticketMembers } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const ticketId = getRouterParam(event, 'id');
  const userId = getRouterParam(event, 'userId');

  if (!ticketId || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and User ID required' });
  }

  const existing = await db.query.ticketMembers.findFirst({
    where: (m, { eq: e, and: a }) => a(e(m.ticketId, ticketId), e(m.userId, userId)),
  });

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' });
  }

  await db.delete(ticketMembers)
    .where(and(eq(ticketMembers.ticketId, ticketId), eq(ticketMembers.userId, userId)))
    .execute();

  return successResponse({ success: true });
});
