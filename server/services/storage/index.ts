import { LocalFileStorage } from './local';
import type { FileStorage } from './index';

export const fileStorage: FileStorage = new LocalFileStorage(
  process.env.UPLOAD_DIR || './server/uploads',
);
