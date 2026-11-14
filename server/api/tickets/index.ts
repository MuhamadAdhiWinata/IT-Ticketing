import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations, getTicketById } from '~/server/utils/tickets';
import { getCurrentUser } from '~/server/utils/user-context';
import { createTicket } from '~/server/services/ticketing/create';
import { toActor } from '~/server/services/ticketing/common';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    // Sengaja tanpa filter per user: halaman utama menampilkan semua pekerjaan IT ke semua role.
    const results = await getTicketsWithRelations((t: any, { eq: e, or: o, like: l, and: a }: any) => {
      const conditions: any[] = [];
      if (query.status) conditions.push(e(t.status, query.status as string));
      if (query.search) conditions.push(o(l(t.id, `%${query.search}%`), l(t.title, `%${query.search}%`)));
      return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
    });

    return successResponse(results);
  }

  if (method === 'POST') {
    const user = getCurrentUser(event);
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    const created = await createTicket(toActor(user), await readBody(event));
    return successResponse(await getTicketById(created.id));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
