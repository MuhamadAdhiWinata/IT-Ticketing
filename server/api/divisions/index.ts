import { db } from '~/server/database/client';
import { divisions } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function serializeDivision(d: { id: string; companyId: string; name: string }) {
  return { id: d.id, company_id: d.companyId, name: d.name };
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    const companyId = typeof query.companyId === 'string' && query.companyId.trim() ? query.companyId.trim() : null;

    const results = await db.query.divisions.findMany({
      where: companyId ? (d, { eq: e }) => e(d.companyId, companyId) : undefined,
      orderBy: (d, { asc }) => [asc(d.name)],
    });
    return successResponse(results.map(d => serializeDivision({ id: d.id, companyId: d.companyId, name: d.name })));
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const companyId = typeof body.company_id === 'string' ? body.company_id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!id || !companyId || !name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, company_id, name' });
    }

    const company = await db.query.companies.findFirst({
      where: (c, { eq: e }) => e(c.id, companyId),
    });
    if (!company) {
      throw createError({ statusCode: 404, statusMessage: 'Perusahaan tidak ditemukan' });
    }

    const idTaken = await db.query.divisions.findFirst({
      where: (d, { eq: e }) => e(d.id, id),
    });
    if (idTaken) {
      throw createError({ statusCode: 409, statusMessage: 'ID divisi sudah dipakai' });
    }

    const nameTaken = await db.query.divisions.findFirst({
      where: (d, { and: a, eq: e }) => a(e(d.companyId, companyId), e(d.name, name)),
    });
    if (nameTaken) {
      throw createError({ statusCode: 409, statusMessage: 'Nama divisi sudah dipakai di perusahaan ini' });
    }

    await db.insert(divisions).values({ id, companyId, name }).execute();

    return successResponse(serializeDivision({ id, companyId, name }));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
