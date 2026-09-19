import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const workerId = query.workerId || null;
  const startDate = query.startDate || null;
  const endDate = query.endDate || null;

  let ticketsData = await db.query.tickets.findMany();

  if (workerId) {
    ticketsData = ticketsData.filter(t => {
      if (t.assignedTo === workerId || t.primaryWorkerId === workerId) return true;
      return t.worklogs?.some(wl => wl.worker_id === workerId && wl.date >= (startDate || '') && wl.date <= (endDate || ''));
    });
  }

  let dailyTicketsCount = 0;
  let completedInRangeCount = 0;
  let onProgressCount = 0;
  let totalHoursInRange = 0;

  ticketsData.forEach(t => {
    const worklogsInRange = t.worklogs?.filter(wl => {
      const dateOk = (!startDate || wl.date >= startDate) && (!endDate || wl.date <= endDate);
      return dateOk;
    }) || [];

    if (worklogsInRange.length > 0) {
      dailyTicketsCount++;
      worklogsInRange.forEach(wl => {
        totalHoursInRange += (wl.duration_minutes || 0) / 60;
      });
    }

    if (t.status === 'SELESAI') completedInRangeCount++;
    if (t.status === 'PROCESS' || t.status === 'DELEGASI') onProgressCount++;
  });

  return successResponse({
    dailyTicketsCount,
    completedInRangeCount,
    onProgressCount,
    totalHoursInRange: totalHoursInRange.toFixed(1),
  });
});
