import { defineEventHandler, readBody, getMethod } from 'h3';
import { db } from '~/server/database/client';
import { companySettings, users } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '~/server/utils/user-context';
import { errorResponse } from '~/server/utils/response';

const DEFAULTS = {
  id: 'default',
  companyName: 'Percetakan Integral Offset',
  logoUrl: null as string | null,
  primaryColor: '#026bb1',
  primaryHoverColor: '#025790',
  primaryActiveColor: '#014674',
  primaryMutedColor: '#e6f1f8',
  primaryForegroundColor: '#ffffff',
  secondaryColor: '#475569',
  secondaryHoverColor: '#334155',
  secondaryForegroundColor: '#ffffff',
  accentColor: '#0ea5e9',
  accentForegroundColor: '#ffffff',
};

async function getSettings() {
  const row = await db.query.companySettings.findFirst({
    where: (s, { eq }) => eq(s.id, 'default'),
  });
  return row || DEFAULTS;
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) === 'GET') {
    const data = await getSettings();
    return { success: true, data };
  }

  if (event.method === 'PATCH') {
    const userId = getCurrentUserId(event);
    if (!userId) throw errorResponse('Unauthorized', 401);

    const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
    if (!user || user.role !== 'SYSTEM_ADMIN') {
      throw errorResponse('Forbidden: admin only', 403);
    }

    const body = await readBody(event);
    const allowed = [
      'companyName', 'logoUrl',
      'primaryColor', 'primaryHoverColor', 'primaryActiveColor', 'primaryMutedColor', 'primaryForegroundColor',
      'secondaryColor', 'secondaryHoverColor', 'secondaryForegroundColor',
      'accentColor', 'accentForegroundColor',
    ];

    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      throw errorResponse('No valid fields to update', 400);
    }

    updates.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.update(companySettings).set(updates).where(eq(companySettings.id, 'default'));
    const data = await getSettings();
    return { success: true, data };
  }

  throw errorResponse('Method not allowed', 405);
});
