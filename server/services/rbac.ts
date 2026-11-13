import { sql } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { menus, permissions, rolePermissions, roles } from '~/server/database/schema';
import { ADMIN_ROLE, DEFAULT_ROLES, MENUS, PERMISSIONS, setRbacMatrix, type RbacMatrix } from '~/utils/permissions';

// Idempoten. Katalog klaim disinkronkan dari kode; menu dan peran hanya ditambah bila belum ada,
// jadi perubahan yang dibuat SYSTEM_ADMIN lewat UI tidak pernah ditimpa.
export async function seedRbac() {
  const knownKeys = new Set((await db.select({ key: permissions.key }).from(permissions)).map(p => p.key));
  await db.insert(permissions)
    .values(PERMISSIONS.map((p, i) => ({ key: p.key, label: p.label, groupName: p.group, sortOrder: i })))
    .onDuplicateKeyUpdate({ set: { label: sql`VALUES(label)`, groupName: sql`VALUES(group_name)`, sortOrder: sql`VALUES(sort_order)` } });

  await db.insert(menus)
    .values(MENUS.map(m => ({ id: m.id, label: m.label, icon: m.icon, section: m.section, sortOrder: m.sortOrder })))
    .onDuplicateKeyUpdate({ set: { id: sql`id` } });

  const have = new Set((await db.select({ id: roles.id }).from(roles)).map(r => r.id));
  // Klaim yang baru masuk katalog diberikan sekali ke peran bawaan yang sudah ada; klaim lama tidak disentuh (perubahan admin aman).
  const fresh = PERMISSIONS.map(p => p.key).filter(k => !knownKeys.has(k) && knownKeys.size > 0);
  const grants = DEFAULT_ROLES.filter(r => have.has(r.id) && r.id !== ADMIN_ROLE)
    .flatMap(r => r.claims.filter(c => fresh.includes(c)).map(permissionKey => ({ roleId: r.id, permissionKey })));
  if (grants.length) await db.insert(rolePermissions).values(grants).onDuplicateKeyUpdate({ set: { roleId: sql`role_id` } });
  for (const r of DEFAULT_ROLES.filter(d => !have.has(d.id))) {
    await db.insert(roles).values({ id: r.id, name: r.name, description: r.description, isSystem: 1 });
    // SYSTEM_ADMIN tidak butuh baris klaim: dijamin di kode.
    const claims = r.id === ADMIN_ROLE ? [] : r.claims;
    if (claims.length) await db.insert(rolePermissions).values(claims.map(permissionKey => ({ roleId: r.id, permissionKey })));
  }
}

export async function loadRbac(): Promise<RbacMatrix> {
  const [roleRows, grants] = await Promise.all([
    db.select({ id: roles.id }).from(roles),
    db.select().from(rolePermissions),
  ]);
  const matrix: RbacMatrix = {};
  for (const r of roleRows) matrix[r.id] = [];
  for (const g of grants) (matrix[g.roleId] ??= []).push(g.permissionKey);
  setRbacMatrix(matrix);
  loadedAt = Date.now();
  return matrix;
}

// Matriks di memori disegarkan tiap 5 detik; penulisan lewat API admin memuat ulang seketika.
let loadedAt = 0;
let inflight: Promise<unknown> | null = null;
export async function ensureRbac() {
  if (Date.now() - loadedAt < 5000) return;
  inflight ??= loadRbac().catch((e) => { console.error('[rbac] gagal memuat dari DB, memakai matriks terakhir:', e?.message); loadedAt = Date.now(); }).finally(() => { inflight = null; });
  await inflight;
}

export async function listRbac() {
  const [roleRows, perms, grants, menuRows] = await Promise.all([
    db.select().from(roles),
    db.select().from(permissions),
    db.select().from(rolePermissions),
    db.select().from(menus),
  ]);
  return {
    roles: roleRows.map(r => ({
      id: r.id, name: r.name, description: r.description ?? '', isSystem: !!r.isSystem,
      claims: grants.filter(g => g.roleId === r.id).map(g => g.permissionKey),
    })),
    permissions: perms.sort((a, b) => a.sortOrder - b.sortOrder).map(p => ({ key: p.key, label: p.label, group: p.groupName })),
    menus: menuRows.sort((a, b) => a.sortOrder - b.sortOrder).map(m => ({ ...m, isActive: !!m.isActive })),
  };
}
