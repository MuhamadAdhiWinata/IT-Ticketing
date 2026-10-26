import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { parseMultipart, cleanupTempFiles, readUploads } from '~/server/utils/upload';
import { toActor } from '~/server/services/ticketing/common';
import { addActivity } from '~/server/services/ticketing/activities';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  const ct = event.node.req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    const parsed = await parseMultipart(event.node.req, process.env.UPLOAD_DIR || './server/uploads');
    try {
      const visibility = parsed.fields.visibility === 'INTERNAL_ONLY' ? 'INTERNAL_ONLY' : 'USER_VISIBLE';
      await addActivity(toActor(user), {
        ticketId: id,
        stageKey: parsed.fields.stageKey || undefined,
        description: parsed.fields.description || '',
        files: await readUploads(parsed.files, visibility),
      });
    } finally {
      await cleanupTempFiles(parsed.files);
    }
  } else {
    const body = await readBody(event);
    await addActivity(toActor(user), { ticketId: id, stageKey: body?.stageKey || undefined, description: body?.description || '' });
  }

  return successResponse(await getTicketById(id));
});
