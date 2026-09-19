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
    assignedToName: body.userName || body.userId,
  }).where(eq(tickets.id, id)).execute();

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

  return successResponse(result);
});
