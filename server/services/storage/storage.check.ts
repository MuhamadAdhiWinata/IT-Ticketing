// Cek manual: S3_ENDPOINT=http://localhost:9100 S3_BUCKET=check-bucket S3_ACCESS_KEY=... S3_SECRET_KEY=... npx tsx server/services/storage/storage.check.ts
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-check-'));
process.env.UPLOAD_DIR = dir;
const { fileStorage } = await import('./index');
const key = `uploads/CHECK/${Date.now()}_a.txt`;
const data = Buffer.from('halo s3');

const res = await fileStorage.upload({ name: 'a.txt', size: data.length, data }, key);
assert.equal(res.url, `/api/uploads/${key}`);
assert.deepEqual((await fileStorage.read(key))?.data, data);
assert.equal(await fileStorage.read('uploads/CHECK/tidak-ada.txt'), null);

if (process.env.S3_ENDPOINT) {
  await assert.rejects(fs.stat(path.join(dir, key)), 'mode S3: tidak boleh ada salinan di disk');
  const legacy = 'uploads/CHECK/legacy.txt';
  await fs.mkdir(path.join(dir, 'uploads/CHECK'), { recursive: true });
  await fs.writeFile(path.join(dir, legacy), 'lama');
  assert.equal((await fileStorage.read(legacy))?.data.toString(), 'lama', 'fallback ke disk untuk file lama');
} else {
  assert.equal((await fs.readFile(path.join(dir, key))).toString(), 'halo s3');
}

await fileStorage.delete(key);
assert.equal(await fileStorage.read(key), null);
await fs.rm(dir, { recursive: true, force: true });
console.log(`OK (${process.env.S3_ENDPOINT ? 's3' : 'local'})`);
