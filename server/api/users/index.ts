import { eq, like, or } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    const conditions: any[] = [];

    if (query.role) {
      conditions.push(eq(users.role, query.role as string));
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(or(
        like(users.name, term),
        like(users.email, term),
        like(users.department, term),
      )!);
    }

    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const offset = query.offset ? Math.max(Number(query.offset), 0) : 0;

    if (conditions.length > 0) {
      const results = await db.query.users.findMany({
        where: (u, { and }) => and(...conditions),
        limit,
        offset,
      });
      return successResponse(results);
    }

    const results = await db.query.users.findMany({ limit, offset });
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
