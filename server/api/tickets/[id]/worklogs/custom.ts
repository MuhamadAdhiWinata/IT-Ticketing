import { getCurrentUserId } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

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

  const ts = now();
  const newWorklog = {
    id: `WL-${Date.now()}`,
    stageKey: body.stageKey || 'IN_PROGRESS',
    worker_id: userId,
    worker_name: userId,
    date: body.date || new Date().toISOString().split('T')[0],
    start_at: body.start_at || '',
    finish_at: body.finish_at || '',
    duration_minutes: body.duration_minutes || 0,
    description: body.description || '',
    created_at: ts,
  };

  const updatedWorklogs = [...(existing.worklogs || []), newWorklog];

  await db.update(tickets).set({ worklogs: updatedWorklogs }).where(eq(tickets.id, id)).execute();

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

  return successResponse(result);
});
