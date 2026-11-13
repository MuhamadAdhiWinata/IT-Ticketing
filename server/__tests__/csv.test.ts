import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from '~/utils/csv';

describe('csv', () => {
  it('kutip, koma dalam sel, baris baru dalam sel, BOM', () => {
    expect(parseCsv('\uFEFFa,b\r\n"x, y","li""ne\n2"\r\n')).toEqual([['a', 'b'], ['x, y', 'li"ne\n2']]);
  });

  it('titik koma (Excel lokal Indonesia) dan baris sep= dikenali; baris kosong dibuang', () => {
    expect(parseCsv('a;b\n1;2\n\n3;4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    expect(parseCsv('sep=;\na,b;c\n1;2')).toEqual([['a,b', 'c'], ['1', '2']]);
  });

  it('kutip tak tertutup ditolak', () => {
    expect(() => parseCsv('a,b\n"x,y')).toThrow();
  });

  it('toCsv bisa dibaca balik; sel berawalan rumus diberi awalan kutip', () => {
    const csv = toCsv(['a', 'b'], [['=1+1', 'x"y'], [null, 5]]);
    expect(csv.startsWith('\uFEFFsep=,')).toBe(true);
    expect(parseCsv(csv)).toEqual([['a', 'b'], ["'=1+1", 'x"y'], ['', '5']]);
  });
});
