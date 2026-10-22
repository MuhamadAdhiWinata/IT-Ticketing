import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4000';
const OUT = process.env.OUT || '/tmp/opencode/artifacts/after2';
fs.mkdirSync(OUT, { recursive: true });
const res = {};
const note = (k, v) => { res[k] = v; console.log(k, JSON.stringify(v)); };

const userDir = fs.mkdtempSync('/tmp/opencode/pw-profile-');
const ctx = await chromium.launchPersistentContext(userDir, {
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  viewport: { width: 390, height: 844 },
});
const page = ctx.pages()[0] ?? await ctx.newPage();
const issues = [];
page.on('console', (m) => { if (m.type() === 'error') issues.push(`console.error: ${m.text()}`); });
page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => issues.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));

// capture beforeinstallprompt at the page level too, to compare with app state
await page.addInitScript(() => {
  window.__bip = false;
  window.addEventListener('beforeinstallprompt', () => { window.__bip = true; });
});

await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(page);
note('installability.errors', (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors);
note('beforeinstallprompt.fired', await page.evaluate(() => window.__bip));
const btn = await page.getByRole('button', { name: /Install Aplikasi/ }).count();
note('app.installButtonVisible', btn);
await page.screenshot({ path: `${OUT}/login-mobile-install.png` });

// T06 deep link / reload / back-forward (online)
await page.reload({ waitUntil: 'networkidle' });
note('sw.controlled.afterReload', await page.evaluate(() => !!navigator.serviceWorker.controller));
const r1 = await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
note('deeplink /dashboard', { status: r1?.status(), url: page.url() });
await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.goBack({ waitUntil: 'networkidle' });
const backUrl = page.url();
await page.goForward({ waitUntil: 'networkidle' });
note('history', { back: backUrl, forward: page.url() });

// API must never be served from SW cache
const api = await page.evaluate(async () => {
  const r = await fetch('/api/auth/me', { credentials: 'include' });
  return { status: r.status };
});
note('api.auth.me (not cached, expect 401)', api);
const apiCached = await page.evaluate(async () => {
  for (const k of await caches.keys()) {
    for (const r of await (await caches.open(k)).keys()) if (new URL(r.url).pathname.startsWith('/api/')) return r.url;
  }
  return null;
});
note('api.inCache', apiCached);

// offline POST login must fail visibly, not silently
await ctx.setOffline(true);
await page.goto(BASE + '/login', { waitUntil: 'load' });
await page.fill('input[type=email]', 'x@example.com').catch(() => {});
await page.fill('input[type=password]', 'x').catch(() => {});
await page.getByRole('button', { name: /^Masuk$/ }).click().catch(() => {});
await page.waitForTimeout(2000);
note('offline.login.bodyAfterSubmit', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 300));
await page.screenshot({ path: `${OUT}/offline-login-submit.png` });
await ctx.setOffline(false);

fs.writeFileSync(`${OUT}/results2.json`, JSON.stringify(res, null, 2));
fs.writeFileSync(`${OUT}/console2.log`, issues.join('\n'));
console.log('--- issues ---\n' + (issues.join('\n') || '(none)'));
await ctx.close();
