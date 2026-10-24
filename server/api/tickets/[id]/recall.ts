import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, auditLogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  // Recall: hanya requester yang bisa tarik tiket sendiri
  // Hanya dari status PROCESS (sudah di-submit/issued) kembali ke DRAFT
  if (existing.requestedBy !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Hanya pemohon tiket yang dapat menarik tiket' });
  }

  if (existing.status !== 'PROCESS') {
    throw createError({ statusCode: 409, statusMessage: 'Hanya tiket dengan status PROCESS (sudah dikirim) yang dapat ditarik kembali ke DRAFT' });
  }

  const ts = now();

  await db.transaction(async (tx) => {
    await tx.update(tickets).set({
      status: 'DRAFT',
      issuedAt: null,
      processStartedAt: null,
    }).where(eq(tickets.id, id)).execute();

    const { createNotification } = await import('~/server/utils/notifications');
    await createNotification({
      userId: user.id,
      ticketId: id,
      type: 'NEW_TICKET',
      title: 'Tiket Ditarik Kembali',
      message: `Tiket ${existing.ticketNumber || id} ditarik kembali ke DRAFT oleh ${user.name}`,
    });

    await tx.insert(auditLogs).values({
      id: `AUD-${Date.now()}`,
      ticketId: id,
      action: 'TIKET_DITARIK',
      performedAt: ts,
      performedBy: user.id,
      detail: 'Tiket ditarik kembali ke DRAFT oleh pemohon',
    }).execute();
  });

  const result = await getTicketById(id);
  return successResponse(result);
});