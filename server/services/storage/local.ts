import fs from 'fs/promises';
import path from 'path';
import type { FileStorage } from './index';

export class LocalFileStorage implements FileStorage {
  private uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = path.resolve(uploadDir);
  }

  async upload(file: { name: string; size: number; data: Buffer }, filePath: string): Promise<{ url: string; name: string; size: string }> {
    const fullPath = path.join(this.uploadDir, filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file.data);

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      url: `/api/uploads/${filePath}`,
      name: file.name,
      size: `${sizeMB} MB`,
    };
  }

  getUrl(filePath: string): string {
    return `/api/uploads/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File not found, ignore
    }
  }
}
