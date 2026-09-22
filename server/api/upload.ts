import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { fileStorage } from '~/server/services/storage';
import { successResponse } from '~/server/utils/response';
import { getCurrentUserId } from '~/server/utils/user-context';

export default defineEventHandler(async (event) => {
  const uploadBase = process.env.UPLOAD_DIR || './server/uploads';
  const tempDir = path.join(uploadBase, 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const form = formidable({
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
  });

  const [fields, files] = await new Promise<any[]>((resolve, reject) => {
    form.parse(event.node.req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const ticketId = Array.isArray(fields.ticketId) ? fields.ticketId[0] : fields.ticketId || 'general';
  const stage = Array.isArray(fields.stage) ? fields.stage[0] : fields.stage || 'REQUEST';
  const visibility = Array.isArray(fields.visibility) ? fields.visibility[0] : fields.visibility || 'USER_VISIBLE';
  const userId = getCurrentUserId(event);

  const ext = path.extname(file.originalFilename || 'file');
  const fileName = path.basename(file.originalFilename || 'file', ext) + ext;
  const safeId = ticketId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filePath = path.join('uploads', safeId, fileName);

  const fileData = await fs.readFile(file.filepath);
  const result = await fileStorage.upload(
    { name: fileName, size: file.size, data: fileData },
    filePath,
  );

  await fs.rm(file.filepath, { force: true }).catch(() => {});

  return successResponse({
    ...result,
    stage,
    visibility,
    uploaded_by: userId,
  });
});
