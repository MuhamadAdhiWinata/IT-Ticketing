import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import type { IncomingMessage } from 'http';

export interface ParsedFile {
  originalFilename: string;
  size: number;
  filepath: string;
}

export interface ParseResult {
  fields: Record<string, string>;
  files: ParsedFile[];
}

export async function parseMultipart(req: IncomingMessage, uploadDir: string): Promise<ParseResult> {
  const tempDir = path.join(uploadDir, 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const form = formidable({
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    multiples: true,
  });

  const [rawFields, rawFiles] = await new Promise<any[]>((resolve, reject) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  const fields: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawFields)) {
    fields[key] = Array.isArray(val) ? val[0] : val;
  }

  const files: ParsedFile[] = [];
  for (const val of Object.values(rawFiles)) {
    if (Array.isArray(val)) {
      files.push(...val);
    } else if (val) {
      files.push(val as ParsedFile);
    }
  }

  return { fields, files };
}

export async function cleanupTempFiles(files: ParsedFile[]): Promise<void> {
  for (const f of files) {
    await fs.rm(f.filepath, { force: true }).catch(() => {});
  }
}

export function sanitizeFilename(name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  return base + ext;
}
