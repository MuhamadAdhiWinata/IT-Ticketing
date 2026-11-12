import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { menus } from '~/server/database/schema';
import { requireRole } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { ACCESS_MENU, ADMIN_ROLE } from '~/utils/permissions';

const Body = z.object({
  label: z.string().trim().min(1).max(100).optional(),
  icon: z.string().trim().min(1).max(50).optional(),
  section: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

// Admin mengubah label, ikon, seksi, urutan, dan aktif/nonaktif menu yang sudah ada.
// Menu "Hak Akses" tidak boleh dinonaktifkan supaya admin tidak mengunci dirinya sendiri.
export default defineEventHandler(async (event) => {
  await requireRole(event, ADMIN_ROLE);
  if (event.method !== 'PUT') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  const id = getRouterParam(event, 'id');
  const menu = id ? await db.query.menus.findFirst({ where: (t, { eq: e }) => e(t.id, id) }) : null;
  if (!menu) throw createError({ statusCode: 404, statusMessage: 'Menu tidak ditemukan' });

  const r = Body.safeParse(await readBody(event));
  if (!r.success) throw createError({ statusCode: 400, statusMessage: r.error.issues.map(i => i.message).join('; ') });
  if (menu.id === ACCESS_MENU && r.data.isActive === false) {
    throw createError({ statusCode: 400, statusMessage: 'Menu Hak Akses tidak dapat dinonaktifkan' });
  }
  await db.update(menus).set({
    label: r.data.label ?? menu.label,
    icon: r.data.icon ?? menu.icon,
    section: r.data.section ?? menu.section,
    sortOrder: r.data.sortOrder ?? menu.sortOrder,
    isActive: r.data.isActive === undefined ? menu.isActive : (r.data.isActive ? 1 : 0),
  }).where(eq(menus.id, id!));
  return successResponse(await db.query.menus.findFirst({ where: (t, { eq: e }) => e(t.id, id!) }));
});
