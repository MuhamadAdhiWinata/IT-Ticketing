import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { isValidTransition } from '~/server/utils/ticket-lifecycle';
import { getCurrentUserId } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const body = await readBody(event);

  if (!id || !body.status) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and status required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  if (!isValidTransition(existing.status, body.status)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot transition from ${existing.status} to ${body.status}`,
    });
  }

  await db.update(tickets).set({ status: body.status }).where(eq(tickets.id, id)).execute();

  const result = await getTicketById(id);

  return successResponse(result);
});
