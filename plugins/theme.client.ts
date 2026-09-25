export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  // Apply dark mode from localStorage BEFORE any Vue component renders
  const stored = localStorage.getItem('darkMode');
  if (stored === '1') {
    document.documentElement.classList.add('dark');
  } else if (stored === '0') {
    document.documentElement.classList.remove('dark');
  } else {
    // First visit: respect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  }

  // Sync dark mode class with Pinia store when it's ready
  const syncDarkMode = () => {
    const stored = localStorage.getItem('darkMode');
    const hasDark = document.documentElement.classList.contains('dark');
    if (stored === null && !hasDark) {
      // First visit — persist system preference
      localStorage.setItem('darkMode', hasDark ? '1' : '0');
    }
  };
  syncDarkMode();
});
