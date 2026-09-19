import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    if (query.categoryId) {
      const results = await db.query.subcategories.findMany({
        where: (s, { eq: e }) => e(s.categoryId, query.categoryId as string),
      });
      return successResponse(results);
    }

    const results = await db.query.subcategories.findMany();
    return successResponse(results);
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.categoryId || !body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, categoryId, name' });
    }

    await db.insert(subcategories).values({
      id: body.id,
      categoryId: body.categoryId,
      name: body.name,
    }).execute();

    const result = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, body.id),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
