export default defineNuxtPlugin(async () => {
  if (import.meta.server) return;

  // Apply dark mode from localStorage BEFORE any Vue component renders
  const stored = localStorage.getItem('darkMode');
  if (stored === '1') {
    document.documentElement.classList.add('dark');
  } else if (stored === '0') {
    document.documentElement.classList.remove('dark');
  } else {
    // Belum ada pilihan tersimpan: ikuti preferensi sistem, bukan paksa terang.
    // Perbaikan penuh = skrip inline dari server sebelum paint pertama;
    // plugin ini masih berjalan setelah HTML digarap, jadi kedipan tetap mungkin.
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', !!prefersDark);
  }

  // Token warna dihitung ulang untuk mode yang baru dipilih (kontras AA).
  const { refreshThemeTokens } = await import('~/composables/useCompany');
  refreshThemeTokens();
});
