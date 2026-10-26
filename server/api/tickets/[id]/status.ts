import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { StatusUpdateSchema, validate } from '~/server/utils/validate';
import { toActor } from '~/server/services/ticketing/common';
import { transitionStatus } from '~/server/services/ticketing/workflow';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  const body = await readBody(event);

  if (!id || !body?.status) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and status required' });
  }
  const check = validate(StatusUpdateSchema, body);
  if (!check.success) throw createError({ statusCode: 400, statusMessage: check.error });

  await transitionStatus(toActor(user), { ticketId: id, to: check.data.status });
  return successResponse(await getTicketById(id));
});
