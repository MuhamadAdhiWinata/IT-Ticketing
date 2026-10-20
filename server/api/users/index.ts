import { eq, like, or } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { users } from '~/server/database/schema';
import { successResponse, errorResponse } from '~/server/utils/response';
import { departmentFromDivision, shapeUserRow, shapeUsers } from '~/server/utils/org';

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    const conditions: any[] = [];

    if (query.role) {
      conditions.push(eq(users.role, query.role as string));
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(or(
        like(users.name, term),
        like(users.email, term),
        like(users.department, term),
      )!);
    }

    const limit = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const offset = query.offset ? Math.max(Number(query.offset), 0) : 0;

    if (conditions.length > 0) {
      const results = await db.query.users.findMany({
        where: (u, { and }) => and(...conditions),
        limit,
        offset,
      });
      return successResponse(await shapeUsers(results));
    }

    const results = await db.query.users.findMany({ limit, offset });
    return successResponse(await shapeUsers(results));
  }

  if (method === 'POST') {
    const body = await readBody(event);

    if (!body.id || !body.name || !body.email || !body.role) {
      throw createError({ statusCode: 400, statusMessage: 'Required fields: id, name, email, role' });
    }

    const companyId: string | null = typeof body.companyId === 'string' && body.companyId.trim() ? body.companyId.trim() : null;
    const divisionId: string | null = typeof body.divisionId === 'string' && body.divisionId.trim() ? body.divisionId.trim() : null;

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
    // Divisi harus berasal dari perusahaan yang dipilih.
    if (companyId && division && division.companyId !== companyId) {
      throw createError({ statusCode: 400, statusMessage: 'Divisi tidak termasuk dalam perusahaan yang dipilih' });
    }
    // Pilih divisi tanpa perusahaan: induk divisi dijadikan perusahaan user.
    const finalCompanyId = companyId ?? (division ? division.companyId : null);

    const department = departmentFromDivision(division?.name ?? null, typeof body.department === 'string' ? body.department.trim() : '');

    if (!department) {
      throw createError({ statusCode: 400, statusMessage: 'Department wajib diisi (pilih Divisi atau isi Departemen manual)' });
    }

    const existing = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.email, body.email),
    });
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' });
    }

    await db.insert(users).values({
      id: body.id,
      name: body.name,
      email: body.email,
      role: body.role,
      department,
      companyId: finalCompanyId,
      divisionId,
      avatarUrl: body.avatarUrl || null,
    }).execute();

    const result = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.id, body.id),
    });

    return successResponse(await shapeUserRow(result));
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
