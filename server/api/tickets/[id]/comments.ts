import { db } from '~/server/database/client';
import { successResponse } from '~/server/utils/response';
import { requireAuth } from '~/server/utils/authorize';
import { serializeComment } from '~/server/utils/serialize';
import { toActor } from '~/server/services/ticketing/common';
import { addComment } from '~/server/services/ticketing/discussion';
import { canViewTicket } from '~/server/services/ticketing/permissions';
import { parseMultipart, cleanupTempFiles, readUploads } from '~/server/utils/upload';
import { getFilesByComment } from '~/server/services/ticketing/files';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  if (event.method === 'GET') {
    const me = await requireAuth(event);
    const existing = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    if (!canViewTicket(existing, toActor(me))) throw createError({ statusCode: 403, statusMessage: 'Forbidden: bukan pihak tiket ini' });

    const list = await db.query.comments.findMany({
      where: (c, { eq: e }) => e(c.ticketId, id),
      orderBy: (c, { asc: a }) => a(c.createdAt),
    });
    
    // Load files for each comment
    const commentsWithFiles = await Promise.all(
      list.map(async (c) => {
        const files = await getFilesByComment(c.id);
        return { ...serializeComment(c), files };
      })
    );
    
    return successResponse(commentsWithFiles);
  }

  if (event.method === 'POST') {
    const user = await requireAuth(event);
    const ct = event.node.req.headers['content-type'] || '';
    
    if (ct.includes('multipart/form-data')) {
      const parsed = await parseMultipart(event.node.req, process.env.UPLOAD_DIR || './server/uploads');
      try {
        const { comment, files } = await addComment(toActor(user), {
          ticketId: id,
          message: parsed.fields.message || '',
          files: await readUploads(parsed.files, 'USER_VISIBLE'),
        });
        return successResponse({ ...comment, files });
      } finally {
        await cleanupTempFiles(parsed.files);
      }
    } else {
      const body = await readBody(event);
      const { comment, files } = await addComment(toActor(user), { ticketId: id, message: body?.message });
      return successResponse({ ...comment, files });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
