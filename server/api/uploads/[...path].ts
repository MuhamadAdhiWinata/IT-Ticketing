import fs from 'fs/promises';
import path from 'path';
import { createError, getRouterParam, setHeader } from 'h3';

export default async function handler(event: any) {
  const filePath = getRouterParam(event, 'path') || [];
  const relativePath = Array.isArray(filePath) ? filePath.join('/') : filePath;
  const fullPath = (process.env.UPLOAD_DIR || './server/uploads') + '/' + relativePath;

  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' });
    }

    const data = await fs.readFile(fullPath);
    const ext = path.extname(relativePath).slice(1);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    setHeader(event, 'Content-Type', mimeTypes[ext] || 'application/octet-stream');
    setHeader(event, 'Content-Disposition', `attachment; filename="${path.basename(relativePath)}"`);
    setHeader(event, 'Content-Length', stats.size);

    return data;
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }
}
