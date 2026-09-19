export function generateTicketId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 900) + 100);
  return `TCK-${year}${month}-${sequence}`;
}

export function generateTicketNumber(category: string): string {
  const prefix = category === 'Support IT' ? 'TIKSP' : 'TIKPG';
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}
