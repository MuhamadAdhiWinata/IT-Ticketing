export interface StoredObject {
  data: Buffer;
  size: number;
}

export interface FileStorage {
  upload(file: { name: string; size: number; data: Buffer }, filePath: string): Promise<{ url: string; name: string; size: string }>;
  getUrl(filePath: string): string;
  delete(filePath: string): Promise<void>;
  read(filePath: string): Promise<StoredObject | null>;
}

import { LocalFileStorage } from './local';
import { S3FileStorage } from './s3';

const local = new LocalFileStorage(process.env.UPLOAD_DIR || './server/uploads');

// S3_ENDPOINT terisi -> S3/MinIO. Kosong -> disk lokal (UPLOAD_DIR). URL di DB tetap /api/uploads/..., jadi data lama tetap valid.
function createStorage(): FileStorage {
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) return local;
  const { S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
  if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error('S3_ENDPOINT diset tetapi S3_BUCKET, S3_ACCESS_KEY, atau S3_SECRET_KEY kosong');
  }
  const s3 = new S3FileStorage({
    endpoint,
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  });
  // File yang diunggah sebelum S3 aktif masih ada di disk; baca dari sana bila tidak ada di bucket.
  return {
    upload: (f, p) => s3.upload(f, p),
    getUrl: p => s3.getUrl(p),
    delete: async (p) => { await s3.delete(p); await local.delete(p); },
    read: async p => (await s3.read(p)) ?? local.read(p),
  };
}

export const fileStorage: FileStorage = createStorage();
