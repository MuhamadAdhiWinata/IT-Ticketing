export interface FileStorage {
  upload(file: { name: string; size: number; data: Buffer }, filePath: string): Promise<{ url: string; name: string; size: string }>;
  getUrl(filePath: string): string;
  delete(filePath: string): Promise<void>;
}

import { LocalFileStorage } from './local';

export const fileStorage: FileStorage = new LocalFileStorage(
  process.env.UPLOAD_DIR || './server/uploads',
);
