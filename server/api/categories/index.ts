import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { categories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.categories.findMany();
    return successResponse(results);
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name' });
    }

    await db.insert(categories).values({
      id: body.id,
      name: body.name,
    }).execute();

    const result = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, body.id),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
