import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    if (query.role) {
      const results = await db.query.users.findMany({
        where: (u, { eq: e }) => e(u.role, query.role as string),
      });
      return successResponse(results);
    }

    const results = await db.query.users.findMany();
    return successResponse(results);
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name || !body.email || !body.role || !body.department) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name, email, role, department' });
    }

    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.email, body.email),
    });
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' });
    }

    await db.insert(users).values({
      id: body.id,
      name: body.name,
      email: body.email,
      role: body.role,
      department: body.department,
      avatarUrl: body.avatarUrl || null,
    }).execute();

    const result = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, body.id),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
