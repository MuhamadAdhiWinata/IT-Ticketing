import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, auditLogs } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireRole } from '~/server/utils/authorize';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireRole(event, 'IT_WORKER', 'SYSTEM_ADMIN');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  // Reopen: hanya IT yang bisa buka ulang tiket SELESAI kembali ke PROCESS
  if (existing.status !== 'SELESAI') {
    throw createError({ statusCode: 409, statusMessage: 'Hanya tiket dengan status SELESAI yang dapat dibuka ulang' });
  }

  const ts = now();

  await db.transaction(async (tx) => {
    await tx.update(tickets).set({
      status: 'PROCESS',
      completedAt: null,
    }).where(eq(tickets.id, id)).execute();

    const { createNotification } = await import('~/server/utils/notifications');
    await createNotification({
      userId: existing.requestedBy,
      ticketId: id,
      type: 'ASSIGNED',
      title: 'Tiket Dibuka Ulang',
      message: `Tiket ${existing.ticketNumber || id} dibuka ulang oleh ${user.name} (IT)`,
    });

    await tx.insert(auditLogs).values({
      id: `AUD-${Date.now()}`,
      ticketId: id,
      action: 'TIKET_DIBUKA_ULANG',
      performedAt: ts,
      performedBy: user.id,
      detail: 'Tiket dibuka ulang dari SELESAI ke PROCESS oleh IT',
    }).execute();
  });

  const result = await getTicketById(id);
  return successResponse(result);
});