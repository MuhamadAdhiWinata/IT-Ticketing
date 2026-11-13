import { requireClaim } from '~/server/utils/authorize';
import { CLAIM } from '~/utils/permissions';
import { datasetOf, exportCsv } from '~/server/services/import';

export default defineEventHandler(async (event) => {
  await requireClaim(event, CLAIM.IMPORT_MASTER);
  const ds = datasetOf(getRouterParam(event, 'dataset') ?? '');
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
  setHeader(event, 'Content-Disposition', `attachment; filename="${ds.key}-${new Date().toISOString().slice(0, 10)}.csv"`);
  return exportCsv(ds.key);
});
