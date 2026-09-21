import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getHeader(event, 'X-User-Id') || 'UNKNOWN';
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

  const ts = now();
  const wlId = `WL-${Date.now()}`;

  await db.insert(worklogs).values({
    id: wlId,
    ticketId: id,
    stageKey: body.stageKey || 'IN_PROGRESS',
    workerId: userId,
    workerName: userId,
    date: new Date().toISOString().split('T')[0],
    startAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    finishAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    durationMinutes: 0,
    description: body.description || '',
    createdAt: ts,
  }).execute();

  const result = await getTicketById(id);

  return successResponse(result);
});
