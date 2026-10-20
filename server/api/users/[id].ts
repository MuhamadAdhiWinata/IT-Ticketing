import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';
import { departmentFromDivision, shapeUserRow } from '~/server/utils/org';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' });
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }

    const companyId: string | null = body.companyId !== undefined
      ? (typeof body.companyId === 'string' && body.companyId.trim() ? body.companyId.trim() : null)
      : existing.companyId;
    const divisionId: string | null = body.divisionId !== undefined
      ? (typeof body.divisionId === 'string' && body.divisionId.trim() ? body.divisionId.trim() : null)
      : existing.divisionId;

    if (companyId) {
      const company = await db.query.companies.findFirst({ where: (c, { eq: e }) => e(c.id, companyId) });
      if (!company) throw createError({ statusCode: 404, statusMessage: 'Perusahaan tidak ditemukan' });
    }

    const division = divisionId
      ? await db.query.divisions.findFirst({ where: (d, { eq: e }) => e(d.id, divisionId) })
      : null;
    if (divisionId && !division) {
      throw createError({ statusCode: 404, statusMessage: 'Divisi tidak ditemukan' });
    }
    if (companyId && division && division.companyId !== companyId) {
      throw createError({ statusCode: 400, statusMessage: 'Divisi tidak termasuk dalam perusahaan yang dipilih' });
    }

    const finalCompanyId = companyId ?? (division ? division.companyId : null);
    const department = departmentFromDivision(
      division?.name ?? null,
      typeof body.department === 'string' && body.department.trim() ? body.department.trim() : existing.department,
    );

    if (!department) {
      throw createError({ statusCode: 400, statusMessage: 'Department wajib diisi (pilih Divisi atau isi Departemen manual)' });
    }

    await db.update(users).set({
      name: body.name ?? existing.name,
      email: body.email ?? existing.email,
      role: body.role ?? existing.role,
      department,
      companyId: finalCompanyId,
      divisionId,
      avatarUrl: body.avatarUrl ?? existing.avatarUrl,
    }).where(eq(users.id, id)).execute();

    const result = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });

    return successResponse(await shapeUserRow(result));
  }

  if (method === 'DELETE') {
    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, id),
    });
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' });
    }

    await db.delete(users).where(eq(users.id, id)).execute();

    return successResponse({ success: true });
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
