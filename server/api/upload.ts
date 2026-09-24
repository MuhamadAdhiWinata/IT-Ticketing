import fs from 'fs/promises';
import path from 'path';
import { fileStorage } from '~/server/services/storage';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId } from '~/server/utils/user-context';
import { parseMultipart, cleanupTempFiles, sanitizeFilename } from '~/server/utils/upload';
import { db } from '~/server/database/client';
import { attachments } from '~/server/database/schema';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const uploadBase = process.env.UPLOAD_DIR || './server/uploads';
  const userId = getCurrentUserId(event);

  const { fields, files } = await parseMultipart(event.node.req, uploadBase);

  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const ticketId = fields.ticketId || 'general';
  const stage = fields.stage || 'REQUEST';
  const visibility = fields.visibility || 'USER_VISIBLE';
  const safeId = ticketId.replace(/[^a-zA-Z0-9-_]/g, '_');

  const ts = now();
  const results: any[] = [];

  try {
    for (const file of files) {
      const ext = path.extname(file.originalFilename || 'file');
      const fileName = sanitizeFilename(file.originalFilename || `file${ext}`);
      const filePath = path.join('uploads', safeId, `${Date.now()}_${fileName}`);

      const fileData = await fs.readFile(file.filepath);
      const uploaded = await fileStorage.upload(
        { name: fileName, size: file.size, data: fileData },
        filePath,
      );

      const attachId = `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await db.insert(attachments).values({
        id: attachId,
        ticketId,
        stage,
        visibility: visibility as any,
        fileName,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        filePath: uploaded.url,
        uploadedBy: userId || 'system',
        uploadedAt: ts,
      }).execute();

      results.push({
        id: attachId,
        file_name: fileName,
        file_size: `${(file.size / 1024).toFixed(1)} KB`,
        file_url: uploaded.url,
        stage,
        visibility,
      });
    }
  } finally {
    await cleanupTempFiles(files);
  }

  return successResponse(results);
});
