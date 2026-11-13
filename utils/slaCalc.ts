// Hitung SLA (sheet "SLA Tiket HO": SLA Configuration + Uji). Fungsi murni, dipakai server dan UI.
// Jam layanan: Senin-Sabtu, mulai workDayStart (WIB) selama workHoursPerDay; Minggu tidak dihitung. P1 24/7 (coverage ALWAYS).
import { priorityToP } from './ticketSpec';

export type Coverage = 'ALWAYS' | 'BUSINESS';
export type SlaStatus = 'MET' | 'BREACHED' | 'AT_RISK' | 'ON_TRACK';

export interface SlaTarget { priority_id: string; response_hours: number; resolution_hours: number; coverage: Coverage }
export interface SlaSettings { work_hours_per_day: number; work_day_start: number; at_risk_threshold: number }
export interface SlaMaster { targets: SlaTarget[]; settings: SlaSettings }

// Nilai awal = sheet "SLA Configuration" (di-seed ke sla_targets dan sla_settings saat tabel kosong).
export const SLA_KEYS = ['P1', 'P2', 'P3', 'P4', 'DEFAULT'] as const;
export const DEFAULT_SLA_TARGETS: SlaTarget[] = [
  { priority_id: 'P1', response_hours: 0.5, resolution_hours: 24, coverage: 'ALWAYS' },
  { priority_id: 'P2', response_hours: 2, resolution_hours: 48, coverage: 'BUSINESS' },
  { priority_id: 'P3', response_hours: 4, resolution_hours: 72, coverage: 'BUSINESS' },
  { priority_id: 'P4', response_hours: 8, resolution_hours: 120, coverage: 'BUSINESS' },
  { priority_id: 'DEFAULT', response_hours: 8, resolution_hours: 120, coverage: 'BUSINESS' },
];
export const DEFAULT_SLA_SETTINGS: SlaSettings = { work_hours_per_day: 9, work_day_start: 8, at_risk_threshold: 0.8 };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WIB_OFFSET = 7 * HOUR;

// Waktu di DB disimpan UTC ("YYYY-MM-DD HH:mm:ss").
export const tsToMs = (s: string) => Date.parse(`${s.replace(' ', 'T')}Z`);

export function serviceHours(startMs: number, endMs: number, coverage: Coverage, cfg: SlaSettings = DEFAULT_SLA_SETTINGS): number {
  if (!(endMs > startMs)) return 0;
  if (coverage === 'ALWAYS') return (endMs - startMs) / HOUR;
  const s = startMs + WIB_OFFSET; // geser ke WIB lalu baca hari/jam dengan getUTC*
  const e = endMs + WIB_OFFSET;
  let total = 0;
  for (let d = Math.floor(s / DAY) * DAY; d < e; d += DAY) {
    if (new Date(d).getUTCDay() === 0) continue;
    const open = d + cfg.work_day_start * HOUR;
    const close = open + cfg.work_hours_per_day * HOUR;
    total += Math.max(0, Math.min(e, close) - Math.max(s, open));
  }
  return total / HOUR;
}

export function slaStatus(elapsed: number, target: number, done: boolean, threshold: number): SlaStatus {
  if (done) return elapsed <= target ? 'MET' : 'BREACHED';
  if (elapsed > target) return 'BREACHED';
  return elapsed >= target * threshold ? 'AT_RISK' : 'ON_TRACK';
}

export interface SlaTicket {
  status: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  transferTarget?: string | null;
  firstCompletedAt?: string | null;
  waitingStartedAt?: string | null;
  waitingEndedAt?: string | null;
  ticketType?: string | null;
  priority: string;
}

export interface SlaResult {
  key: string;
  coverage: Coverage;
  target_response_hours: number;
  target_resolution_hours: number;
  elapsed_response_hours: number;
  elapsed_resolution_hours: number;
  response_done: boolean;
  resolution_done: boolean;
  response_status: SlaStatus;
  resolution_status: SlaStatus;
}

// Target P1-P4 hanya untuk Insiden; tiket lain (atau belum ditriase) memakai DEFAULT.
export function pickTarget(targets: SlaTarget[], ticketType: string | null | undefined, priority: string): SlaTarget {
  const key = ticketType === 'INSIDEN' ? priorityToP(priority) : null;
  return targets.find(t => t.priority_id === key) ?? targets.find(t => t.priority_id === 'DEFAULT') ?? DEFAULT_SLA_TARGETS[4]!;
}

// ponytail: hanya satu jeda Menunggu Pemohon yang tersimpan (yang terakhir) dan buka ulang tidak menambah jam;
// bila perlu banyak interval, buat tabel interval (sheet "Interval") dan jumlahkan di sini.
export function computeSla(t: SlaTicket, m: SlaMaster, nowMs = Date.now()): SlaResult {
  const target = pickTarget(m.targets, t.ticketType, t.priority);
  const cfg = m.settings;
  const created = tsToMs(t.createdAt);

  const ack = t.acknowledgedAt ? tsToMs(t.acknowledgedAt) : null;
  const elapsedResponse = serviceHours(created, ack ?? nowMs, target.coverage, cfg);

  // Dialihkan bukan penyelesaian: tidak dihitung sebagai resolusi (sheet: jangan isi Selesai palsu).
  const doneAt = t.firstCompletedAt ?? (t.status === 'SELESAI' && !t.transferTarget ? t.completedAt : null);
  const end = doneAt ? tsToMs(doneAt) : nowMs;
  let elapsedResolution = serviceHours(created, end, target.coverage, cfg);
  if (t.waitingStartedAt) {
    const ws = Math.max(tsToMs(t.waitingStartedAt), created);
    const we = Math.min(t.waitingEndedAt ? tsToMs(t.waitingEndedAt) : end, end);
    elapsedResolution = Math.max(0, elapsedResolution - serviceHours(ws, we, target.coverage, cfg));
  }

  return {
    key: target.priority_id,
    coverage: target.coverage,
    target_response_hours: target.response_hours,
    target_resolution_hours: target.resolution_hours,
    elapsed_response_hours: round2(elapsedResponse),
    elapsed_resolution_hours: round2(elapsedResolution),
    response_done: ack !== null,
    resolution_done: !!doneAt,
    response_status: slaStatus(elapsedResponse, target.response_hours, ack !== null, cfg.at_risk_threshold),
    resolution_status: slaStatus(elapsedResolution, target.resolution_hours, !!doneAt, cfg.at_risk_threshold),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Persentil dengan interpolasi linear (sama dengan PERCENTILE di Sheets). Kosong = null.
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const idx = (v.length - 1) * p;
  const lo = Math.floor(idx);
  return round2(v[lo]! + (v[Math.min(lo + 1, v.length - 1)]! - v[lo]!) * (idx - lo));
}

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  MET: 'Sesuai SLA', BREACHED: 'Lewat SLA', AT_RISK: 'Berisiko', ON_TRACK: 'On Track',
};
export const COVERAGE_LABEL: Record<Coverage, string> = { ALWAYS: '24/7', BUSINESS: 'Jam Kerja' };
