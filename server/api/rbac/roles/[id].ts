import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { permissions, rolePermissions, roles, users } from '~/server/database/schema';
import { requireRole } from '~/server/utils/authorize';
import { successResponse } from '~/server/utils/response';
import { listRbac, loadRbac } from '~/server/services/rbac';
import { ADMIN_ROLE } from '~/utils/permissions';

const Body = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(255).optional(),
  claims: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  await requireRole(event, ADMIN_ROLE);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Role ID required' });
  const role = await db.query.roles.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
  if (!role) throw createError({ statusCode: 404, statusMessage: 'Peran tidak ditemukan' });

  if (event.method === 'PUT') {
    // SYSTEM_ADMIN superuser di kode: tidak bisa diubah agar admin tidak mengunci dirinya sendiri.
    if (id === ADMIN_ROLE) throw createError({ statusCode: 400, statusMessage: 'Klaim SYSTEM_ADMIN tidak dapat diubah' });
    const r = Body.safeParse(await readBody(event));
    if (!r.success) throw createError({ statusCode: 400, statusMessage: r.error.issues.map(i => i.message).join('; ') });

    if (r.data.claims) {
      const known = new Set((await db.select({ key: permissions.key }).from(permissions)).map(p => p.key));
      const bad = r.data.claims.filter(c => !known.has(c));
      if (bad.length) throw createError({ statusCode: 400, statusMessage: `Klaim tidak dikenal: ${bad.join(', ')}` });
    }
    await db.transaction(async (tx) => {
      if (r.data.name !== undefined || r.data.description !== undefined) {
        await tx.update(roles).set({
          name: r.data.name ?? role.name,
          description: r.data.description ?? role.description,
        }).where(eq(roles.id, id));
      }
      if (r.data.claims) {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        const uniq = [...new Set(r.data.claims)];
        if (uniq.length) await tx.insert(rolePermissions).values(uniq.map(permissionKey => ({ roleId: id, permissionKey })));
      }
    });
    await loadRbac();
    return successResponse((await listRbac()).roles.find(x => x.id === id));
  }

  if (event.method === 'DELETE') {
    if (role.isSystem) throw createError({ statusCode: 400, statusMessage: 'Peran bawaan tidak dapat dihapus' });
    const used = await db.select({ id: users.id }).from(users).where(eq(users.role, id)).limit(1);
    if (used.length) throw createError({ statusCode: 409, statusMessage: 'Peran masih dipakai pengguna; pindahkan pengguna dulu' });
    await db.delete(roles).where(eq(roles.id, id));
    await loadRbac();
    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
