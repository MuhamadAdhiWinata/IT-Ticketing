import { files, worklogFiles, commentFiles } from '~/server/database/schema';
import { eq } from 'drizzle-orm';
import { type Actor, type DbExec, type UploadInput, newId, nowTs, inTx, storeFile, withFileCleanup } from './common';

export interface FileRecord {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size: string | null;
  file_path: string | null;
  uploaded_by: string;
  uploaded_at: string;
  visibility: 'USER_VISIBLE' | 'INTERNAL_ONLY';
  stage?: string | null;
}

// Upload files and return file records (not linked to worklog/comment yet)
export async function uploadFiles(
  actor: Actor,
  ticketId: string,
  uploads: UploadInput[],
  visibility: 'USER_VISIBLE' | 'INTERNAL_ONLY',
  track: string[],
  exec?: DbExec,
): Promise<FileRecord[]> {
  return inTx(exec, async (tx) => {
    const ts = nowTs();
    const created: FileRecord[] = [];

    for (const u of uploads) {
      const stored = await storeFile(track, ticketId, u);
      const row = {
        id: newId('FILE'),
        ticketId,
        stage: null,
        visibility,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        filePath: stored.url,
        uploadedBy: actor.id,
        uploadedAt: ts,
      };
      await tx.insert(files).values(row);
      created.push({
        id: row.id,
        ticket_id: row.ticketId,
        file_name: row.fileName,
        file_size: row.fileSize,
        file_path: row.filePath,
        uploaded_by: row.uploadedBy,
        uploaded_at: row.uploadedAt,
        visibility: row.visibility,
        stage: row.stage,
      });
    }

    return created;
  });
}

// Link files to worklog
export async function linkFilesToWorklog(
  worklogId: string,
  fileIds: string[],
  exec?: DbExec,
): Promise<void> {
  return inTx(exec, async (tx) => {
    const ts = nowTs();
    for (const fileId of fileIds) {
      await tx.insert(worklogFiles).values({
        id: newId('WLF'),
        worklogId,
        fileId,
        createdAt: ts,
      });
    }
  });
}

// Link files to comment
export async function linkFilesToComment(
  commentId: string,
  fileIds: string[],
  exec?: DbExec,
): Promise<void> {
  return inTx(exec, async (tx) => {
    const ts = nowTs();
    for (const fileId of fileIds) {
      await tx.insert(commentFiles).values({
        id: newId('CMF'),
        commentId,
        fileId,
        createdAt: ts,
      });
    }
  });
}

// Get files by worklog (via pivot)
export async function getFilesByWorklog(
  worklogId: string,
  exec?: DbExec,
): Promise<FileRecord[]> {
  return inTx(exec, async (tx) => {
    const links = await tx.select().from(worklogFiles).where(eq(worklogFiles.worklogId, worklogId));
    if (links.length === 0) return [];

    const fileIds = links.map(l => l.fileId);
    const rows = await tx.select().from(files).where(eq(files.id, fileIds[0])); // ponytail: single query, loop for multiple
    
    const result: FileRecord[] = [];
    for (const fileId of fileIds) {
      const row = await tx.select().from(files).where(eq(files.id, fileId));
      if (row[0]) {
        const f = row[0];
        result.push({
          id: f.id,
          ticket_id: f.ticketId,
          file_name: f.fileName,
          file_size: f.fileSize,
          file_path: f.filePath,
          uploaded_by: f.uploadedBy,
          uploaded_at: f.uploadedAt,
          visibility: f.visibility,
          stage: f.stage,
        });
      }
    }
    return result;
  });
}

// Get files by comment (via pivot)
export async function getFilesByComment(
  commentId: string,
  exec?: DbExec,
): Promise<FileRecord[]> {
  return inTx(exec, async (tx) => {
    const links = await tx.select().from(commentFiles).where(eq(commentFiles.commentId, commentId));
    if (links.length === 0) return [];

    const fileIds = links.map(l => l.fileId);
    const result: FileRecord[] = [];
    for (const fileId of fileIds) {
      const row = await tx.select().from(files).where(eq(files.id, fileId));
      if (row[0]) {
        const f = row[0];
        result.push({
          id: f.id,
          ticket_id: f.ticketId,
          file_name: f.fileName,
          file_size: f.fileSize,
          file_path: f.filePath,
          uploaded_by: f.uploadedBy,
          uploaded_at: f.uploadedAt,
          visibility: f.visibility,
          stage: f.stage,
        });
      }
    }
    return result;
  });
}
