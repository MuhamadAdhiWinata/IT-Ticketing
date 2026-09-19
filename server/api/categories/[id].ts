import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { categories, subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Category not found' });
    }

    await db.update(categories).set({ name: body.name }).where(eq(categories.id, id)).execute();

    const result = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });

    return successResponse(result);
  }

  if (method === 'DELETE') {
    const existing = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Category not found' });
    }

    await db.delete(subcategories).where(eq(subcategories.categoryId, id)).execute();
    await db.delete(categories).where(eq(categories.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
