import { chromium } from 'playwright-core';
import fs from 'node:fs';

const DIR = '/home/adhinath/Project/it-ticketing-&-work-monitoring/public/icons';
const src = fs.readFileSync(`/tmp/opencode/icon-source.png`).toString('base64');

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');

const render = (size, scale, bg) => page.evaluate(async ({ src, size, scale, bg }) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + src;
  await img.decode();
  const c = document.getElementById('c');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
  const k = (size * scale) / Math.max(img.width, img.height);
  const w = img.width * k, h = img.height * k;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return c.toDataURL('image/png').split(',')[1];
}, { src, size, scale, bg });

const out = {
  'icon-192.png': [192, 0.9, null],
  'icon-512.png': [512, 0.9, null],
  'icon-maskable-512.png': [512, 0.6, '#ffffff'],
};
for (const [name, [size, scale, bg]] of Object.entries(out)) {
  fs.writeFileSync(`${DIR}/${name}`, Buffer.from(await render(size, scale, bg), 'base64'));
  console.log('wrote', name);
}
await browser.close();
