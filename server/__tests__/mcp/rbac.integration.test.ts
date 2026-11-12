import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { rolePermissions, roles } from '~/server/database/schema';
import { listRbac, loadRbac, seedRbac } from '~/server/services/rbac';
import { acknowledgeTicket, startTriage } from '~/server/services/ticketing/triage';
import { CLAIM, menuAllowed, roleHas } from '~/utils/permissions';
import { isITRole } from '~/utils/roles';
import { IT_A, PM, closeAll, seedTicket, seedUsers } from './helpers';

beforeAll(async () => { await seedUsers(); await seedRbac(); await loadRbac(); });
afterAll(async () => {
  await db.delete(roles).where(eq(roles.id, 'T_ROLE'));
  await seedRbac();
  await loadRbac();
  await closeAll();
});

describe('RBAC dinamis', () => {
  it('seed bawaan idempoten dan SYSTEM_ADMIN selalu lolos', async () => {
    await seedRbac();
    const d = await listRbac();
    expect(d.roles.map(r => r.id)).toEqual(expect.arrayContaining(['USER_NON_IT', 'IT_WORKER', 'PM', 'DUTY_ENGINEER', 'SYSTEM_ADMIN']));
    expect(roleHas('SYSTEM_ADMIN', 'klaim.apa.saja')).toBe(true);
    expect(menuAllowed('PM', 'access')).toBe(false);
    expect(menuAllowed('SYSTEM_ADMIN', 'access')).toBe(true);
  });

  it('mengubah klaim di DB langsung mengubah hak akses server', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    await acknowledgeTicket(IT_A, { ticketId: id });
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, 'PM'));
    await loadRbac();
    await expect(startTriage(PM, { ticketId: id })).rejects.toMatchObject({ statusCode: 403 });
    await db.insert(rolePermissions).values({ roleId: 'PM', permissionKey: CLAIM.TRIAGE });
    await loadRbac();
    await startTriage(PM, { ticketId: id });
  });

  it('peran baru dengan klaim it.access dianggap tim IT', async () => {
    await db.insert(roles).values({ id: 'T_ROLE', name: 'Tes', isSystem: 0 }).onDuplicateKeyUpdate({ set: { name: 'Tes' } });
    await loadRbac();
    expect(isITRole('T_ROLE')).toBe(false);
    await db.insert(rolePermissions).values({ roleId: 'T_ROLE', permissionKey: CLAIM.IT });
    await loadRbac();
    expect(isITRole('T_ROLE')).toBe(true);
  });
});
