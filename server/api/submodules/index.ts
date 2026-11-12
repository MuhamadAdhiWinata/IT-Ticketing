import { db } from '~/server/database/client';
import { submodules } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { serializeSubmodules, serializeSubmodule } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.submodules.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    });
    return successResponse(serializeSubmodules(results));
  }

  if (method === 'POST') {
    await requireClaim(event, CLAIM.MANAGE_MASTER);
    const body = await readBody(event);
    const projectKendalaId = body.projectKendalaId ?? body.project_kendala_id;
    if (!body.name || !projectKendalaId) throw createError({ statusCode: 400, statusMessage: 'Nama dan ID Aplikasi/Kendala wajib diisi' });

    const id = body.id || `SMOD-${Date.now()}`;
    const idTaken = await db.query.submodules.findFirst({ where: (sm, { eq: e }) => e(sm.id, id) });
    if (idTaken) throw createError({ statusCode: 409, statusMessage: 'ID Modul sudah dipakai' });
    await db.insert(submodules).values({
      id,
      name: body.name,
      projectKendalaId,
    }).execute();

    const created = await db.query.submodules.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });
    return successResponse(serializeSubmodule(created));
  }
});