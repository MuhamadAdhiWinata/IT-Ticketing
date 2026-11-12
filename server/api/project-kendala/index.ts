import { db } from '~/server/database/client';
import { projectKendala } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { serializeProjectKendalas, serializeProjectKendala } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.projectKendala.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    });
    return successResponse(serializeProjectKendalas(results));
  }

  if (method === 'POST') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    const body = await readBody(event);
    const categoryId = body.categoryId ?? body.category_id;
    if (!body.name || !categoryId) throw createError({ statusCode: 400, statusMessage: 'Nama dan ID Kategori wajib diisi' });

    const id = body.id || `SCAT-${Date.now()}`;
    const idTaken = await db.query.projectKendala.findFirst({ where: (pk, { eq: e }) => e(pk.id, id) });
    if (idTaken) throw createError({ statusCode: 409, statusMessage: 'ID Aplikasi/Kendala sudah dipakai' });
    await db.insert(projectKendala).values({
      id,
      name: body.name,
      categoryId,
    }).execute();

    const created = await db.query.projectKendala.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeProjectKendala(created));
  }
});
