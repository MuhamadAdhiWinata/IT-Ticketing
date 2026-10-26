import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { CustomWorklogSchema } from '~/server/utils/validate';
import { toActor } from '~/server/services/ticketing/common';
import { logWorkTime } from '~/server/services/ticketing/activities';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  const body = await readBody(event);
  const check = CustomWorklogSchema.safeParse(body);
  if (!check.success) {
    throw createError({ statusCode: 400, statusMessage: check.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') });
  }
  const d = check.data;

  await logWorkTime(
    toActor(user),
    { ticketId: id, date: d.date, start_at: d.start_at, finish_at: d.finish_at, duration_minutes: d.duration_minutes, description: d.description, stageKey: d.stageKey as any },
    { workerId: d.worker_id },
  );

  return successResponse(await getTicketById(id));
});
