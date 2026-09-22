import bcrypt from 'bcryptjs';
import { db } from '~/server/database/client';
import { signToken } from '~/server/utils/auth';
import { successResponse } from '~/server/utils/response';
import { LoginSchema, validate } from '~/server/utils/validate';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const v = validate(LoginSchema, body);
  if (!v.success) {
    throw createError({ statusCode: 400, statusMessage: v.error });
  }

  const { email, password } = v.data;

  const user = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.email, email),
  });
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }

  // For development: if password_hash is null, accept any password
  if (user.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
    }
  }

  const token = signToken({ sub: user.id, role: user.role });

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    avatarUrl: user.avatarUrl,
  });
});
