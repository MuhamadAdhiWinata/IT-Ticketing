// Satu sumber format identitas pelapor untuk seluruh UI.
// Contoh hasil: "Rina Wulandari • PT IONS - Divisi Finance"

// Dua bentuk masuk ke sini: tiket memakai company/division, AppUser memakai
// companyName/divisionName. Keduanya didukung supaya tidak ada label yang diam-diam
// jatuh ke fallback "Dept:".
export interface RequesterIdentity {
  name?: string | null;
  company?: string | null;
  division?: string | null;
  companyName?: string | null;
  divisionName?: string | null;
  department?: string | null;
}

// Bagian identitas setelah nama: "PT IONS - Divisi Finance", atau fallback "Dept: Finance".
export function formatOrgLabel(identity: RequesterIdentity): string | null {
  const company = (identity.company ?? identity.companyName)?.trim() || null;
  const division = (identity.division ?? identity.divisionName)?.trim() || null;
  const department = identity.department?.trim() || null;

  if (company && division) return `${company} - Divisi ${division}`;
  if (company) return company;
  if (division) return `Divisi ${division}`;
  if (department) return `Dept: ${department}`;
  return null;
}

// Label lengkap: "Rina Wulandari • PT IONS - Divisi Finance"
export function formatRequesterIdentity(identity: RequesterIdentity, fallbackName = 'User'): string {
  const name = identity.name?.trim() || fallbackName;
  const org = formatOrgLabel(identity);
  return org ? `${name} • ${org}` : name;
}
