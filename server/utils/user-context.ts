import type { H3Event } from 'h3';

/**
 * Get current user ID from JWT context or X-User-Id header (migration fallback).
 * Once frontend fully uses JWT, the X-User-Id fallback can be removed.
 */
export function getCurrentUserId(event: H3Event): string {
  // Prefer JWT-authenticated user
  const ctxUser = (event as any).context?.user;
  if (ctxUser?.id) return ctxUser.id;

  // Fallback to X-User-Id header (temporary, for migration)
  const headerUser = getHeader(event, 'X-User-Id');
  if (headerUser) return headerUser;

  return '';
}

/**
 * Get current user object from JWT context.
 * Returns null if not authenticated via JWT.
 */
export function getCurrentUser(event: H3Event) {
  return (event as any).context?.user || null;
}
