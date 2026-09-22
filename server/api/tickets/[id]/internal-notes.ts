import { getCurrentUserId } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, internalNotes } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
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
  const noteId = `IN-${Date.now()}`;

  await db.insert(internalNotes).values({
    id: noteId,
    ticketId: id,
    authorId: userId,
    authorName: userId,
    note: body.note,
    createdAt: ts,
  }).execute();

  const result = await getTicketById(id);

  return successResponse(result);
});
