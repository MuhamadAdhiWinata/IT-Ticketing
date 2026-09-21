export default defineEventHandler((event) => {
  // Disable caching for all API routes
  if (event.path.startsWith('/api/')) {
    setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    setHeader(event, 'Pragma', 'no-cache');
    setHeader(event, 'Expires', '0');
    setHeader(event, 'Surrogate-Control', 'no-store');
  }
});
