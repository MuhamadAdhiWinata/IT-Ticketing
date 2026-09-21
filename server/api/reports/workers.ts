import { eq, and, or, like, between, sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, worklogs, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketsWithRelations } from '~/server/utils/tickets';

export default defineEventHandler(async (event) => {
  const usersRes = await db.query.users.findMany({
    where: (u, { eq: e }) => e(u.role, 'IT_WORKER'),
  });

  const ticketsRes = await getTicketsWithRelations();

  const workerMap: Record<string, any> = {};
  usersRes.forEach(u => {
    workerMap[u.id] = { user: u, totalContributed: 0, completedCount: 0, inProgressCount: 0, totalHours: 0, durations: [] };
  });

  ticketsRes.forEach(ticket => {
    const workersOnTicket = new Set<string>();
    if (ticket.assignedTo && workerMap[ticket.assignedTo]) workersOnTicket.add(ticket.assignedTo);

    ticket.worklogs?.forEach(wl => {
      if (workerMap[wl.workerId]) {
        workersOnTicket.add(wl.workerId);
        workerMap[wl.workerId].totalHours += (wl.durationMinutes || 0) / 60;
        workerMap[wl.workerId].durations.push(wl.durationMinutes || 0);
      }
    });

    workersOnTicket.forEach(workerId => {
      workerMap[workerId].totalContributed++;
      if (ticket.status === 'SELESAI') workerMap[workerId].completedCount++;
      if (ticket.status === 'PROCESS' || ticket.status === 'DELEGASI') workerMap[workerId].inProgressCount++;
    });
  });

  const results = Object.entries(workerMap).map(([workerId, stats]) => {
    const avgDuration = stats.durations.length > 0
      ? Math.round(stats.durations.reduce((a: number, b: number) => a + b, 0) / stats.durations.length)
      : 0;

    return {
      user: stats.user,
      totalContributed: stats.totalContributed,
      completedCount: stats.completedCount,
      inProgressCount: stats.inProgressCount,
      totalHours: stats.totalHours.toFixed(1),
      avgDuration,
    };
  });

  return successResponse(results);
});
