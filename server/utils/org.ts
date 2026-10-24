// Resolusi nama Perusahaan & Divisi untuk identitas pelapor.
// Dipakai serializer user/ticket supaya format identitas satu sumber di seluruh API.

import { inArray } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { companies, divisions } from '~/server/database/schema';

export interface OrgMaps {
  companyMap: Map<string, string>;
  divisionMap: Map<string, string>;
  divisionCompanyMap: Map<string, string>;
}

export async function loadOrgMaps(
  companyIds: Array<string | null | undefined>,
  divisionIds: Array<string | null | undefined>,
): Promise<OrgMaps> {
  const uniqueCompanyIds = [...new Set(companyIds.filter((id): id is string => !!id))];
  const uniqueDivisionIds = [...new Set(divisionIds.filter((id): id is string => !!id))];

  const [companyRows, divisionRows] = await Promise.all([
    uniqueCompanyIds.length > 0
      ? db.select({ id: companies.id, name: companies.name }).from(companies).where(inArray(companies.id, uniqueCompanyIds))
      : Promise.resolve([]),
    uniqueDivisionIds.length > 0
      ? db.select({ id: divisions.id, name: divisions.name, companyId: divisions.companyId }).from(divisions).where(inArray(divisions.id, uniqueDivisionIds))
      : Promise.resolve([]),
  ]);

  return {
    companyMap: new Map(companyRows.map(r => [r.id, r.name])),
    divisionMap: new Map(divisionRows.map(r => [r.id, r.name])),
    divisionCompanyMap: new Map(divisionRows.map(r => [r.id, r.companyId])),
  };
}

// Ambil perusahaan milik user; kalau user belum punya company_id tapi sudah
// punya divisi, perusahaan diambil dari induk divisi tersebut.
export function resolveCompanyOf(
  user: { companyId?: string | null; divisionId?: string | null },
  maps: OrgMaps,
): string | null {
  if (user.companyId && maps.companyMap.has(user.companyId)) return maps.companyMap.get(user.companyId)!;
  if (user.divisionId) {
    const parentCompanyId = maps.divisionCompanyMap.get(user.divisionId);
    if (parentCompanyId && maps.companyMap.has(parentCompanyId)) return maps.companyMap.get(parentCompanyId)!;
  }
  return null;
}

export function resolveDivisionOf(user: { divisionId?: string | null }, maps: OrgMaps): string | null {
  if (user.divisionId && maps.divisionMap.has(user.divisionId)) return maps.divisionMap.get(user.divisionId)!;
  return null;
}

// Simpan nama divisi ke kolom department (kompatibilitas lama), fallback nilai existing.
export function departmentFromDivision(divisionName: string | null, fallback: string): string {
  return divisionName && divisionName.trim() ? divisionName.trim() : fallback;
}

// Bentuk user untuk konsumen frontend: + companyName & divisionName.
export function shapeUser(
  u: any,
  maps: OrgMaps,
) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    companyId: u.companyId ?? null,
    divisionId: u.divisionId ?? null,
    companyName: resolveCompanyOf(u, maps),
    divisionName: resolveDivisionOf(u, maps),
    avatarUrl: u.avatarUrl ?? null,
  };
}

export async function shapeUsers(list: any[]) {
  if (list.length === 0) return [];
  const maps = await loadOrgMaps(
    list.map(u => u.companyId),
    list.map(u => u.divisionId),
  );
  return list.map(u => shapeUser(u, maps));
}

export async function shapeUserRow(u: any) {
  if (!u) return u;
  return (await shapeUsers([u]))[0];
}
