import { getCurrentUserId } from '~/server/utils/user-context';
import { db } from '~/server/database/client';
import { worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { eq } from 'drizzle-orm';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  const workerId = body.worker_id || userId;
  if (!workerId) {
    throw createError({ statusCode: 400, statusMessage: 'worker_id required' });
  }

  // Overlap validation
  const date = body.date || new Date().toISOString().slice(0, 10);
  const startAt = body.start_at || '00:00';
  const finishAt = body.finish_at || '00:00';

  const timeToMinutes = (t: string) => {
    const parts = t.split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return h * 60 + m;
  };
  const s = timeToMinutes(startAt);
  const f = timeToMinutes(finishAt);

  const existingLogs = await db.query.worklogs.findMany({
    where: (w, { eq: e, and: a }) => a(eq(w.workerId, workerId), eq(w.date, date)),
  });

  for (const log of existingLogs) {
    const es = timeToMinutes(log.startAt);
    const ef = timeToMinutes(log.finishAt);
    if (s < ef && f > es) {
      throw createError({ statusCode: 400, statusMessage: 'Jam kerja tumpang tindih dengan log lain' });
    }
  }

  await db.insert(worklogs).values({
    id: `WL-${Date.now()}`,
    ticketId: id,
    stageKey: body.stageKey || 'IN_PROGRESS',
    workerId,
    date,
    startAt,
    finishAt,
    durationMinutes: body.duration_minutes || (f - s),
    description: body.description || '',
    createdAt: now(),
  }).execute();

  const result = await getTicketById(id);
  return successResponse(result);
});
