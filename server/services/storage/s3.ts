import {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand,
} from '@aws-sdk/client-s3';
import type { FileStorage, StoredObject } from './index';

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  forcePathStyle: boolean;
}

export class S3FileStorage implements FileStorage {
  private client: S3Client;
  private bucketReady: Promise<void> | null = null;

  constructor(private cfg: S3Config) {
    this.client = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      forcePathStyle: cfg.forcePathStyle,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }

  // Bucket dibuat otomatis saat pertama dipakai; gagal -> dicoba lagi pada permintaan berikutnya.
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= (async () => {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.cfg.bucket }));
      } catch {
        await this.client.send(new CreateBucketCommand({ Bucket: this.cfg.bucket }));
      }
    })().catch((e) => { this.bucketReady = null; throw e; });
    return this.bucketReady;
  }

  async upload(file: { name: string; size: number; data: Buffer }, filePath: string) {
    await this.ensureBucket();
    await this.client.send(new PutObjectCommand({ Bucket: this.cfg.bucket, Key: filePath, Body: file.data }));
    return {
      url: this.getUrl(filePath),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    };
  }

  getUrl(filePath: string): string {
    return `/api/uploads/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: filePath })).catch(() => {});
  }

  async read(filePath: string): Promise<StoredObject | null> {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: filePath }));
      const data = Buffer.from(await res.Body!.transformToByteArray());
      return { data, size: data.length };
    } catch (e: any) {
      if (e?.name === 'NoSuchKey' || e?.name === 'NoSuchBucket' || e?.$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  }
}
