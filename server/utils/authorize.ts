import type { H3Event } from 'h3';
import { getCurrentUser } from './user-context';
import { roleHas } from '~/utils/permissions';

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

// Pemeriksaan berbasis klaim (diatur SYSTEM_ADMIN). SYSTEM_ADMIN selalu lolos.
export async function requireClaim(event: H3Event, claim: string) {
  const user = await requireAuth(event);
  if (!roleHas(user.role, claim, user.dutyActive)) {
    throw createError({ statusCode: 403, statusMessage: `Forbidden: butuh klaim ${claim}` });
  }
  return user;
}
