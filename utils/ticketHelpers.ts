import type { TicketPriority } from '~/types';

/**
 * Returns user-friendly label for ticket priority
 */
export function getTicketPriorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Low';
    case 'MEDIUM':
      return 'Medium';
    case 'HIGH':
      return 'High';
    case 'CRITICAL':
    case 'URGENT':
      return 'Critical';
    default:
      return priority;
  }
}

/**
 * Returns Tailwind CSS class for priority badge
 */
export function getTicketPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
    case 'MEDIUM':
      return 'bg-blue-50 dark:bg-blue-950/60 text-[#026bb1] dark:text-[#52b5f2] border border-blue-200 dark:border-blue-900';
    case 'HIGH':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case 'CRITICAL':
    case 'URGENT':
      return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300';
  }
}
