import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { fileStorage } from '~/server/services/storage';
import { successResponse } from '~/server/utils/response';

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

  const targetDir = path.join('tickets', 'TCK-placeholder');
  const ext = path.extname(file.originalFilename || 'file');
  const fileName = path.basename(file.originalFilename || 'file', ext) + ext;
  const filePath = path.join(targetDir, fileName);

  const fileData = await fs.readFile(file.filepath);
  const result = await fileStorage.upload(
    { name: fileName, size: file.size, data: fileData },
    filePath,
  );

  await fs.rm(file.filepath, { force: true }).catch(() => {});

  return successResponse(result);
});
