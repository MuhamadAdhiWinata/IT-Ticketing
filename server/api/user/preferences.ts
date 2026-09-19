import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users, userPreferences } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const userId = getHeader(event, 'X-User-Id') || '';

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'User ID required' });
  }

  if (method === 'GET') {
    const prefs = await db.query.userPreferences.findFirst({
      where: (p, { eq: e }) => e(p.userId, userId),
    });

    return successResponse({ darkMode: prefs?.darkMode ? true : false });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    await db.insert(userPreferences).values({
      userId,
      darkMode: body.darkMode ? 1 : 0,
    }).onDuplicateKeyUpdate({
      set: { darkMode: body.darkMode ? 1 : 0 },
    }).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
