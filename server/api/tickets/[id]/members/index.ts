import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { ticketMembers } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId } from '~/server/utils/user-context';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  if (event.method === 'GET') {
    const members = await db.query.ticketMembers.findMany({
      where: (m, { eq: e }) => e(m.ticketId, id),
    });
    return successResponse(members);
  }

  if (event.method === 'POST') {
    const body = await readBody(event);
    const userIds: string[] = body.userIds || [];

    if (userIds.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'userIds array required' });
    }

    // Fetch user names
    const allUsers = await db.query.users.findMany();
    const userMap = new Map(allUsers.map(u => [u.id, u.name]));

    const results = [];
    for (const userId of userIds) {
      // Check if already a member
      const existing = await db.query.ticketMembers.findFirst({
        where: (m, { eq: e, and: a }) => a(e(m.ticketId, id), e(m.userId, userId)),
      });
      if (existing) continue;

      const member = {
        id: `TM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ticketId: id,
        userId,
        userName: userMap.get(userId) || userId,
        createdAt: now(),
      };
      await db.insert(ticketMembers).values(member);
      results.push(member);
    }

    return successResponse(results);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
