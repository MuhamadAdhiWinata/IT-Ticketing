import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const startDate = query.startDate || '';
  const endDate = query.endDate || '';
  const workerId = query.workerId || '';

  const allTickets = await db.query.tickets.findMany();

  const worklogs: any[] = [];

  allTickets.forEach(ticket => {
    ticket.worklogs?.forEach(wl => {
      const dateOk = (!startDate || wl.date >= startDate) && (!endDate || wl.date <= endDate);
      const workerOk = !workerId || wl.worker_id === workerId;
      if (dateOk && workerOk) {
        worklogs.push({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          ticketStatus: ticket.status,
          ...wl,
        });
      }
    });
  });

  worklogs.sort((a, b) => a.date.localeCompare(b.date) || a.start_at.localeCompare(b.start_at));

  return successResponse(worklogs);
});
