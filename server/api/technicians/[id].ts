import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { technicians } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Technician ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.technicians.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Technician not found' });
    }

    await db.update(technicians).set({
      name: body.name ?? existing.name,
      specialty: body.specialty ?? existing.specialty,
      phone: body.phone ?? existing.phone,
    }).where(eq(technicians.id, id)).execute();

    const result = await db.query.technicians.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });

    return successResponse(result);
  }

  if (method === 'DELETE') {
    const existing = await db.query.technicians.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Technician not found' });
    }

    await db.delete(technicians).where(eq(technicians.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
