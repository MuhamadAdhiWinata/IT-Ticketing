import { successResponse } from '~/server/utils/response';
import { getTicketById } from '~/server/utils/tickets';
import { requireAuth } from '~/server/utils/authorize';
import { getTargetStatus } from '~/server/utils/ticket-lifecycle';
import { parseMultipart, cleanupTempFiles, readUploads } from '~/server/utils/upload';
import { toActor } from '~/server/services/ticketing/common';
import { transitionStatus, STATUSES } from '~/server/services/ticketing/workflow';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await requireAuth(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ticket ID required' });

  let stageKey = 'IN_PROGRESS';
  let notes = '';
  let targetStatus: string | undefined;
  let delegation: any;
  let parsed: Awaited<ReturnType<typeof parseMultipart>> | null = null;

  const ct = event.node.req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    parsed = await parseMultipart(event.node.req, process.env.UPLOAD_DIR || './server/uploads');
    stageKey = parsed.fields.stageKey || stageKey;
    notes = parsed.fields.notes || '';
    targetStatus = parsed.fields.targetStatus || undefined;
    if (parsed.fields.delegation) {
      try { delegation = JSON.parse(parsed.fields.delegation); } catch {
        await cleanupTempFiles(parsed.files);
        throw createError({ statusCode: 400, statusMessage: 'delegation bukan JSON valid' });
      }
    }
  } else {
    const body = await readBody(event);
    stageKey = body?.stageKey || stageKey;
    notes = body?.notes || '';
    targetStatus = body?.targetStatus;
    delegation = body?.delegation;
  }

  const to = targetStatus || getTargetStatus(stageKey);
  try {
    await transitionStatus(toActor(user), {
      ticketId: id,
      to: to as (typeof STATUSES)[number],
      notes,
      delegation: delegation ?? undefined,
      files: parsed ? await readUploads(parsed.files) : [],
    });
  } finally {
    if (parsed) await cleanupTempFiles(parsed.files);
  }

  return successResponse(await getTicketById(id));
});
