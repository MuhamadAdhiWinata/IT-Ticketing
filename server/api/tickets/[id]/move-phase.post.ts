import { CLAIM } from '~/utils/permissions';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireClaim } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { moveTicketPhase } from '~/server/services/ticketing/workflow';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireClaim(event, CLAIM.IT);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  const body = await readBody(event);
  await moveTicketPhase(toActor(user), { ticketId: id, to: body?.to, notes: body?.notes });
  return successResponse(await getTicketById(id));
});
