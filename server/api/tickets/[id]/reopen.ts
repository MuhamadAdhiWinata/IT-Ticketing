import { CLAIM } from '~/utils/permissions';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireClaim } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { reopenTicket } from '~/server/services/ticketing/workflow';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireClaim(event, CLAIM.IT);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  await reopenTicket(toActor(user), { ticketId: id });
  return successResponse(await getTicketById(id));
});
