import { z } from 'zod';
import { db } from '~/server/database/client';
import { roles } from '~/server/database/schema';
import { requireRole } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { loadRbac, listRbac } from '~/server/services/rbac';
import { ADMIN_ROLE } from '~/utils/permissions';

const Body = z.object({
  id: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,49}$/, 'ID peran: huruf besar, angka, underscore (2-50 karakter)'),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(255).optional(),
});

export default defineEventHandler(async (event) => {
  await requireRole(event, ADMIN_ROLE);
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });

  const r = Body.safeParse(await readBody(event));
  if (!r.success) throw createError({ statusCode: 400, statusMessage: r.error.issues.map(i => i.message).join('; ') });
  if (await db.query.roles.findFirst({ where: (t, { eq }) => eq(t.id, r.data.id) })) {
    throw createError({ statusCode: 409, statusMessage: 'ID peran sudah dipakai' });
  }
  await db.insert(roles).values({ id: r.data.id, name: r.data.name, description: r.data.description ?? null, isSystem: 0 });
  await loadRbac();
  return successResponse((await listRbac()).roles.find(x => x.id === r.data.id));
});
