import { eq, like } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeSubcategories } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    const conditions: any[] = [];

    if (query.categoryId) {
      conditions.push(eq(subcategories.categoryId, query.categoryId as string));
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(like(subcategories.name, term));
    }

    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const offset = query.offset ? Math.max(Number(query.offset), 0) : 0;

    let results;
    if (conditions.length > 0) {
      const { and } = await import('drizzle-orm');
      results = await db.query.subcategories.findMany({
        where: (s) => and(...conditions),
        limit,
        offset,
      });
    } else {
      results = await db.query.subcategories.findMany({ limit, offset });
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
