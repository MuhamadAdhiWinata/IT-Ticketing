import { db } from '~/server/database/client';
import { subcategories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { serializeSubcategories, serializeSubcategory } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.subcategories.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    });
    return successResponse(serializeSubcategories(results));
  }

  if (method === 'POST') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const body = await readBody(event);
    const categoryId = body.categoryId ?? body.category_id;
    if (!body.name || !categoryId) throw createError({ statusCode: 400, statusMessage: 'Nama dan ID Kategori wajib diisi' });

    const id = body.id || `SCAT-${Date.now()}`;
    await db.insert(subcategories).values({
      id,
      name: body.name,
      categoryId,
    }).execute();

    const created = await db.query.subcategories.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeSubcategory(created));
  }
});