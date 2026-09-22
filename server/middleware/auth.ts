import { getUserFromToken } from '~/server/utils/auth';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/uploads',
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

  // For now, don't block unauthenticated requests
  // This allows gradual migration from X-User-Id to JWT
  // Once frontend fully uses JWT, uncomment below:
  // if (!user) {
  //   throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  // }
});
