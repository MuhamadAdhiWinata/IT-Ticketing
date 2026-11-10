import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { updateExecution } from '~/server/services/ticketing/triage';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  const body = (await readBody(event)) ?? {};
  await updateExecution(toActor(user), { ...body, ticketId: id });
  return successResponse(await getTicketById(id));
});
