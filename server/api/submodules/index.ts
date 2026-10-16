import { eq, like, and } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { submodules } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeSubmodules } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    const conditions: any[] = [];

    if (query.subcategoryId) {
      conditions.push(eq(submodules.subcategoryId, query.subcategoryId as string));
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      conditions.push(like(submodules.name, `%${query.search.trim()}%`));
    }

    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const offset = query.offset ? Math.max(Number(query.offset), 0) : 0;

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db.query.submodules.findMany({ where, limit, offset });

    return successResponse(serializeSubmodules(results));
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const subcategoryId = body.subcategoryId || body.subcategory_id;

    if (!body.id || !subcategoryId || !body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, subcategoryId/subcategory_id, name' });
    }

    await db.insert(submodules).values({
      id: body.id,
      subcategoryId,
      name: body.name,
    }).execute();

    const result = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, body.id),
    });

    return successResponse(result ? { id: result.id, subcategory_id: result.subcategoryId, name: result.name } : result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
