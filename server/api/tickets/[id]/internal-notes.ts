import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getHeader(event, 'X-User-Id') || 'UNKNOWN';
  const body = await readBody(event);

  if (!id || !body.note) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and note required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  const ts = now();
  const newNote = {
    id: `IN-${Date.now()}`,
    author_id: userId,
    author_name: userId,
    note: body.note,
    created_at: ts,
  };

  const updatedNotes = [...(existing.internalNotes || []), newNote];

  await db.update(tickets).set({ internalNotes: updatedNotes }).where(eq(tickets.id, id)).execute();

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

  return successResponse(result);
});
