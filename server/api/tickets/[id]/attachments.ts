import { getCurrentUserId } from '~/server/utils/user-context';
import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, attachments } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getCurrentUserId(event);
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });
  }

  const existing = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' });
  }

  const ts = now();
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
    uploadedByName: userId,
    uploadedAt: ts,
  }).execute();

  const result = await getTicketById(id);

  return successResponse(result);
});
