import type { TicketPriority } from '~/types';

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

export function getTicketPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'bg-muted text-muted-foreground border border-border';
    case 'MEDIUM':
      return 'bg-primary/10 text-primary border border-primary/15';
    case 'HIGH':
      return 'bg-warning/10 text-warning border border-warning/20';
    case 'CRITICAL':
    case 'URGENT':
      return 'bg-destructive/10 text-destructive border border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
