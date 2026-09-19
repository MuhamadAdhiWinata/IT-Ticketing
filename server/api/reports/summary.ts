import { eq, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  let results = await db.query.tickets.findMany();

  if (query.status) {
    results = results.filter(t => t.status === query.status);
  }
  if (query.workerId) {
    results = results.filter(t => {
      if (t.assignedTo === query.workerId) return true;
      if (t.primaryWorkerId === query.workerId) return true;
      if (t.supportingMembers?.includes(query.workerId)) return true;
      return t.worklogs?.some(wl => wl.worker_id === query.workerId);
    });
  }
  if (query.startDate) {
    results = results.filter(t => {
      const wlDate = t.worklogs?.some(wl => wl.date >= query.startDate);
      const createdDate = (t.createdAt || '').startsWith(query.startDate);
      return wlDate || createdDate;
    });
  }
  if (query.endDate) {
    results = results.filter(t => {
      const wlDate = t.worklogs?.some(wl => wl.date <= query.endDate);
      const createdDate = (t.createdAt || '').startsWith(query.endDate);
      return wlDate || createdDate;
    });
  }

  let totalTickets = results.length;
  let completedCount = results.filter(t => t.status === 'SELESAI').length;
  let inProgressCount = results.filter(t => t.status === 'PROCESS' || t.status === 'DELEGASI').length;
  let totalWorklogHours = 0;
  results.forEach(t => {
    t.worklogs?.forEach(wl => {
      totalWorklogHours += (wl.duration_minutes || 0) / 60;
    });
  });

  return successResponse({
    totalTickets,
    completedCount,
    inProgressCount,
    totalWorklogHours: totalWorklogHours.toFixed(2),
  });
});
