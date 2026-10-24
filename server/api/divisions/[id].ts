import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { divisions, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function serializeDivision(d: { id: string; companyId: string; name: string }) {
  return { id: d.id, company_id: d.companyId, name: d.name };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Division ID required' });
  }

  const existing = await db.query.divisions.findFirst({
    where: (d, { eq: e }) => e(d.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Divisi tidak ditemukan' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const name = typeof body.name === 'string' ? body.name.trim() : existing.name;
    const companyId = typeof body.company_id === 'string' && body.company_id.trim()
      ? body.company_id.trim()
      : existing.companyId;

    if (companyId !== existing.companyId) {
      const company = await db.query.companies.findFirst({
        where: (c, { eq: e }) => e(c.id, companyId),
      });
      if (!company) {
        throw createError({ statusCode: 404, statusMessage: 'Perusahaan tidak ditemukan' });
      }
    }

    const duplicate = await db.query.divisions.findFirst({
      where: (d, { and: a, eq: e, ne: n }) => a(e(d.companyId, companyId), e(d.name, name), n(d.id, id)),
    });
    if (duplicate) {
      throw createError({ statusCode: 409, statusMessage: 'Nama divisi sudah dipakai di perusahaan ini' });
    }

    await db.update(divisions).set({ name, companyId }).where(eq(divisions.id, id)).execute();

    return successResponse(serializeDivision({ id, companyId, name }));
  }

  if (method === 'DELETE') {
    await db.update(users).set({ divisionId: null }).where(eq(users.divisionId, id)).execute();
    await db.delete(divisions).where(eq(divisions.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
