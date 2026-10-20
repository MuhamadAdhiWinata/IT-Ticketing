import { db } from '~/server/database/client';
import { vendors } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.vendors.findMany({
      orderBy: (v, { asc }) => [asc(v.name)],
    });
    return successResponse(results);
  }

  if (method === 'POST') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const body = await readBody(event);
    if (!body.name) throw createError({ statusCode: 400, statusMessage: 'Nama vendor wajib diisi' });

    const id = `VND-${Date.now()}`;
    await db.insert(vendors).values({
      id,
      name: body.name,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      address: body.address,
    }).execute();

    return successResponse({ id, name: body.name });
  }
});