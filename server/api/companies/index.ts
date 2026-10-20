import { db } from '~/server/database/client';
import { companies } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function serializeCompany(c: { id: string; name: string }) {
  return { id: c.id, name: c.name };
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.companies.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });
    return successResponse(results.map(serializeCompany));
  }

  if (method === 'POST') {
    const body = await readBody(event);
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!id || !name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name' });
    }

    const idTaken = await db.query.companies.findFirst({
      where: (c, { eq: e }) => e(c.id, id),
    });
    if (idTaken) {
      throw createError({ statusCode: 409, statusMessage: 'ID perusahaan sudah dipakai' });
    }

    const nameTaken = await db.query.companies.findFirst({
      where: (c, { eq: e }) => e(c.name, name),
    });
    if (nameTaken) {
      throw createError({ statusCode: 409, statusMessage: 'Nama perusahaan sudah dipakai' });
    }

    await db.insert(companies).values({ id, name }).execute();

    return successResponse(serializeCompany({ id, name }));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
