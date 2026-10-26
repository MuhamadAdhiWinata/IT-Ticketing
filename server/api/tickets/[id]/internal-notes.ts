import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { serializeInternalNote } from '~/server/utils/serialize';
import { toActor } from '~/server/services/ticketing/common';
import { addInternalNote } from '~/server/services/ticketing/discussion';

// Rule 15: internal note hanya untuk IT; USER_NON_IT ditolak di level server (403).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  if (event.method === 'GET') {
    await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');

    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });

    const list = await db.query.internalNotes.findMany({
      where: (n, { eq: e }) => e(n.ticketId, id),
      orderBy: (n, { asc: a }) => a(n.createdAt),
    });
    return successResponse(list.map(serializeInternalNote));
  }

  if (event.method === 'POST') {
    const user = await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');
    const body = await readBody(event);
    const { note } = await addInternalNote(toActor(user), { ticketId: id, note: body?.note });
    return successResponse(note);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
