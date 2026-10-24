export default defineNuxtPlugin(async () => {
  if (import.meta.server) return;

  // Default terang; gelap hanya bila pengguna memilihnya (prefers-color-scheme diabaikan).
  // Skrip inline di nuxt.config.ts sudah memasang kelas sebelum paint; ini menjaga navigasi klien.
  document.documentElement.classList.toggle('dark', localStorage.getItem('darkMode') === '1');

  // Token warna dihitung ulang untuk mode yang baru dipilih (kontras AA).
  const { refreshThemeTokens } = await import('~/composables/useCompany');
  refreshThemeTokens();
});
