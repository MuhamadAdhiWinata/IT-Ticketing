export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return;

  // Configure $fetch globally to include cookies
  nuxtApp.$fetch = $fetch.create({
    credentials: 'include',
  });
});
