import { ensureRbac } from '~/server/services/rbac';

// Berjalan sebelum auth: API dan endpoint /mcp selalu memakai matriks klaim terbaru dari DB.
export default defineEventHandler(async (event) => {
  const path = event.path || '';
  if (path.startsWith('/api/') || path.startsWith('/mcp')) await ensureRbac();
});
