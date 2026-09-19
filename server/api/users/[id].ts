import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }

    await db.update(users).set({
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      role: body.role ?? existing.role,
      department: body.department ?? existing.department,
      avatarUrl: body.avatarUrl ?? existing.avatarUrl,
    }).where(eq(users.id, id)).execute();

    const result = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });

    return successResponse(result);
  }

  if (method === 'DELETE') {
    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }

    await db.delete(users).where(eq(users.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
