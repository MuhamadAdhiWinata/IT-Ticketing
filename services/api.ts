// Lapisan akses API tunggal: selalu membawa sesi (`credentials: 'include'`).
// Store, komponen, dan komposable memanggil lewat sini supaya logika pemanggilan
// API tidak tersebar (AGENTS.md: storage/API ada di services/).

export function apiFetch<T>(url: string, opts?: any): Promise<T> {
  return $fetch(url, { ...opts, credentials: 'include' }) as Promise<T>;
}
