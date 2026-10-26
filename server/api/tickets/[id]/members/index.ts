import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import { toActor } from '~/server/services/ticketing/common';
import { addMembers } from '~/server/services/ticketing/assignment';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  const user = await requireAuth(event);

  if (event.method === 'GET') {
    const members = await db.query.ticketMembers.findMany({
      where: (m, { eq: e }) => e(m.ticketId, id),
    });
    return successResponse(members);
  }

  if (event.method === 'POST') {
    const body = await readBody(event);
    const userIds: string[] = body?.userIds || [];
    if (userIds.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'userIds array required' });
    }
    const { added } = await addMembers(toActor(user), { ticketId: id, userIds });
    return successResponse(added);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
