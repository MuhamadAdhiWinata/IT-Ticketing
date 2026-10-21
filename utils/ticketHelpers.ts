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

// Kata benda yang tepat untuk record di bawah sebuah kategori:
// kategori layanan harian ("Support IT") isinya keluhan/kendala, sementara
// kategori pengembangan ("IT Programmer") isinya project. Nama yang tidak
// dikenali (kategori buatan admin, atau nama sudah diedit) jatuh ke label
// gabungan supaya tulisan tetap utuh.
export function getProjectKendalaLabel(categoryName: string): string {
  switch (categoryName) {
    case 'Support IT':
      return 'Kendala';
    case 'IT Programmer':
      return 'Project';
    default:
      return 'Project/Kendala';
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
