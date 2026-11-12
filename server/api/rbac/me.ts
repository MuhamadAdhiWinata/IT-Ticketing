import { db } from '~/server/database/client';
import { menus } from '~/server/database/schema';
import { requireAuth } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { claimsOf, getRbacMatrix, menuAllowed } from '~/utils/permissions';

// Untuk semua pengguna login: klaim, menu sidebar yang boleh dibuka, dan matriks peran (UI memakainya untuk
// memfilter daftar worker). Penegakan sebenarnya tetap di server.
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const rows = await db.select().from(menus);
  return successResponse({
    role: user.role,
    claims: claimsOf(user.role),
    matrix: getRbacMatrix(),
    menus: rows
      .filter(m => m.isActive && menuAllowed(user.role, m.id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({ id: m.id, label: m.label, icon: m.icon, section: m.section })),
  });
});
