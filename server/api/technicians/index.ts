import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { technicians } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const results = await db.query.technicians.findMany();
    return successResponse(results);
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name || !body.specialty || !body.phone) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name, specialty, phone' });
    }

    await db.insert(technicians).values({
      id: body.id,
      name: body.name,
      specialty: body.specialty,
      phone: body.phone,
    }).execute();

    const result = await db.query.technicians.findFirst({
      where: (t, { eq: e }) => e(t.id, body.id),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
