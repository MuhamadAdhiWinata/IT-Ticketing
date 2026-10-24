// Driver CDP ringkas untuk click-through verifikasi (tanpa dependensi eksternal).
// Jalankan: npx tsx scripts/cdp.ts
import { spawn, ChildProcess } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const PROFILE = join(process.env.TEMP || '/tmp', 'cdp-profile-it-ticketing');
const BASE = process.env.BASE_URL || 'http://localhost:3001';

export async function launchChrome(): Promise<ChildProcess> {
  if (existsSync(PROFILE)) rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(PROFILE, { recursive: true });
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    '--remote-allow-origins=*',
    'about:blank',
  ], { stdio: 'ignore' });

  // Tunggu endpoint CDP siap.
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return proc;
    } catch { /* belum siap */ }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Chrome CDP tidak siap dalam 20 detik');
}

export interface Page {
  ws: WebSocket;
  send<T = any>(method: string, params?: any): Promise<T>;
  on(evt: string, cb: (p: any) => void): void;
}

export async function newPage(url = 'about:blank'): Promise<Page> {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await res.json();
  return connect(target.webSocketDebuggerUrl);
}

export async function attachFirstPage(): Promise<Page> {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const list = await res.json();
  const page = list.find((t: any) => t.type === 'page');
  if (!page) throw new Error('tidak ada target halaman');
  return connect(page.webSocketDebuggerUrl);
}

function connect(url: string): Promise<Page> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
    const listeners = new Map<string, Set<(p: any) => void>>();

    ws.onopen = () => {
      const page: Page = {
        ws,
        async send<T = any>(method: string, params: any = {}) {
          const msgId = ++id;
          return new Promise<T>((res, rej) => {
            pending.set(msgId, { res, rej });
            ws.send(JSON.stringify({ id: msgId, method, params }));
          });
        },
        on(evt, cb) {
          if (!listeners.has(evt)) listeners.set(evt, new Set());
          listeners.get(evt)!.add(cb);
        },
      };
      resolve(page);
    };
    ws.onerror = (e) => reject(new Error('WebSocket error'));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id)!;
        pending.delete(msg.id);
        msg.error ? p.rej(new Error(`${msg.error.message}`)) : p.res(msg.result);
        return;
      }
      if (msg.method) {
        listeners.get(msg.method)?.forEach(cb => cb(msg.params));
      }
    };
  });
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export { BASE, PORT };
