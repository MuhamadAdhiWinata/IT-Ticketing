import { db } from '~/server/database/client';
import { internalNotes, tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { serializeInternalNote } from '~/server/utils/serialize';
import { NoteSchema, validate } from '~/server/utils/validate';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

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

    const check = validate(NoteSchema, body);
    if (!check.success) {
      throw createError({ statusCode: 400, statusMessage: check.error });
    }

    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });

    const row = {
      id: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticketId: id,
      authorId: user.id,
      authorName: user.name,
      note: check.data.note,
      createdAt: now(),
    };
    await db.insert(internalNotes).values(row);

    return successResponse(serializeInternalNote(row));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
