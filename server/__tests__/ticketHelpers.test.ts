import { describe, it, expect } from 'vitest';
import { getProjectKendalaLabel } from '../../utils/ticketHelpers';

describe('getProjectKendalaLabel', () => {
  it('kategori layanan harian memakai istilah Kendala', () => {
    expect(getProjectKendalaLabel('Support IT')).toBe('Kendala');
  });

  it('kategori pengembangan memakai istilah Project', () => {
    expect(getProjectKendalaLabel('IT Programmer')).toBe('Project');
  });

  it('nama kategori yang tak dikenal jatuh ke label gabungan', () => {
    expect(getProjectKendalaLabel('Jaringan')).toBe('Project/Kendala');
    expect(getProjectKendalaLabel('')).toBe('Project/Kendala');
  });
});
