import { eq, inArray } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { companies, divisions, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function serializeCompany(c: { id: string; name: string }) {
  return { id: c.id, name: c.name };
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Company ID required' });
  }

  const existing = await db.query.companies.findFirst({
    where: (c, { eq: e }) => e(c.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Perusahaan tidak ditemukan' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    const name = typeof body.name === 'string' ? body.name.trim() : existing.name;

    const duplicate = await db.query.companies.findFirst({
      where: (c, { and: a, eq: e, ne: n }) => a(e(c.name, name), n(c.id, id)),
    });
    if (duplicate) {
      throw createError({ statusCode: 409, statusMessage: 'Nama perusahaan sudah dipakai' });
    }

    await db.update(companies).set({ name }).where(eq(companies.id, id)).execute();

    return successResponse(serializeCompany({ id, name }));
  }

  if (method === 'DELETE') {
    const childIds = (await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.companyId, id))).map(r => r.id);

    if (childIds.length > 0) {
      await db.update(users)
        .set({ divisionId: null })
        .where(inArray(users.divisionId, childIds))
        .execute();
    }
    await db.update(users).set({ companyId: null }).where(eq(users.companyId, id)).execute();
    await db.delete(divisions).where(eq(divisions.companyId, id)).execute();
    await db.delete(companies).where(eq(companies.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
