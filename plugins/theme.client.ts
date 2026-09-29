export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  // Apply dark mode from localStorage BEFORE any Vue component renders
  const stored = localStorage.getItem('darkMode');
  if (stored === '1') {
    document.documentElement.classList.add('dark');
  } else if (stored === '0') {
    document.documentElement.classList.remove('dark');
  } else {
    // Default to light mode when no saved preference exists
    document.documentElement.classList.remove('dark');
  }

  // Sync dark mode class with Pinia store when it's ready
  const syncDarkMode = () => {
    // Do not persist on first visit — let appStore.initApp() fetch
    // the server-stored preference after login and persist then.
  };
  syncDarkMode();
});
