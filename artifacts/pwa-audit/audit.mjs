import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4000';
const OUT = process.env.OUT || '/tmp/opencode/artifacts/before';
fs.mkdirSync(OUT, { recursive: true });

const log = [];
const res = {};
const note = (k, v) => { res[k] = v; console.log(k, JSON.stringify(v)); };

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`console.${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => log.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) log.push(`http ${r.status()}: ${r.url()}`); });

// T01 manifest
const mr = await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
note('login.status', mr.status());
const href = await page.evaluate(() => document.querySelector('link[rel=manifest]')?.href);
note('manifest.link', href);
const m = await page.request.get(href || BASE + '/manifest.webmanifest');
note('manifest.http', { status: m.status(), ct: m.headers()['content-type'] });
const cdp = await ctx.newCDPSession(page);
const am = await cdp.send('Page.getAppManifest');
note('manifest.cdp', { url: am.url, errors: am.errors, parsed: !!am.data });
for (const ic of JSON.parse(await m.text()).icons) {
  const r = await page.request.get(BASE + ic.src);
  note('icon ' + ic.src, { status: r.status(), ct: r.headers()['content-type'], declared: ic.sizes });
}
const ie = await cdp.send('Page.getInstallabilityErrors');
note('installability.errors', ie.installabilityErrors);
await page.screenshot({ path: `${OUT}/login-online.png` });

// T02 service worker
await page.waitForTimeout(3000);
const sw1 = await page.evaluate(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.map((r) => ({ scope: r.scope, active: r.active?.state, script: r.active?.scriptURL }));
});
note('sw.registrations', sw1);
await page.reload({ waitUntil: 'networkidle' });
note('sw.controller', await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null));

// T05 caches
const caches1 = await page.evaluate(async () => {
  const out = {};
  for (const k of await caches.keys()) out[k] = (await (await caches.open(k)).keys()).map((r) => new URL(r.url).pathname);
  return out;
});
note('caches', caches1);

// visit more routes online so they could be cached
for (const p of ['/', '/login']) await page.goto(BASE + p, { waitUntil: 'networkidle' });

// T04 offline
await ctx.setOffline(true);
for (const p of ['/login', '/', '/dashboard']) {
  const pg = await ctx.newPage();
  let status = null, err = null, body = '';
  try {
    const r = await pg.goto(BASE + p, { waitUntil: 'load', timeout: 15000 });
    status = r?.status();
    await pg.waitForTimeout(1500);
    body = (await pg.evaluate(() => document.body.innerText)).slice(0, 120).replace(/\n/g, ' | ');
  } catch (e) { err = e.message.split('\n')[0]; }
  const hasApp = await pg.evaluate(() => !!document.querySelector('#__nuxt')?.children.length).catch(() => false);
  note('offline ' + p, { status, err, hasApp, body });
  await pg.screenshot({ path: `${OUT}/offline-${p.replace(/\//g, '_') || 'root'}.png` }).catch(() => {});
  await pg.close();
}
await ctx.setOffline(false);
await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
note('online-restored.title', await page.title());

fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(res, null, 2));
fs.writeFileSync(`${OUT}/console.log`, log.join('\n'));
console.log('--- console/network issues ---\n' + (log.join('\n') || '(none)'));
await browser.close();
