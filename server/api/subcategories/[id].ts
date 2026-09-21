import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeSubcategory } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Subcategory ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const categoryId = body.categoryId || body.category_id;

    const existing = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Subcategory not found' });
    }

    await db.update(subcategories).set({
      categoryId: categoryId ?? existing.categoryId,
      name: body.name ?? existing.name,
    }).where(eq(subcategories.id, id)).execute();

    const result = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });

    return successResponse(result ? serializeSubcategory(result) : null);
  }

  if (method === 'DELETE') {
    const existing = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Subcategory not found' });
    }

    await db.delete(subcategories).where(eq(subcategories.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
