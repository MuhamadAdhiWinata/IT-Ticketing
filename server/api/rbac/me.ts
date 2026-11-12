import { db } from '~/server/database/client';
import { menus } from '~/server/database/schema';
import { requireAuth } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { getDutyState } from '~/server/services/duty';
import { claimsOf, getRbacMatrix, menuAllowed } from '~/utils/permissions';

// Untuk semua pengguna login: klaim, menu sidebar yang boleh dibuka, dan matriks peran (UI memakainya untuk
// memfilter daftar worker). Penegakan sebenarnya tetap di server.
// Klaim sudah termasuk klaim DUTY_ENGINEER bila pengguna sedang ON DUTY; UI memanggil ulang tepat di batas shift.
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const rows = await db.select().from(menus);
  const duty = await getDutyState(user.id);
  const claims = claimsOf(user.role, duty.active);
  return successResponse({
    role: user.role,
    claims,
    active_permissions: claims,
    is_duty_active: duty.active,
    current_duty_end_at: duty.endAt,
    next_duty_start_at: duty.nextStartAt,
    matrix: getRbacMatrix(),
    menus: rows
      .filter(m => m.isActive && menuAllowed(user.role, m.id, duty.active))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({ id: m.id, label: m.label, icon: m.icon, section: m.section })),
  });
});
