import { db } from '~/server/database/client';
import { categories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID required' });
  }

  if (method === 'GET') {
    const category = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });
    if (!category) {
      throw createError({ statusCode: 404, statusMessage: 'Category not found' });
    }
    return successResponse(category);
  }

  if (method === 'PUT') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    const body = await readBody(event);

    await db.update(categories).set({
      name: body.name,
      slaCritical: body.slaCritical,
      slaHigh: body.slaHigh,
      slaMedium: body.slaMedium,
      slaLow: body.slaLow,
    }).where(eq(categories.id, id)).execute();

    const updatedCategory = await db.query.categories.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });
    return successResponse(updatedCategory);
  }

  if (method === 'DELETE') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    await db.delete(categories).where(eq(categories.id, id)).execute();
    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});