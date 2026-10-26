import { eq, and } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { ticketMembers } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { getTicketRow } from '~/server/services/ticketing/common';
import { isLocked } from '~/server/services/ticketing/permissions';

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');
  const ticketId = getRouterParam(event, 'id');
  const userId = getRouterParam(event, 'userId');

  if (!ticketId || !userId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and User ID required' });
  }

  const ticket = await getTicketRow(db, ticketId);
  if (isLocked(ticket)) {
    throw createError({ statusCode: 409, statusMessage: 'Tiket SELESAI: member terkunci' });
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
