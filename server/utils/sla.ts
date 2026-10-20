import type { TicketPriority } from '~/types';

export function calculateSLADeadline(createdAt: string, priority: TicketPriority, categorySLA: {
  slaCritical: number | null;
  slaHigh: number | null;
  slaMedium: number | null;
  slaLow: number | null;
}): string {
  const date = new Date(createdAt);
  let hours = 24;

  if (priority === 'CRITICAL') hours = categorySLA.slaCritical || 1;
  else if (priority === 'HIGH') hours = categorySLA.slaHigh || 4;
  else if (priority === 'MEDIUM') hours = categorySLA.slaMedium || 8;
  else if (priority === 'LOW') hours = categorySLA.slaLow || 24;

  date.setHours(date.getHours() + hours);
  
  return date.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export function isSLABreached(deadline: string): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}
