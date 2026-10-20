import { describe, it, expect } from 'vitest';
import { formatOrgLabel, formatRequesterIdentity } from '../../utils/identity';

describe('formatOrgLabel', () => {
  it('gabungkan perusahaan dan divisi', () => {
    expect(formatOrgLabel({ company: 'PT IONS', division: 'Finance' })).toBe('PT IONS - Divisi Finance');
  });

  it('fallback ke department saat belum ada perusahaan/divisi', () => {
    expect(formatOrgLabel({ department: 'Finance & Accounting' })).toBe('Dept: Finance & Accounting');
  });

  it('tampilkan perusahaan saja bila divisi kosong', () => {
    expect(formatOrgLabel({ company: 'PT IONS', department: 'Finance' })).toBe('PT IONS');
  });

  it('tampilkan divisi saja bila perusahaan kosong', () => {
    expect(formatOrgLabel({ division: 'Finance' })).toBe('Divisi Finance');
  });

  it('return null saat semua kosong', () => {
    expect(formatOrgLabel({})).toBeNull();
    expect(formatOrgLabel({ company: '  ', division: null, department: '' })).toBeNull();
  });

  // Bentuk AppUser (isi /api/auth/me) memakai companyName/divisionName.
  it('membaca bentuk AppUser companyName/divisionName', () => {
    expect(formatOrgLabel({ companyName: 'PT IONS', divisionName: 'Finance' })).toBe('PT IONS - Divisi Finance');
  });

  it('AppUser tanpa perusahaan tetap jatuh ke Dept:', () => {
    expect(formatOrgLabel({ department: 'Finance & Accounting' })).toBe('Dept: Finance & Accounting');
  });
});

describe('formatRequesterIdentity', () => {
  it('format lengkap sesuai label pelapor', () => {
    expect(formatRequesterIdentity({
      name: 'Rina Wulandari',
      company: 'PT IONS',
      division: 'Finance',
    })).toBe('Rina Wulandari • PT IONS - Divisi Finance');
  });

  it('fallback ke nama saja tanpa identitas organisasi', () => {
    expect(formatRequesterIdentity({ name: 'Rina Wulandari' })).toBe('Rina Wulandari');
  });

  it('pakai nama fallback bila nama kosong', () => {
    expect(formatRequesterIdentity({ name: '', company: 'PT IONS' }, 'User')).toBe('User • PT IONS');
  });
});
