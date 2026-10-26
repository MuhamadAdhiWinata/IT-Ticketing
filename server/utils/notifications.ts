import { db } from '~/server/database/client';
import { notifications } from '~/server/database/schema';

export async function createNotification(params: {
  userId: string;
  ticketId?: string;
  type: 'NEW_TICKET' | 'ASSIGNED' | 'COMMENT' | 'SLA_WARNING';
  title: string;
  message: string;
}, exec: typeof db = db) {
  const id = `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await exec.insert(notifications).values({
    id,
    userId: params.userId,
    ticketId: params.ticketId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    isRead: 0,
    createdAt: new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19),
  }).execute();
}
