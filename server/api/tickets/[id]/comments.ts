import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import { serializeComment } from '~/server/utils/serialize';
import { toActor } from '~/server/services/ticketing/common';
import { addComment } from '~/server/services/ticketing/discussion';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  if (event.method === 'GET') {
    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });

    const list = await db.query.comments.findMany({
      where: (c, { eq: e }) => e(c.ticketId, id),
      orderBy: (c, { asc: a }) => a(c.createdAt),
    });
    return successResponse(list.map(serializeComment));
  }

  if (event.method === 'POST') {
    const user = await requireAuth(event);
    const body = await readBody(event);
    const { comment } = await addComment(toActor(user), { ticketId: id, message: body?.message });
    return successResponse(comment);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
