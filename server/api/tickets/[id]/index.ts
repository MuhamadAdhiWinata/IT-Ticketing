import { eq, and, count } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, attachments, ticketMembers, worklogs, auditLogs, comments, internalNotes } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireRole } from '~/server/utils/authorize';

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
    await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');
    const body = await readBody(event);

    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    }

    const newPriority = body.priority ?? existing.priority;
    if (newPriority === 'CRITICAL' && existing.priority !== 'CRITICAL') {
      const rows = await db
        .select({ cnt: count() })
        .from(attachments)
        .where(eq(attachments.ticketId, id));
      const cnt = rows[0]?.cnt ?? 0;
      if (cnt === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ticket CRITICAL membutuhkan minimal 1 lampiran dokumen pendukung.',
        });
      }
    }

    await db.update(tickets).set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      projectKendala: body.project_kendala ?? existing.projectKendala,
      submodule: body.submodule ?? existing.submodule,
      location: body.location ?? existing.location,
      priority: body.priority ?? existing.priority,
    }).where(eq(tickets.id, id)).execute();

    const result = await getTicketById(id);

    return successResponse(result);
  }

  if (method === 'DELETE') {
    await requireRole(event, 'SYSTEM_ADMIN');
    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    }

    // Anak tiket memakai FK ON DELETE NO ACTION, jadi dihapus lebih dulu.
    await db.transaction(async (tx) => {
      await tx.delete(ticketMembers).where(eq(ticketMembers.ticketId, id)).execute();
      await tx.delete(worklogs).where(eq(worklogs.ticketId, id)).execute();
      await tx.delete(auditLogs).where(eq(auditLogs.ticketId, id)).execute();
      await tx.delete(attachments).where(eq(attachments.ticketId, id)).execute();
      await tx.delete(comments).where(eq(comments.ticketId, id)).execute();
      await tx.delete(internalNotes).where(eq(internalNotes.ticketId, id)).execute();
      await tx.delete(tickets).where(eq(tickets.id, id)).execute();
    });

    return successResponse({ id, deleted: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});