// Spesifikasi field tiket (revisi 06112026). Dipakai server (validasi) dan UI (pilihan).

export interface Opt<V extends string = string> { value: V; label: string }

export const UNITS = ['LNY', 'IIE', 'REN', 'Holding'] as const;

export const AFFECTED_SCOPES: Opt[] = [
  { value: 'SATU_PENGGUNA', label: 'Satu pengguna' },
  { value: 'SATU_UNIT', label: 'Satu unit atau banyak pengguna' },
  { value: 'SEMUA_PENGGUNA', label: 'Beberapa unit atau seluruh pengguna' },
];

export const WORK_STATUSES: Opt[] = [
  { value: 'BERHENTI_TOTAL', label: 'Berhenti total' },
  { value: 'TERGANGGU', label: 'Terganggu, ada cara lain' },
  { value: 'DAPAT_MENUNGGU', label: 'Dapat menunggu' },
  { value: 'BELUM_TAHU', label: 'Belum tahu (perlu triase)' },
];

export const CHANNELS: Opt[] = [
  { value: 'FORM', label: 'Formulir' },
  { value: 'PERCAKAPAN', label: 'Percakapan' },
  { value: 'INTERNAL', label: 'Internal' },
];

export const TICKET_TYPES: Opt[] = [
  { value: 'INSIDEN', label: 'Insiden' },
  { value: 'PL_AKSES', label: 'PL: Akses dan Konfigurasi' },
  { value: 'PL_DATA', label: 'PL: Data' },
  { value: 'PERTANYAAN', label: 'Pertanyaan Penggunaan' },
  { value: 'PENGEMBANGAN', label: 'Permintaan Pengembangan' },
  { value: 'PROYEK_BARU', label: 'Proyek Baru' },
  { value: 'DI_LUAR_LAYANAN', label: 'Di Luar Layanan Aplikasi' },
];

// IMPACTS, URGENCIES, PRIORITY_LEVELS, dan DEFAULT_MATRIX hanya nilai awal master (di-seed ke tabel impacts, urgencies,
// priority_levels, priority_matrix). Sumber kebenaran saat berjalan adalah DB lewat /api/triage-master.
export const IMPACTS: Opt[] = [
  { value: 'LUAS', label: 'Luas' },
  { value: 'SEDANG', label: 'Sedang' },
  { value: 'TERBATAS', label: 'Terbatas' },
];

export const URGENCIES: Opt[] = [
  { value: 'TINGGI', label: 'Tinggi' },
  { value: 'SEDANG', label: 'Sedang' },
  { value: 'RENDAH', label: 'Rendah' },
];

export const CATALOG_ITEMS: Opt[] = ['PL-01', 'PL-02', 'PL-03', 'PL-04', 'PL-05'].map(v => ({ value: v, label: v }));

export const TRANSFER_TARGETS: Opt[] = [
  { value: 'IT_SUPPORT', label: 'IT Support' },
  { value: 'PEMILIK_PP', label: 'Pemilik Permintaan Pengembangan' },
  { value: 'PIMPINAN_HO', label: 'Pimpinan HO' },
  { value: 'DUPLIKAT', label: 'Duplikat' },
];

export const BLOCKED_BY: Opt[] = [
  { value: 'RILIS', label: 'Rilis' },
  { value: 'PIHAK_KETIGA', label: 'Pihak ketiga' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export const SOLUTION_TYPES: Opt[] = [
  { value: 'PANDUAN', label: 'Panduan' },
  { value: 'DATA_KONFIGURASI', label: 'Data atau Konfigurasi' },
  { value: 'PERBAIKAN_KODE', label: 'Perbaikan Kode' },
  { value: 'SEMENTARA', label: 'Solusi Sementara' },
];

export const values = (o: Opt[]) => o.map(x => x.value) as [string, ...string[]];
export const labelOf = (o: Opt[], v?: string | null) => o.find(x => x.value === v)?.label ?? (v || '');

// Prioritas P1-P4 dipetakan ke 4 level yang sudah ada (SLA kategori tetap dipakai), jadi himpunan P tetap empat;
// admin hanya mengubah label dan deskripsinya.
export const P_TO_PRIORITY = { P1: 'CRITICAL', P2: 'HIGH', P3: 'MEDIUM', P4: 'LOW' } as const;
export type PLevel = keyof typeof P_TO_PRIORITY;
export const PLEVELS = ['P1', 'P2', 'P3', 'P4'] as [PLevel, ...PLevel[]];
export const PRIORITY_LEVELS: { id: PLevel; label: string; description: string }[] = [
  { id: 'P1', label: 'Kritis', description: 'Layanan berhenti total atau berdampak luas; langsung ditangani.' },
  { id: 'P2', label: 'Tinggi', description: 'Gangguan besar pada banyak pengguna atau proses penting.' },
  { id: 'P3', label: 'Sedang', description: 'Gangguan terbatas, ada cara lain; dijadwalkan normal.' },
  { id: 'P4', label: 'Rendah', description: 'Dampak kecil atau permintaan biasa; dikerjakan bila ada waktu.' },
];
export const priorityToP = (p?: string | null): PLevel | null =>
  (Object.entries(P_TO_PRIORITY).find(([, v]) => v === p)?.[0] as PLevel | undefined) ?? null;

// Matriks Dampak x Urgensi (nilai awal; admin mengubahnya di master Prioritas & Triase).
export type PriorityMatrix = Record<string, Record<string, string>>;
export const DEFAULT_MATRIX: PriorityMatrix = {
  LUAS: { TINGGI: 'P1', SEDANG: 'P2', RENDAH: 'P3' },
  SEDANG: { TINGGI: 'P2', SEDANG: 'P3', RENDAH: 'P4' },
  TERBATAS: { TINGGI: 'P3', SEDANG: 'P4', RENDAH: 'P4' },
};
export const priorityFromMatrix = (impact?: string | null, urgency?: string | null, matrix: PriorityMatrix = DEFAULT_MATRIX): PLevel | null =>
  ((impact && urgency && matrix[impact]?.[urgency]) || null) as PLevel | null;

// P1/P2 pada Insiden wajib konfirmasi Duty Engineer sebelum diproses.
export const needsDutyConfirm = (ticketType?: string | null, priority?: string | null) =>
  ticketType === 'INSIDEN' && (priority === 'CRITICAL' || priority === 'HIGH');

// Fase tampilan diturunkan dari status alur + kolom triase; DB tetap DRAFT/PROCESS/DELEGASI/SELESAI.
// Urutan: Baru > Diakui (klik Akui) > Ditriase (klik Mulai Triase) > Dikerjakan > Menunggu Pemohon > Selesai.
// "Selesai" satu fase akhir dengan tiga hasil: Selesai, Ditutup, Dialihkan.
export const PHASES = ['Baru', 'Diakui', 'Ditriase', 'Dikerjakan', 'Menunggu Pemohon', 'Selesai'] as const;
export type Phase = (typeof PHASES)[number];
export type Outcome = 'Selesai' | 'Ditutup' | 'Dialihkan';

export interface StatusSource {
  status: string;
  acknowledgedAt?: string | null;
  triagedAt?: string | null;
  waitingStartedAt?: string | null;
  waitingEndedAt?: string | null;
  transferTarget?: string | null;
  closedAt?: string | null;
}
export function deriveOutcome(t: StatusSource): Outcome | null {
  if (t.status !== 'SELESAI') return null;
  return t.transferTarget ? 'Dialihkan' : t.closedAt ? 'Ditutup' : 'Selesai';
}
export function derivePhase(t: StatusSource): Phase {
  if (t.status === 'SELESAI') return 'Selesai';
  if (t.status === 'PROCESS' || t.status === 'DELEGASI') {
    return t.waitingStartedAt && !t.waitingEndedAt ? 'Menunggu Pemohon' : 'Dikerjakan';
  }
  if (t.triagedAt) return 'Ditriase';
  return t.acknowledgedAt ? 'Diakui' : 'Baru';
}
// Label ringkas untuk badge: fase, atau hasil akhir bila tiket sudah di fase akhir.
// Pilihan filter status di semua daftar tiket: fase, plus hasil akhir Ditutup / Dialihkan.
export const STATUS_FILTERS = [...PHASES, 'Ditutup', 'Dialihkan'] as const;
export const matchesStatusFilter = (t: { status_phase?: string; status_label?: string }, f: string) =>
  f === 'ALL' || t.status_phase === f || t.status_label === f;
export const deriveStatusLabel = (t: StatusSource): string => deriveOutcome(t) ?? derivePhase(t);
