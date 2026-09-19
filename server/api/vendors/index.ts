import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { vendors } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.vendors.findMany();
    return successResponse(results);
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name || !body.serviceType || !body.contactPerson || !body.phone) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name, serviceType, contactPerson, phone' });
    }

    await db.insert(vendors).values({
      id: body.id,
      name: body.name,
      serviceType: body.serviceType,
      contactPerson: body.contactPerson,
      phone: body.phone,
    }).execute();

    const result = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, body.id),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
