import { db } from '~/server/database/client';
import { categories } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.categories.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });
    return successResponse(results);
  }

  if (method === 'POST') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const body = await readBody(event);
    if (!body.name) throw createError({ statusCode: 400, statusMessage: 'Nama kategori wajib diisi' });

    const id = body.id || `CAT-${Date.now()}`;
    const idTaken = await db.query.categories.findFirst({ where: (c, { eq: e }) => e(c.id, id) });
    if (idTaken) throw createError({ statusCode: 409, statusMessage: 'ID kategori sudah dipakai' });
    await db.insert(categories).values({
      id,
      name: body.name,
      slaCritical: body.slaCritical || 1,
      slaHigh: body.slaHigh || 4,
      slaMedium: body.slaMedium || 8,
      slaLow: body.slaLow || 24,
    }).execute();

    return successResponse({ id, name: body.name });
  }
});