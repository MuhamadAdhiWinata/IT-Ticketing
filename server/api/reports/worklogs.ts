import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  let ticketsData = await db.query.tickets.findMany();

  if (query.workerId) {
    ticketsData = ticketsData.filter(t => t.worklogs?.some(wl => wl.worker_id === query.workerId));
  }

  if (query.startDate) {
    ticketsData = ticketsData.filter(t => t.worklogs?.some(wl => wl.date >= query.startDate));
  }
  if (query.endDate) {
    ticketsData = ticketsData.filter(t => t.worklogs?.some(wl => wl.date <= query.endDate));
  }

  const worklogs: any[] = [];
  ticketsData.forEach(ticket => {
    ticket.worklogs?.forEach(wl => {
      worklogs.push({
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        ...wl,
      });
    });
  });

  return successResponse(worklogs);
});
