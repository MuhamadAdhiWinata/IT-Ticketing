// Semua waktu jadwal disimpan UTC sebagai "YYYY-MM-DD HH:MM:SS" (kolom datetime, tanpa konversi zona oleh DB).
// API memakai ISO 8601 UTC ("...Z"). Konversi ke zona lokal hanya terjadi di UI (input datetime-local dan tampilan).
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isoToDbUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Waktu tidak valid: ${iso}`);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export const dbUtcToIso = (db: string): string => `${db.replace(' ', 'T').slice(0, 19)}.000Z`;

export const nowDbUtc = (ms = Date.now()): string => isoToDbUtc(new Date(ms).toISOString());

// Nilai <input type="datetime-local"> (waktu lokal browser) dari ISO UTC, dan sebaliknya lewat new Date(value).toISOString().
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const localInputToIso = (v: string): string => new Date(v).toISOString();

export const fmtLocal = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
