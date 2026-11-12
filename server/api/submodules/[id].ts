import { db } from '~/server/database/client';
import { submodules } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { serializeSubmodule } from '~/server/utils/serialize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Submodule ID required' });
  }

  if (method === 'GET') {
    const row = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Submodule not found' });
    }
    return successResponse(serializeSubmodule(row));
  }

  if (method === 'PUT') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    const body = await readBody(event);
    const projectKendalaId = body.projectKendalaId ?? body.project_kendala_id;

    await db.update(submodules).set({
      name: body.name,
      projectKendalaId,
    }).where(eq(submodules.id, id)).execute();

    const result = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeSubmodule(result));
  }

  if (method === 'DELETE') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    await db.delete(submodules).where(eq(submodules.id, id)).execute();
    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});