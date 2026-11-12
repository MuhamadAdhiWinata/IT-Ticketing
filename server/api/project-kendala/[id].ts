import { db } from '~/server/database/client';
import { projectKendala } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { serializeProjectKendala } from '~/server/utils/serialize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Aplikasi/Kendala ID required' });
  }

  if (method === 'GET') {
    const row = await db.query.projectKendala.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Aplikasi/Kendala not found' });
    }
    return successResponse(serializeProjectKendala(row));
  }

  if (method === 'PUT') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    const body = await readBody(event);
    const categoryId = body.categoryId ?? body.category_id;

    await db.update(projectKendala).set({
      name: body.name,
      categoryId,
    }).where(eq(projectKendala.id, id)).execute();

    const result = await db.query.projectKendala.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeProjectKendala(result));
  }

  if (method === 'DELETE') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    await db.delete(projectKendala).where(eq(projectKendala.id, id)).execute();
    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
