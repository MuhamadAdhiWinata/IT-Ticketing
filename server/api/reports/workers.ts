import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const ticketsData = await db.query.tickets.findMany();
  const usersData = await db.query.users.findMany();

  const workerMap: Record<string, { name: string; department: string }> = {};
  usersData.forEach(u => {
    if (u.role === 'IT_WORKER') {
      workerMap[u.id] = { name: u.name, department: u.department };
    }
  });

  const workerStats: Record<string, { totalContributed: number; completedCount: number; inProgressCount: number; totalHours: number; durations: number[] }> = {};

  ticketsData.forEach(ticket => {
    const workers = new Set<string>();

    if (ticket.assignedTo) workers.add(ticket.assignedTo);
    if (ticket.primaryWorkerId) workers.add(ticket.primaryWorkerId);
    ticket.supportingMembers?.forEach(m => {
      const match = Object.keys(workerMap).find(k => k === m || workerMap[k]?.name === m);
      if (match) workers.add(match);
    });
    ticket.worklogs?.forEach(wl => workers.add(wl.worker_id));

    workers.forEach(workerId => {
      if (!workerStats[workerId]) {
        workerStats[workerId] = { totalContributed: 0, completedCount: 0, inProgressCount: 0, totalHours: 0, durations: [] };
      }
      workerStats[workerId].totalContributed++;
      if (ticket.status === 'SELESAI') workerStats[workerId].completedCount++;
      if (ticket.status === 'PROCESS' || ticket.status === 'DELEGASI') workerStats[workerId].inProgressCount++;

      ticket.worklogs?.forEach(wl => {
        if (wl.worker_id === workerId) {
          workerStats[workerId].totalHours += (wl.duration_minutes || 0) / 60;
          workerStats[workerId].durations.push(wl.duration_minutes || 0);
        }
      });
    });
  });

  const results = Object.entries(workerStats).map(([workerId, stats]) => {
    const worker = workerMap[workerId] || { name: workerId, department: '' };
    const avgDuration = stats.durations.length > 0
      ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length)
      : 0;

    return {
      user: { id: workerId, name: worker.name, department: worker.department },
      totalContributed: stats.totalContributed,
      completedCount: stats.completedCount,
      inProgressCount: stats.inProgressCount,
      totalHours: stats.totalHours.toFixed(1),
      avgDuration,
    };
  });

  return successResponse(results);
});
