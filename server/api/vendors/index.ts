import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { vendors } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeVendors } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.vendors.findMany();
    return successResponse(serializeVendors(results));
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name' });
    }

    await db.insert(vendors).values({
      id: body.id,
      name: body.name,
      serviceType: body.serviceType || body.service_type || '',
      contactPerson: body.contactPerson || body.contact_person || '',
      phone: body.phone || '',
    }).execute();

    const result = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, body.id),
    });

    return successResponse(result ? { id: result.id, name: result.name, service_type: result.serviceType, contact_person: result.contactPerson, phone: result.phone } : result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
