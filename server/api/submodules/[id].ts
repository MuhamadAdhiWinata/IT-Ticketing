import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { submodules } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeSubmodule } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Submodule ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const subcategoryId = body.subcategoryId || body.subcategory_id;

    const existing = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Submodule not found' });
    }

    await db.update(submodules).set({
      subcategoryId: subcategoryId ?? existing.subcategoryId,
      name: body.name ?? existing.name,
    }).where(eq(submodules.id, id)).execute();

    const result = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });

    return successResponse(result ? serializeSubmodule(result) : null);
  }

  if (method === 'DELETE') {
    const existing = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Submodule not found' });
    }

    await db.delete(submodules).where(eq(submodules.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
