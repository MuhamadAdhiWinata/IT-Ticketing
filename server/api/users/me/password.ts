import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);

  if (!body.oldPassword || !body.newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Password lama dan baru wajib diisi' });
  }

  const dbUser = await db.query.users.findFirst({
    where: (u, { eq: e }) => e(u.id, user.id),
  });

  if (!dbUser || !dbUser.passwordHash) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' });
  }

  const isValid = await bcrypt.compare(body.oldPassword, dbUser.passwordHash);
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Password lama salah' });
  }

  if (body.newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password baru minimal 6 karakter' });
  }

  const newHash = await bcrypt.hash(body.newPassword, 10);

  await db.update(users).set({
    passwordHash: newHash,
  }).where(eq(users.id, user.id)).execute();

  return successResponse({ updated: true });
});