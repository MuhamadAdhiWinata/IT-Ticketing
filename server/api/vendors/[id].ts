import { db } from '~/server/database/client';
import { vendors } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireRole } from '~/server/utils/authorize';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Vendor ID required' });
  }

  if (method === 'GET') {
    const vendor = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, id),
    });
    if (!vendor) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor not found' });
    }
    return successResponse(vendor);
  }

  if (method === 'PUT') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const body = await readBody(event);

    await db.update(vendors).set({
      name: body.name,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      address: body.address,
    }).where(eq(vendors.id, id)).execute();

    const updatedVendor = await db.query.vendors.findFirst({
      where: (v, { eq: e }) => e(v.id, id),
    });
    return successResponse(updatedVendor);
  }

  if (method === 'DELETE') {
    await requireRole(event, 'SYSTEM_ADMIN');
    await db.delete(vendors).where(eq(vendors.id, id)).execute();
    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});