import { describe, it, expect } from 'vitest';
import { computeSla, serviceHours, percentile, DEFAULT_SLA_SETTINGS, DEFAULT_SLA_TARGETS, tsToMs } from '../../utils/slaCalc';

// Serial tanggal Excel/Sheets (WIB) -> epoch ms. Kasus dan ekspektasi dari tab "Uji" di ISSUE/Copy of SLA Tiket HO.xlsx.
const serial = (n: number) => Math.round((n - 25569) * 86_400_000) - 7 * 3_600_000;
const master = { targets: DEFAULT_SLA_TARGETS, settings: DEFAULT_SLA_SETTINGS };
// WIB -> string DB (UTC)
const db = (n: number) => new Date(serial(n)).toISOString().replace('T', ' ').slice(0, 19);

describe('jam layanan (tab Uji)', () => {
  it.each([
    ['satu hari', 46332.375, 46332.4583333333, 2],
    ['Jumat malam ke Sabtu', 46332.75, 46333.4166666667, 2],
    ['Sabtu ke Senin lewati Minggu', 46333.6666666667, 46335.4166666667, 3],
    ['Minggu saja', 46334.375, 46334.6666666667, 0],
    ['sebelum jam buka', 46332.25, 46332.2916666667, 0],
    ['dua hari penuh', 46332.3333333333, 46333.7083333333, 18],
  ])('%s', (_n, a, b, want) => {
    expect(serviceHours(serial(a), serial(b), 'BUSINESS')).toBeCloseTo(want, 3);
  });

  it('24/7 menghitung semua jam termasuk Minggu', () => {
    expect(serviceHours(serial(46334.375), serial(46334.6666666667), 'ALWAYS')).toBeCloseTo(7, 3);
  });
});

describe('computeSla', () => {
  const base = { status: 'PROCESS', createdAt: db(46332.375), priority: 'MEDIUM', ticketType: 'INSIDEN' };

  it('Insiden P3 memakai target P3, belum diakui lewat target = Lewat SLA', () => {
    const r = computeSla({ ...base }, master, serial(46333.7));
    expect(r.key).toBe('P3');
    expect(r.response_done).toBe(false);
    expect(r.response_status).toBe('BREACHED');
  });

  it('tiket non-Insiden memakai DEFAULT', () => {
    expect(computeSla({ ...base, ticketType: 'PERTANYAAN' }, master, serial(46332.4)).key).toBe('DEFAULT');
    expect(computeSla({ ...base, ticketType: null }, master, serial(46332.4)).key).toBe('DEFAULT');
  });

  it('diakui dalam target = MET; jeda pemohon dikurangi dari resolusi neto', () => {
    const r = computeSla({
      ...base, acknowledgedAt: db(46332.4166666667), // 1 jam setelah masuk (P3 target 4 jam)
      firstCompletedAt: db(46333.4166666667), status: 'SELESAI', // Jumat 09:00 -> Sabtu 10:00: 8 + 2 = 10 jam layanan
      waitingStartedAt: db(46332.5), waitingEndedAt: db(46333.375), // Jumat 12:00 -> Sabtu 09:00 = 5 + 1 = 6 jam
    }, master, serial(46340));
    expect(r.response_status).toBe('MET');
    expect(r.elapsed_response_hours).toBe(1);
    expect(r.elapsed_resolution_hours).toBe(4);
    expect(r.resolution_status).toBe('MET');
  });

  it('mendekati 80% target = AT_RISK', () => {
    // P3 respon 4 jam: 3.5 jam berlalu tanpa pengakuan -> 87%
    const r = computeSla({ ...base, createdAt: db(46332.375) }, master, serial(46332.375 + 3.5 / 24));
    expect(r.response_status).toBe('AT_RISK');
  });

  it('selesai pertama tidak ditimpa saat dibuka ulang', () => {
    const r = computeSla({ ...base, status: 'PROCESS', completedAt: null, firstCompletedAt: db(46332.4583333333), acknowledgedAt: db(46332.4) }, master, serial(46340));
    expect(r.resolution_done).toBe(true);
    expect(r.elapsed_resolution_hours).toBe(2);
  });

  it('tiket Dialihkan tidak dihitung selesai', () => {
    const r = computeSla({ ...base, status: 'SELESAI', completedAt: db(46332.4583333333), transferTarget: 'DUPLIKAT' }, master, serial(46332.5));
    expect(r.resolution_done).toBe(false);
  });

  it('tsToMs membaca string DB sebagai UTC', () => {
    expect(tsToMs('2026-11-06 01:00:00')).toBe(Date.UTC(2026, 10, 6, 1));
  });
});

describe('percentile', () => {
  it('median dan P90 interpolasi linear', () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)).toBe(9.1);
    expect(percentile([], 0.5)).toBeNull();
  });
});
