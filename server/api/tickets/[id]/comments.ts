import { db } from '~/server/database/client';
import { comments, tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import { serializeComment } from '~/server/utils/serialize';
import { CommentSchema, validate } from '~/server/utils/validate';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

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

    const check = validate(CommentSchema, body);
    if (!check.success) {
      throw createError({ statusCode: 400, statusMessage: check.error });
    }

    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });

    const row = {
      id: `CMT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticketId: id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message: check.data.message,
      createdAt: now(),
    };
    await db.insert(comments).values(row);

    // Notify other parties
    const { createNotification } = await import('~/server/utils/notifications');
    const notifyId = user.id === existing.requestedBy ? existing.assignedTo : existing.requestedBy;
    if (notifyId) {
      await createNotification({
        userId: notifyId,
        ticketId: id,
        type: 'COMMENT',
        title: 'Komentar Baru',
        message: `${user.name} mengomentari tiket ${existing.ticketNumber || id}: "${row.message.slice(0, 50)}..."`,
      });
    }

    return successResponse(serializeComment(row));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
