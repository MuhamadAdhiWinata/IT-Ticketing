import { getUserFromToken } from '~/server/utils/auth';
import { createError } from 'h3';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
];

// GET publik tanpa sesi: branding halaman login (nama, logo, warna perusahaan).
// PATCH di endpoint ini tetap diamankan langsung oleh handler-nya (wajib admin).
const PUBLIC_GET_PATHS = [
  '/api/settings/company',
];

export default defineEventHandler(async (event) => {
  const path = event.path || '';

  // Skip auth for public paths and non-API routes
  if (!path.startsWith('/api/') || PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return;
  }

  // Verify JWT and load user from DB
  const user = await getUserFromToken(event);

  // Attach user to event context (null if not authenticated)
  (event as any).context.user = user;

  // Block unauthenticated requests for all other API routes
  if (!user) {
    const allowPublicGet = event.method === 'GET' && PUBLIC_GET_PATHS.some(p => path.startsWith(p));
    if (!allowPublicGet) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
  }
});