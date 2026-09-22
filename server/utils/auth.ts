import jwt from 'jsonwebtoken';
import { db } from '~/server/database/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  sub: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Verify JWT from cookie/header and look up user in DB.
 * Used by middleware to populate event.context.user
 */
export async function getUserFromToken(event: any): Promise<any> {
  const token = getCookie(event, 'auth_token') || getHeader(event, 'Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    const user = await db.query.users.findFirst({
      where: (u: any, { eq: e }: any) => e(u.id, payload.sub),
    });
    return user || null;
  } catch {
    return null;
  }
}
