import { successResponse } from '~/server/utils/response';
import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { importDataset } from '~/server/services/import';

// Body: { csv: string, dryRun?: boolean }. dryRun hanya memeriksa dan melaporkan, tidak menulis apa pun.
export default defineEventHandler(async (event) => {
  const user = await requireClaim(event, CLAIM.IMPORT_MASTER);
  const key = getRouterParam(event, 'dataset') ?? '';
  const body = (await readBody(event)) ?? {};
  if (typeof body.csv !== 'string' || !body.csv.trim()) throw createError({ statusCode: 400, statusMessage: 'csv: isi file wajib diisi' });
  return successResponse(await importDataset(key, body.csv, { dryRun: !!body.dryRun, actorId: user.id }));
});
