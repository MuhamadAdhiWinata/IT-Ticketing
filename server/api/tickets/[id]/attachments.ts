import { eq, and, desc } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { attachments, tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getCurrentUser, getCurrentUserId } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  if (method === 'GET') {
    const user = getCurrentUser(event);
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const ticket = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    if (!ticket) {
      throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
    }

    // Filter visibility: USER_VISIBLE untuk semua, INTERNAL_ONLY hanya untuk IT_WORKER/SYSTEM_ADMIN
    const isIT = user.role === 'IT_WORKER' || user.role === 'SYSTEM_ADMIN';

    const results = await db.query.attachments.findMany({
      where: (a, { eq: e, and: aOp }) => {
        const conditions = [e(a.ticketId, id)];
        if (!isIT) {
          conditions.push(e(a.visibility, 'USER_VISIBLE'));
        }
        return aOp(...conditions);
      },
      orderBy: [desc(attachments.uploadedAt)],
    });

    return successResponse(results.map(a => ({
      id: a.id,
      stage: a.stage,
      visibility: a.visibility,
      file_name: a.fileName,
      file_size: a.fileSize,
      file_path: a.filePath,
      uploaded_by: a.uploadedBy,
      uploaded_by_name: a.uploadedBy,
      uploaded_at: a.uploadedAt,
    })));
  }

  const user = getCurrentUser(event);
  const userId = getCurrentUserId(event);
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  if (user.role !== 'IT_WORKER' && user.role !== 'SYSTEM_ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const body = await readBody(event);
  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  const ts = new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
  const attachId = `ATT-${Date.now()}`;

  await db.insert(attachments).values({
    id: attachId,
    ticketId: id,
    stage: body.stage || 'REQUEST',
    visibility: body.visibility || 'USER_VISIBLE',
    fileName: body.file_name || '',
    fileSize: body.file_size || '',
    filePath: body.file_path || null,
    uploadedBy: userId,
    uploadedAt: ts,
  }).execute();

  const { getTicketById } = await import('~/server/utils/tickets');
  const result = await getTicketById(id);
  return successResponse(result);
});