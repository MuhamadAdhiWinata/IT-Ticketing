import { eq } from 'drizzle-orm';
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
    where: (m, { eq: e }) => (e(m.ticketId, ticketId) as any) && (e(m.userId, userId) as any),
  });

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' });
  }

  await db.delete(ticketMembers)
    .where((m, { eq: e }) => (e(m.ticketId, ticketId) as any) && (e(m.userId, userId) as any))
    .execute();

  return successResponse({ success: true });
});
