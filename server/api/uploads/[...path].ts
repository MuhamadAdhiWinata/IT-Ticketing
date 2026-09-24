import fs from 'fs/promises';
import path from 'path';
import { createError, getRouterParam, setHeader } from 'h3';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  bmp: 'image/bmp', ico: 'image/x-icon',
  pdf: 'application/pdf',
  txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', rar: 'application/x-rar-compressed',
  mp4: 'video/mp4', mp3: 'audio/mpeg',
};

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']);

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
    const ext = path.extname(relativePath).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImage = IMAGE_EXTS.has(ext);
    const fileName = path.basename(relativePath);

    setHeader(event, 'Content-Type', contentType);
    setHeader(event, 'Content-Disposition', isImage ? `inline; filename="${fileName}"` : `attachment; filename="${fileName}"`);
    setHeader(event, 'Content-Length', stats.size);

    return data;
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }
}
