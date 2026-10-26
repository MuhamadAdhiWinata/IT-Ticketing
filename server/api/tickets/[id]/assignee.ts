import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { assignTicket } from '~/server/services/ticketing/assignment';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  const body = await readBody(event);

  if (!id || !body?.userId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and userId required' });
  }

  await assignTicket(toActor(user), { ticketId: id, userId: body.userId });
  return successResponse(await getTicketById(id));
});
