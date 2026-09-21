import { eq, and } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  if (method === 'GET') {
    const ticket = await getTicketById(id);

    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    }

    return successResponse(ticket);
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    }

    await db.update(tickets).set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      subcategory: body.subcategory ?? existing.subcategory,
      location: body.location ?? existing.location,
      priority: body.priority ?? existing.priority,
      status: body.status ?? existing.status,
      assignedTo: body.assignedTo ?? existing.assignedTo,
      assignedToName: body.assignedToName ?? existing.assignedToName,
      delegationType: body.delegationType ?? existing.delegationType,
      vendorId: body.vendorId ?? existing.vendorId,
      vendorName: body.vendorName ?? existing.vendorName,
      technicianId: body.technicianId ?? existing.technicianId,
      technicianName: body.technicianName ?? existing.technicianName,
      referenceNo: body.referenceNo ?? existing.referenceNo,
      delegationNotes: body.delegationNotes ?? existing.delegationNotes,
      delegatedAt: body.delegatedAt ?? existing.delegatedAt,
      returnedAt: body.returnedAt ?? existing.returnedAt,
      returnedNotes: body.returnedNotes ?? existing.returnedNotes,
      referencedTicketId: body.referencedTicketId ?? existing.referencedTicketId,
      resolutionSummary: body.resolutionSummary ?? existing.resolutionSummary,
      confirmedByUser: body.confirmedByUser ?? existing.confirmedByUser,
    }).where(eq(tickets.id, id)).execute();

    const result = await getTicketById(id);

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});