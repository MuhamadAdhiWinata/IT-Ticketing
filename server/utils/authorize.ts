import type { H3Event } from 'h3';
import { getCurrentUser } from './user-context';

export async function requireAuth(event: H3Event) {
  const user = getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  return user;
}

export async function requireRole(event: H3Event, ...roles: string[]) {
  const user = await requireAuth(event);
  if (!roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
  return user;
}
