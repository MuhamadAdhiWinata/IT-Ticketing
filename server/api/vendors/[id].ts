import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { vendors } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { serializeVendor } from '~/server/utils/serialize';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Vendor ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor not found' });
    }

    await db.update(vendors).set({
      name: body.name ?? existing.name,
      serviceType: body.serviceType ?? body.service_type ?? existing.serviceType,
      contactPerson: body.contactPerson ?? body.contact_person ?? existing.contactPerson,
      phone: body.phone ?? existing.phone,
    }).where(eq(vendors.id, id)).execute();

    const result = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, id),
    });

    return successResponse(result ? serializeVendor(result) : null);
  }

  if (method === 'DELETE') {
    const existing = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor not found' });
    }

    await db.delete(vendors).where(eq(vendors.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
