import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const userId = getHeader(event, 'X-User-Id') || 'UNKNOWN';
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
  const newAttachment = {
    id: `ATT-${Date.now()}`,
    stage: body.stage || 'REQUEST',
    visibility: body.visibility || 'USER_VISIBLE',
    file_name: body.file_name || '',
    file_size: body.file_size || '',
    file_path: body.file_path || null,
    uploaded_by: userId,
    uploaded_by_name: userId,
    uploaded_at: ts,
  };

  const updatedAttachments = [...(existing.attachments || []), newAttachment];

  await db.update(tickets).set({ attachments: updatedAttachments }).where(eq(tickets.id, id)).execute();

  const result = await db.query.tickets.findFirst({
    where: (t, { eq: e }) => e(t.id, id),
  });

  return successResponse(result);
});
