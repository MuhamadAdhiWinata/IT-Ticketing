import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeSubcategories } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    let results;
    if (query.categoryId) {
      results = await db.query.subcategories.findMany({
        where: (s, { eq: e }) => e(s.categoryId, query.categoryId as string),
      });
    } else {
      results = await db.query.subcategories.findMany();
    }

    return successResponse(serializeSubcategories(results));
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const categoryId = body.categoryId || body.category_id;

    if (!body.id || !categoryId || !body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, categoryId/category_id, name' });
    }

    await db.insert(subcategories).values({
      id: body.id,
      categoryId: categoryId,
      name: body.name,
    }).execute();

    const result = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, body.id),
    });

    return successResponse(result ? { id: result.id, category_id: result.categoryId, name: result.name } : result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
