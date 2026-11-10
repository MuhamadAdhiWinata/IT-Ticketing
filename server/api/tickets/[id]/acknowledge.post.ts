import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { acknowledgeTicket } from '~/server/services/ticketing/triage';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  await acknowledgeTicket(toActor(user), { ticketId: id });
  return successResponse(await getTicketById(id));
});
