import { z } from 'zod';
import { attachments } from '~/server/database/schema';
import { serializeAttachment } from '~/server/utils/serialize';
import {
  type Actor, type DbExec, type UploadInput, VISIBILITIES,
  fail, getTicketRow, inTx, newId, nowTs, parse, requireIT, storeFile, withFileCleanup,
} from './common';

export const ATTACH_STAGES = ['ASSIGN', 'IN_PROGRESS', 'COMPLETION', 'DELEGATION'] as const;

const Schema = z.object({
  ticketId: z.string().min(1),
  stage: z.enum(ATTACH_STAGES).default('IN_PROGRESS'),
  visibility: z.enum(VISIBILITIES).default('USER_VISIBLE'),
});

// Insert baris attachment untuk file yang sudah disimpan; dipakai ulang oleh aktivitas & workflow.
export async function insertAttachments(
  tx: DbExec, track: string[], actor: Actor, ticketId: string, stage: string,
  defaultVisibility: string, ts: string, files: UploadInput[],
) {
  const out: ReturnType<typeof serializeAttachment>[] = [];
  for (const f of files) {
    const stored = await storeFile(track, ticketId, f);
    const row = {
      id: newId('ATT'),
      ticketId,
      stage,
      visibility: f.visibility ?? defaultVisibility,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      filePath: stored.url,
      uploadedBy: actor.id,
      uploadedAt: ts,
    };
    await tx.insert(attachments).values(row);
    out.push(serializeAttachment({ ...row, uploadedByName: actor.name }));
  }
  return out;
}

export async function addAttachments(
  actor: Actor,
  input: { ticketId: string; stage?: string; visibility?: string; files: UploadInput[] },
  exec?: DbExec,
) {
  requireIT(actor);
  const v = parse(Schema, input);
  if (input.files.length === 0) fail(400, 'files: minimal 1 file');
  return withFileCleanup(track => inTx(exec, async (tx) => {
    await getTicketRow(tx, v.ticketId);
    const created = await insertAttachments(tx, track, actor, v.ticketId, v.stage, v.visibility, nowTs(), input.files);
    return { attachments: created };
  }));
}
