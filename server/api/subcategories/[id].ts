import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { serializeSubcategory } from '~/server/utils/serialize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Subcategory ID required' });
  }

  if (method === 'GET') {
    const subcategory = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!subcategory) {
      throw createError({ statusCode: 404, statusMessage: 'Subcategory not found' });
    }
    return successResponse(serializeSubcategory(subcategory));
  }

  if (method === 'PUT') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const body = await readBody(event);
    const categoryId = body.categoryId ?? body.category_id;

    await db.update(subcategories).set({
      name: body.name,
      categoryId,
    }).where(eq(subcategories.id, id)).execute();

    const result = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeSubcategory(result));
  }

  if (method === 'DELETE') {
    await requireRole(event, 'SYSTEM_ADMIN');
    await db.delete(subcategories).where(eq(subcategories.id, id)).execute();
    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});