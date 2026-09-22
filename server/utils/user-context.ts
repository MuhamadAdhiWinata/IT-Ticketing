import type { H3Event } from 'h3';

/**
 * Get current user ID from JWT context or X-User-Id header (migration fallback).
 * User must be populated by middleware (auth.ts) before calling this.
 */
export function getCurrentUserId(event: H3Event): string {
  const ctxUser = (event as any).context?.user;
  if (ctxUser?.id) return ctxUser.id;

  // Fallback to X-User-Id header (temporary, for migration)
  const headerUser = getHeader(event, 'X-User-Id');
  if (headerUser) return headerUser;

  return '';
}

/**
 * Get current user object from event context.
 * Must be populated by auth middleware before calling this.
 */
export function getCurrentUser(event: H3Event) {
  return (event as any).context?.user || null;
}
