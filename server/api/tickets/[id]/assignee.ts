import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id || !body.userId) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID and userId required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  await db.update(tickets).set({
    assignedTo: body.userId,
  }).where(eq(tickets.id, id)).execute();

  const { createNotification } = await import('~/server/utils/notifications');
  const worker = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, body.userId) });
  if (worker) {
    await createNotification({
      userId: body.userId,
      ticketId: id,
      type: 'ASSIGNED',
      title: 'Tiket Ditugaskan',
      message: `Anda ditugaskan untuk menangani tiket ${existing.ticketNumber || id}: ${existing.title}`,
    });
  }

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

  return successResponse(result);
});
