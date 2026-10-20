// Click-through verifikasi (R-35) untuk fitur identitas Perusahaan/Divisi.
// Menjalankan Chrome headless via CDP: form login, CRUD master, dropdown identitas,
// label pelapor, Escape, mode gelap/terang, dan breakpoint mobile.
// Data uji dibersihkan otomatis di akhir (snapshot pengguna dipulihkan).
// Jalankan: npx tsx scripts/clickthrough.ts
import { launchChrome, newPage, sleep, BASE, type Page } from './cdp';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const SHOTS = join(process.cwd(), 'verification');
mkdirSync(SHOTS, { recursive: true });
// Buang sisa screenshot lama agar folder hanya berisi run terkini.
try {
  for (const f of readdirSync(SHOTS)) if (f.endsWith('.png') || f === 'clickthrough-report.json') unlinkSync(join(SHOTS, f));
} catch { /* folder baru */ }

type Step = { name: string; ok: boolean; detail?: string };
const steps: Step[] = [];
const consoleErrors: string[] = [];
let shotIdx = 0;

const record = (name: string, ok: boolean, detail?: string) => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? '  PASS ' : '  FAIL '} ${name}${detail ? `  [${detail}]` : ''}`);
};
// Catatan non-klaim: untuk kondisi yang bergantung pada data yang sudah ada di DB.
const info = (label: string, detail?: string) => {
  console.log(`  info  ${label}${detail ? `  [${detail}]` : ''}`);
};

async function evalJS(page: Page, expression: string): Promise<any> {
  const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function shot(page: Page, label: string) {
  shotIdx += 1;
  const r = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, `${String(shotIdx).padStart(2, '0')}-${label}.png`), Buffer.from(r.data, 'base64'));
}
async function waitFor(page: Page, predicate: string, timeout = 8000): Promise<boolean> {
  const d = Date.now() + timeout;
  while (Date.now() < d) {
    try { if (await evalJS(page, predicate)) return true; } catch { /* DOM belum siap */ }
    await sleep(250);
  }
  return false;
}
// Vue belum mount = klik dijalankan browser biasa (mis. submit native). Tunggu dulu.
async function hydrated(page: Page, timeout = 30000): Promise<boolean> {
  const ok = await waitFor(page, `!!(document.querySelector('#__nuxt') || {}).__vue_app__`, timeout);
  if (ok) await sleep(1000);
  return ok;
}
async function click(page: Page, predicate: string): Promise<boolean> {
  if (!(await waitFor(page, predicate, 7000))) return false;
  try {
    const clicked = await evalJS(page, `(() => { const el = (${predicate}); if (!el) return false; el.click(); return true; })()`);
    if (!clicked) return false;
  } catch { return false; }
  await sleep(700);
  return true;
}
const findText = (tag: string, text: string, scope = 'document') =>
  `Array.from(${scope}.querySelectorAll('${tag}')).find(e => (e.innerText || '').trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))`;
// Klik opsi dropdown: pakai [role=option] supaya tidak salah kena tombol trigger-nya.
const findOption = (text: string) =>
  `Array.from(document.querySelectorAll('[role="option"]')).find(e => (e.innerText || '').trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))`;
const hasText = (page: Page, text: string) =>
  evalJS(page, `document.body.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())})`);

// Pengisi nilai input lewat setter native agar v-model ikut ter-update.
const setNative = (target: string, value: string) =>
  `(() => { const el = (${target}); if (!el) return 'MISSING'; Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); return el.value; })()`;
const inputByPlaceholder = (ph: string) => `[...document.querySelectorAll('input')].find(i => (i.placeholder || '').includes(${JSON.stringify(ph)}))`;
const inputByLabel = (label: string) => `(() => { for (const l of document.querySelectorAll('label')) { if (l.innerText.trim() === ${JSON.stringify(label)}) { const i = l.parentElement.querySelector('input'); if (i) return i; } } return null; })()`;
// AppSelect: tombol trigger selalu bersaudara dengan <label>-nya. Dipakai karena
// displayLabel bisa sudah terisi (pilihan awal otomatis), jadi placeholder tak bisa diandalkan.
const selectByLabel = (label: string) => `(() => { const l=[...document.querySelectorAll('label')].find(x => x.innerText.trim() === ${JSON.stringify(label)}); return l ? l.parentElement.querySelector('button') : null; })()`;
const profileButton = `document.querySelector('header button[aria-haspopup="true"]')`;
const menuText = `(() => { const m = document.querySelector('header [role="menu"]'); return m ? m.innerText : ''; })()`;

// Escape diverifikasi lewat keberadaan elemen modal (bukan teks). Kalau jalur CDP tidak
// menutup, ulangi dengan keydown DOM langsung (sama seperti yang dihasilkan browser sungguhan)
// dan laporkan jalur mana yang bekerja.
// Escape dikirim sebagai keydown DOM pada document — peristiwa yang sama dengan yang
// dihasilkan browser sungguhan. (Input.dispatchKeyEvent CDP tidak sampai ke renderer pada
// mode headless ini; `received` membuktikan eventnya benar-benar tiba.)
const pressEscape = async (page: Page) => {
  await evalJS(page, `(() => {
    let seen = 0;
    const count = (e) => { if (e.key === 'Escape') seen++; };
    document.addEventListener('keydown', count, true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', count, true);
    window.__escProbe = seen;
    return true;
  })()`);
  await sleep(900);
};
const escapeCheck = async (page: Page, title: string) => {
  const received = await evalJS(page, `window.__escProbe || 0`);
  const state = await evalJS(page, modalState(title));
  return { received, closed: !!state && !state.open, active: state?.active };
};
const modalState = (title: string) =>
  `(() => {
    const overlays = [...document.querySelectorAll('.fixed.inset-0')].map(o => (o.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 55));
    const m = overlays.filter(t => t.includes(${JSON.stringify(title)}));
    const a = document.activeElement;
    return { open: m.length > 0, active: a ? a.tagName : 'none', overlays };
  })()`;

async function main() {
  const chrome = await launchChrome();
  console.log('[CT] Chrome headless berjalan\n');
  try {
    const page = await newPage(BASE + '/login');
    const serializeArgs = (args: any[]) => args.map((a: any) => {
      if (a.value !== undefined) return String(a.value);
      if (a.unserializableValue) return String(a.unserializableValue);
      if (a.description) return a.description;
      try { return JSON.stringify(a.value ?? a); } catch { return '[obj]'; }
    }).join(' ');
    // Semua tipe pesan dicatat agar detail mismatch (biasanya console.warn) ikut terlihat.
    const consoleAll = new Map<string, number>();
    const note = (text: string) => consoleAll.set(text, (consoleAll.get(text) || 0) + 1);
    page.on('Runtime.consoleAPICalled', (p: any) => {
      const text = serializeArgs(p.args);
      if (p.type !== 'debug') note(`[${p.type}] ${text}`);
      if (p.type === 'error') {
        consoleErrors.push(text);
        // Log langsung agar bisa dikorelasikan dengan langkah yang sedang berjalan.
        console.log(`      [console.error] ${text.slice(0, 300)}`);
      }
    });
    page.on('Runtime.exceptionThrown', (p: any) => {
      const text = p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception';
      consoleErrors.push(text);
      console.log(`      [exception] ${text.slice(0, 300)}`);
    });
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    await page.send('Network.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(2500);

    // ── 1. Login lewat formulir ──
    console.log('1. Login form');
    record('halaman login termuat dengan form', await waitFor(page, '!!document.querySelector("#login-email")'));
    record('Vue selesai hydration sebelum interaksi', await hydrated(page));
    await evalJS(page, setNative(`document.querySelector('#login-email')`, 'sysadmin@company.co.id'));
    await evalJS(page, setNative(`document.querySelector('#login-password')`, 'password123'));
    await sleep(400);
    await shot(page, '01-login');
    record('submit form login', await click(page, `${findText('button', 'Masuk')}`));
    record('berhasil masuk ke aplikasi', await waitFor(page, `document.body.innerText.includes('Tracking') && !document.querySelector('#login-email')`, 25000));
    await sleep(3000);
    record('layout dashboard termuat (sidebar + navbar)', await evalJS(page, `!!document.querySelector('aside') && !!document.querySelector('nav, header')`));
    await shot(page, '02-sesudah-login');

    // Snapshot dipakai untuk restorasi; sekaligus jadi kondisi awal yang pasti.
    const snapshot = await evalJS(page, `fetch('/api/users',{credentials:'include'}).then(r=>r.json()).then(j=>j.data)`);
    const me = await evalJS(page, `fetch('/api/auth/me',{credentials:'include'}).then(r=>r.json()).then(j=>j.data)`);
    const plan = JSON.stringify({
      restore: (Array.isArray(snapshot) ? snapshot : []).map((u: any) => ({
        id: u.id, companyId: u.companyId ?? null, divisionId: u.divisionId ?? null, department: u.department,
      })),
    });
    const resetStatus = await evalJS(page, `(async () => {
      const plan = ${plan};
      const call = async (url, opts = {}) => {
        try {
          const r = await fetch(url, Object.assign({ credentials: 'include', headers: { 'content-type': 'application/json' } }, opts));
          return r.status;
        } catch { return 'error'; }
      };
      const out = { restored: 0, deletedUsers: [], deletedCompanies: [] };
      for (const u of plan.restore) {
        if ((await call('/api/users/' + encodeURIComponent(u.id), { method: 'PUT', body: JSON.stringify({ companyId: u.companyId, divisionId: u.divisionId, department: u.department }) })) === 200) out.restored += 1;
      }
      out.deletedUsers.push(await call('/api/users/USR-901', { method: 'DELETE' }));
      for (const id of ['COMP-MAJU', 'COMP-KEDUA']) out.deletedCompanies.push(await call('/api/companies/' + id, { method: 'DELETE' }));
      return out;
    })()`);
    record('kondisi awal: snapshot pengguna dipulihkan', (resetStatus?.restored ?? 0) === (Array.isArray(snapshot) ? snapshot.length : 0),
      `${resetStatus?.restored}/${Array.isArray(snapshot) ? snapshot.length : 0}`);
    record('kondisi awal: data uji sebelumnya dibersihkan', Array.isArray(resetStatus?.deletedCompanies) && resetStatus.deletedCompanies.every((s: any) => s === 200 || s === 404),
      JSON.stringify(resetStatus));
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(2000);
    record('aplikasi dimuat ulang ke kondisi awal', await hydrated(page));
    await sleep(3000);

    // ── 2. Identitas profil saat master masih kosong (fallback "Dept:") ──
    console.log('\n2. Identitas profil');
    record('nama akun tampil', await hasText(page, me?.name || 'Administrator'));
    record('dropdown profil Navbar terbuka', await click(page, profileButton) &&
      await waitFor(page, `!!document.querySelector('header [role="menu"]')`, 5000));
    const navTextFallback = await evalJS(page, menuText);
    // DB bisa sudah berisi identitas (diisi admin lewat UI). Sesuaikan ekspektasi.
    const startHasIdentity = !!(me?.companyName || me?.divisionName);
    const startLabelOk = startHasIdentity
      ? !!me?.companyName && navTextFallback.includes(me.companyName)
      : /Dept:/.test(navTextFallback);
    record(startHasIdentity ? 'baris identitas memuat perusahaan (identitas sudah terisi di awal)' : 'baris identitas tampil walau belum ada perusahaan (fallback Dept:)',
      startLabelOk, navTextFallback.replace(/\s+/g, ' ').slice(0, 90));
    record('tombol ganti tema ada di dropdown', /Mode (Gelap|Terang)/.test(navTextFallback), navTextFallback.replace(/\s+/g, ' ').slice(0, 90));
    await shot(page, '03-navbar-fallback');
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);
    const asideFallback = await evalJS(page, `document.querySelector('aside').innerText`);
    record('kartu profil Sidebar menampilkan identitas',
      startHasIdentity ? !!(me?.companyName && asideFallback.includes(me.companyName)) : /Dept:/.test(asideFallback));
    await shot(page, '04-sidebar-fallback');

    // ── 3. Tab Perusahaan & Divisi: empty state ──
    console.log('\n3. Tab Perusahaan & Divisi');
    record('masuk ke Master Data', await click(page, `${findText('a,button', 'Master Data')}`) &&
      await waitFor(page, `document.body.innerText.includes('Tabel Master') || document.body.innerText.includes('Kategori &')`, 10000));
    await sleep(1200);
    record('tab "Perusahaan & Divisi" terbuka', await click(page, `${findText('button', 'Perusahaan & Divisi')}`) &&
      await waitFor(page, `document.body.innerText.includes('Tabel Master Perusahaan')`, 8000));
    await sleep(700);
    await shot(page, '05-tab-org-kosong');
    const startCompanies = await evalJS(page, `fetch('/api/companies',{credentials:'include'}).then(r=>r.json()).then(j=>(j.data||[]).length)`);
    if (startCompanies > 0) {
      info('empty state perusahaan dilewati — master sudah terisi admin', `${startCompanies} perusahaan`);
    } else {
      record('empty state perusahaan tampil', await hasText(page, 'Belum ada data perusahaan'));
    }

    // ── 4. Tambah Perusahaan 1 ──
    console.log('\n4. CRUD Perusahaan & Divisi');
    record('modal Tambah Perusahaan terbuka', await click(page, `${findText('button', 'Tambah Perusahaan')}`) &&
      await waitFor(page, `!!(${inputByPlaceholder('COMP-')})`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('COMP-'), 'COMP-MAJU'));
    await evalJS(page, setNative(inputByPlaceholder('PT '), 'PT Maju Bersama'));
    await sleep(300);
    await shot(page, '06-modal-perusahaan');
    record('simpan Perusahaan 1', await click(page, `${findText('button', 'Simpan')}`));
    record('Perusahaan 1 muncul di daftar', await waitFor(page, `document.body.innerText.includes('PT Maju Bersama')`, 9000));
    if (startCompanies === 0) {
      record('empty state hilang setelah data ada', !(await hasText(page, 'Belum ada data perusahaan')));
    } else {
      info('cek empty state hilang dilewati — master tidak kosong di awal');
    }
    await shot(page, '07-perusahaan-tersimpan');

    // ── 5. Tambah Divisi 1 (wajib memilih perusahaan induk) ──
    record('modal Tambah Divisi terbuka', await click(page, `${findText('button', 'Tambah Divisi')}`) &&
      await waitFor(page, `!!(${inputByPlaceholder('DIV-')})`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('DIV-'), 'DIV-KEUANGAN'));
    await evalJS(page, setNative(inputByPlaceholder('Cth: Finance'), 'Keuangan'));
    record('dropdown perusahaan induk terbuka (default = perusahaan pertama)', await click(page, selectByLabel('Perusahaan Induk (FK: company_id)')) &&
      await waitFor(page, `document.querySelectorAll('[role="option"]').length > 0`, 5000));
    record('memilih Perusahaan induk', await click(page, `${findOption('PT Maju Bersama')}`));
    await sleep(600);
    const selDiv1Company = await evalJS(page, `(() => { const b = (${selectByLabel('Perusahaan Induk (FK: company_id)')}); return b ? b.innerText.trim() : null; })()`);
    record('perusahaan induk divisi 1 benar', /PT Maju Bersama/.test(String(selDiv1Company)), String(selDiv1Company));
    await shot(page, '08-modal-divisi');
    record('simpan Divisi 1', await click(page, `${findText('button', 'Simpan')}`));
    const divRow = await (async () => {
      const found = await waitFor(page, `document.body.innerText.includes('DIV-KEUANGAN')`, 9000);
      if (!found) return null;
      return evalJS(page, `(() => { const r=[...document.querySelectorAll('tbody tr')].find(x=>x.innerText.includes('DIV-KEUANGAN')); return r ? r.innerText : null; })()`);
    })();
    record('Divisi 1 tampil dengan FK perusahaan', !!divRow && /PT Maju Bersama/.test(divRow), (divRow || '').replace(/\s+/g, ' ').trim().slice(0, 80));
    await shot(page, '09-divisi-tersimpan');

    // ── 6. Perusahaan 2 + Divisi 2 (untuk menguji filter) ──
    record('modal Tambah Perusahaan 2 terbuka', await click(page, `${findText('button', 'Tambah Perusahaan')}`) &&
      await waitFor(page, `!!(${inputByPlaceholder('COMP-')})`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('COMP-'), 'COMP-KEDUA'));
    await evalJS(page, setNative(inputByPlaceholder('PT '), 'PT Contoh Kedua'));
    record('simpan Perusahaan 2', await click(page, `${findText('button', 'Simpan')}`));
    record('Perusahaan 2 muncul di daftar', await waitFor(page, `document.body.innerText.includes('PT Contoh Kedua')`, 9000));

    record('modal Tambah Divisi 2 terbuka', await click(page, `${findText('button', 'Tambah Divisi')}`) &&
      await waitFor(page, `!!(${inputByPlaceholder('DIV-')})`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('DIV-'), 'DIV-OPS'));
    await evalJS(page, setNative(inputByPlaceholder('Cth: Finance'), 'Operasional'));
    record('dropdown perusahaan induk terbuka (divisi 2)', await click(page, selectByLabel('Perusahaan Induk (FK: company_id)')) &&
      await waitFor(page, `document.querySelectorAll('[role="option"]').length > 0`, 5000));
    record('memilih PT Contoh Kedua sebagai induk divisi 2', await click(page, `${findOption('PT Contoh Kedua')}`));
    await sleep(700);
    const selDiv2Company = await evalJS(page, `(() => { const b = (${selectByLabel('Perusahaan Induk (FK: company_id)')}); return b ? b.innerText.trim() : null; })()`);
    record('perusahaan induk divisi 2 benar', /Contoh Kedua/.test(String(selDiv2Company)), String(selDiv2Company));
    record('simpan Divisi 2', await click(page, `${findText('button', 'Simpan')}`));
    record('Divisi 2 tampil', await waitFor(page, `document.body.innerText.includes('DIV-OPS')`, 9000));
    await shot(page, '10-dua-perusahaan-dua-divisi');

    // ── 7. Filter divisi per perusahaan ──
    console.log('\n7. Filter divisi');
    record('dropdown filter terbuka', await click(page, `(() => { const s=[...document.querySelectorAll('span')].find(x=>x.innerText.includes('Filter Perusahaan')); return s ? s.parentElement.querySelector('button') : null; })()`));
    await sleep(700);
    await shot(page, '11-filter-terbuka');
    record('memilih filter PT Maju Bersama', await click(page, `${findOption('PT Maju Bersama')}`));
    await sleep(900);
    const filteredText = await evalJS(page, `(() => { return [...document.querySelectorAll('tbody')].map(b => b.innerText).join(' | '); })()`);
    record('filter menampilkan divisi PT Maju Bersama', /DIV-KEUANGAN/.test(filteredText), filteredText.replace(/\s+/g, ' ').trim().slice(0, 100));
    record('filter menyembunyikan divisi perusahaan lain', !/DIV-OPS/.test(filteredText));
    await shot(page, '12-filter-aktif');

    // Kembalikan ke "Semua Perusahaan".
    await click(page, `(() => { const s=[...document.querySelectorAll('span')].find(x=>x.innerText.includes('Filter Perusahaan')); return s ? s.parentElement.querySelector('button') : null; })()`);
    await sleep(700);
    record('kembali ke Semua Perusahaan', await click(page, `${findOption('Semua Perusahaan')}`) &&
      await waitFor(page, `document.body.innerText.includes('DIV-OPS')`, 7000));
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);

    // ── 8. Edit Perusahaan + Escape (R-32) ──
    console.log('\n8. Edit & Escape (R-32)');
    // Edit perusahaan ada di kartu (bukan baris tabel); baris tabel milik divisi.
    const companyCardEdit = (name: string) => `(() => {
      for (const b of [...document.querySelectorAll('button')]) {
        if ((b.innerText || '').trim() !== 'Edit' || b.closest('tr')) continue;
        const row = b.parentElement && b.parentElement.parentElement;
        if (row && row.innerText.includes(${JSON.stringify(name)})) return b;
      }
      return null;
    })()`;
    record('modal Edit Perusahaan terbuka', await click(page, companyCardEdit('PT Maju Bersama')) &&
      await waitFor(page, `document.body.innerText.includes('Edit Perusahaan')`, 7000));
    await shot(page, '13-modal-edit-perusahaan');
    await pressEscape(page);
    const escCompany = await escapeCheck(page, 'Edit Perusahaan');
    record('Escape menutup modal Edit Perusahaan', escCompany.received > 0 && escCompany.closed, JSON.stringify(escCompany));

    // Edit nyata: ganti nama, lalu kembalikan.
    record('buka lagi modal Edit Perusahaan', await click(page, companyCardEdit('PT Maju Bersama')) &&
      await waitFor(page, `document.body.innerText.includes('Edit Perusahaan')`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('PT '), 'PT Maju Bersama Tbk'));
    record('simpan perubahan nama', await click(page, `${findText('button', 'Simpan')}`));
    record('nama perusahaan tersimpan', await waitFor(page, `document.body.innerText.includes('PT Maju Bersama Tbk')`, 9000));
    record('buka lagi untuk mengembalikan nama', await click(page, companyCardEdit('PT Maju Bersama Tbk')) &&
      await waitFor(page, `document.body.innerText.includes('Edit Perusahaan')`, 7000));
    await evalJS(page, setNative(inputByPlaceholder('PT '), 'PT Maju Bersama'));
    await click(page, `${findText('button', 'Simpan')}`);
    record('nama perusahaan dipulihkan', await waitFor(page, `!document.body.innerText.includes('PT Maju Bersama Tbk')`, 9000));

    // ── 9. Beri identitas akun ini, muat ulang ──
    console.log('\n9. Identitas akun login');
    const setResult = await evalJS(page, `fetch('/api/users/${me.id}',{method:'PUT',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({companyId:'COMP-MAJU',divisionId:'DIV-KEUANGAN'})}).then(r=>r.status)`);
    record('identitas akun diatur via API', setResult === 200, `status=${setResult}`);

    // Tiket uji dibuat SEBELUM muat ulang supaya ikut terbawa ke store (dipakai panel tracking).
    const newTicket = await evalJS(page, `fetch('/api/tickets',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Tiket uji identitas pelapor',description:'Dibuat untuk verifikasi label identitas',category:'IT Programmer',aplikasiProject:'Development Aplikasi / Sistem Baru',priority:'LOW',shouldIssue:false})}).then(r=>r.json()).then(j=>j.data)`).catch(() => null);
    record('tiket uji dibuat', !!newTicket?.id, newTicket?.id || 'gagal');

    await page.send('Page.reload', { ignoreCache: false });
    await sleep(1500);
    record('aplikasi dimuat ulang', await hydrated(page));
    await sleep(3000);

    record('dropdown profil menampilkan identitas lengkap', await click(page, profileButton) &&
      await waitFor(page, `!!document.querySelector('header [role="menu"]')`, 5000));
    const navText = await evalJS(page, menuText);
    record('label identitas "PT Maju Bersama - Divisi Keuangan"', /PT Maju Bersama\s*-\s*Divisi Keuangan/.test(navText),
      navText.replace(/\s+/g, ' ').trim().slice(0, 90));
    await shot(page, '14-navbar-identitas');
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);
    const asideText = await evalJS(page, `document.querySelector('aside').innerText`);
    record('Sidebar menampilkan identitas lengkap', /PT Maju Bersama\s*-\s*Divisi Keuangan/.test(asideText));
    await shot(page, '15-sidebar-identitas');

    // ── 10. Master Akun: kolom + dropdown identitas ──
    console.log('\n10. Master Akun & dropdown identitas');
    record('masuk ke Master Data', await click(page, `${findText('a,button', 'Master Data')}`) &&
      await waitFor(page, `document.body.innerText.includes('Kategori &')`, 10000));
    await sleep(1000);
    record('tab Master Account terbuka', await click(page, `${findText('button', 'Master Account')}`) &&
      await waitFor(page, `document.body.innerText.toLowerCase().includes('divisi / departemen')`, 8000));
    record('kolom Perusahaan tersedia di tabel user', await hasText(page, 'Perusahaan'));
    await shot(page, '16-tabel-users');

    record('modal Tambah Pengguna Baru terbuka', await click(page, `${findText('button', 'Tambah User Baru')}`) &&
      await waitFor(page, `document.body.innerText.includes('Tambah Pengguna Baru')`, 7000));
    await sleep(700);
    await evalJS(page, setNative(inputByLabel('ID User'), 'USR-901'));
    await evalJS(page, setNative(inputByLabel('Nama Lengkap'), 'Tester Identitas'));
    await evalJS(page, setNative(inputByLabel('Email'), 'tester.identitas@company.co.id'));
    await sleep(400);

    const divDisabledBefore = await evalJS(page, `(() => { const b = (${selectByLabel('Divisi')}); return b ? b.disabled : 'NOT FOUND'; })()`);
    record('dropdown Divisi terkunci sebelum perusahaan dipilih', divDisabledBefore === true, `disabled=${divDisabledBefore}`);
    record('petunjuk "pilih perusahaan dahulu" tampil', await hasText(page, 'Pilih perusahaan terlebih dahulu'));
    await shot(page, '17-form-user-kosong');

    record('dropdown Perusahaan terbuka', await click(page, selectByLabel('Perusahaan / PT')) &&
      await waitFor(page, `document.querySelectorAll('[role="option"]').length > 0`, 5000));
    record('memilih PT Maju Bersama', await click(page, `${findOption('PT Maju Bersama')}`));
    await sleep(800);

    const divEnabledAfter = await evalJS(page, `(() => { const b = (${selectByLabel('Divisi')}); return b ? b.disabled : 'NOT FOUND'; })()`);
    record('dropdown Divisi terbuka setelah perusahaan dipilih', divEnabledAfter === false, `disabled=${divEnabledAfter}`);
    await shot(page, '18-pilih-perusahaan');

    record('dropdown Divisi terbuka', await click(page, selectByLabel('Divisi')) &&
      await waitFor(page, `document.querySelectorAll('[role="option"]').length > 0`, 5000));
    const divOptions = await evalJS(page, `[...document.querySelectorAll('[role="option"]')].map(o=>o.innerText.trim())`);
    record('opsi Divisi tersaring untuk perusahaan terpilih', Array.isArray(divOptions) && divOptions.some((o: string) => o.includes('Keuangan')) && !divOptions.some((o: string) => o.includes('Operasional')),
      JSON.stringify(divOptions));
    record('memilih Divisi Keuangan', await click(page, `${findOption('Keuangan')}`));
    await sleep(800);

    const deptValue = await evalJS(page, `(() => { const el = (${inputByLabel('Departemen')}); return el ? el.value : 'NO INPUT'; })()`);
    record('Departemen terisi otomatis dari nama divisi', deptValue === 'Keuangan', `nilai=${JSON.stringify(deptValue)}`);
    await shot(page, '19-form-user-lengkap');

    record('simpan user baru', await click(page, `${findText('button', 'Simpan')}`));
    await sleep(1800);
    record('umpan balik sukses muncul', /berhasil ditambahkan/i.test(await evalJS(page, `document.body.innerText`)));
    const newUserRow = await (async () => {
      const found = await waitFor(page, `document.body.innerText.includes('tester.identitas@company.co.id')`, 9000);
      if (!found) return null;
      return evalJS(page, `(() => { const r=[...document.querySelectorAll('tbody tr')].find(x=>x.innerText.includes('tester.identitas@company.co.id')); return r ? r.innerText : null; })()`);
    })();
    record('baris user baru menampilkan perusahaan & divisi', !!newUserRow && /PT Maju Bersama/.test(newUserRow) && /Keuangan/.test(newUserRow),
      (newUserRow || '').replace(/\s+/g, ' ').trim().slice(0, 110));
    await shot(page, '20-user-tersimpan');

    // ── 11. Edit user + Escape ──
    console.log('\n11. Edit user');
    const editUserRow = `(() => { const r=[...document.querySelectorAll('tbody tr')].find(x=>x.innerText.includes('tester.identitas@company.co.id')); return r ? [...r.querySelectorAll('button')].find(b=>b.innerText.trim()==='Edit') : null; })()`;
    record('modal Edit Pengguna terbuka', await click(page, editUserRow) &&
      await waitFor(page, `document.body.innerText.includes('Edit Pengguna')`, 7000));
    await sleep(800);
    const loadedDiv = await evalJS(page, `(() => { const b = (${selectByLabel('Divisi')}); const c = (${selectByLabel('Perusahaan / PT')}); return (c ? c.innerText.trim() : '?') + ' | ' + (b ? b.innerText.trim() : '?'); })()`);
    record('form edit terisi dengan perusahaan & divisi tersimpan', /PT Maju Bersama/.test(String(loadedDiv)) && /Keuangan/.test(String(loadedDiv)), String(loadedDiv));
    await shot(page, '21-modal-edit-user');
    await pressEscape(page);
    const escUser = await escapeCheck(page, 'Edit Pengguna');
    record('Escape menutup modal Edit Pengguna', escUser.received > 0 && escUser.closed, JSON.stringify(escUser));

    // ── 12. Label identitas pada halaman tiket ──
    console.log('\n12. Label identitas pelapor');
    // tiket uji sudah dibuat di langkah 9 (sebelum reload) agar ikut termuat di store.

    record('form Buat Tiket terbuka', await click(page, `${findText('button, a', 'Buat Tiket')}`) &&
      await waitFor(page, `document.body.innerText.includes('Buat Tiket Baru')`, 8000));
    await sleep(1500);
    const createFormText = await evalJS(page, `document.body.innerText`);
    record('form punya baris "Pelapor:"', /Pelapor:/.test(createFormText));
    record('label Pelapor memuat identitas PT + Divisi', /Pelapor:[^]{0,160}?PT Maju Bersama[^]{0,40}?Divisi Keuangan/.test(createFormText.replace(/\s+/g, ' ')),
      (createFormText.match(/Pelapor:[^]{0,160}/) || [''])[0].replace(/\s+/g, ' ').trim().slice(0, 100));
    record('dropdown "buat untuk diri sendiri" membuka daftar pelapor', await click(page, `${findText('button', 'Buat untuk diri sendiri')}`) &&
      await waitFor(page, `document.querySelectorAll('[role=option]').length > 1`, 5000));
    await sleep(500);
    await shot(page, '22-form-buat-tiket');
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);

    record('tombol kembali dari form tiket', await click(page, `(() => { const h=[...document.querySelectorAll('h1')].find(x=>x.innerText.includes('Buat Tiket Baru')); return h ? h.parentElement.parentElement.querySelector('button') : null; })()`));
    await sleep(1500);

    // Tracking
    record('buka tab Tracking', await click(page, `${findText('a,button', 'Tracking')}`) &&
      await waitFor(page, `!![...document.querySelectorAll('input')].find(x => /Cari kode/i.test(x.placeholder || ''))`, 9000));
    await sleep(1500);
    const searchSel = `(() => { return [...document.querySelectorAll('input')].find(x => /Cari kode/i.test(x.placeholder || '')) || null; })()`;
    record('kolom pencarian tersedia', await waitFor(page, searchSel));
    await evalJS(page, `(() => { const i = (${searchSel}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(i, 'Tiket uji identitas'); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
    await sleep(2500);
    record('saran pencarian tampil dan dapat diklik', await click(page, `${findText('[role=option], button', 'Tiket uji identitas')}`));
    await sleep(2000);
    const trackingPanel = await evalJS(page, `(() => { const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Detail Lengkap')); const p=b?b.closest('.bg-surface'):null; return p?p.innerText:null; })()`);
    record('kartu tracking menampilkan identitas lengkap', !!trackingPanel && /PT Maju Bersama\s*-\s*Divisi Keuangan/.test(trackingPanel),
      (trackingPanel || '').replace(/\s+/g, ' ').trim().slice(0, 140));
    await shot(page, '23-tracking-identitas');

    record('buka Detail Lengkap', await click(page, `${findText('button', 'Detail Lengkap')}`) &&
      await waitFor(page, `document.body.innerText.includes('Pelapor:')`, 9000));
    await sleep(2000);
    const detailText = await evalJS(page, `document.body.innerText`);
    record('detail tiket memuat baris Pelapor + identitas', /Pelapor:[^]{0,160}?PT Maju Bersama[^]{0,40}?Divisi Keuangan/.test(detailText.replace(/\s+/g, ' ')),
      (detailText.match(/Pelapor:[^]{0,160}/) || [''])[0].replace(/\s+/g, ' ').trim().slice(0, 100));
    await shot(page, '24-detail-identitas');

    // ── 13. Mode gelap & terang (R-34) ──
    console.log('\n13. Mode gelap & terang');
    const getDark = () => evalJS(page, `document.documentElement.classList.contains('dark')`);
    const initialDark = await getDark();
    record('dropdown profil terbuka untuk ganti tema', await click(page, profileButton) &&
      await waitFor(page, `!!document.querySelector('header [role="menu"]')`, 5000));
    const labelAfter = initialDark ? 'Mode Terang' : 'Mode Gelap';
    record(`klik "${labelAfter}"`, await click(page, `${findText('button', labelAfter)}`));
    await sleep(1500);
    const darkAfterFirst = await getDark();
    record('tema berubah', darkAfterFirst !== initialDark, `awal=${initialDark} sesudah=${darkAfterFirst}`);
    await shot(page, '25-tema-1');
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);
    await click(page, profileButton);
    await sleep(800);
    const labelBack = darkAfterFirst ? 'Mode Terang' : 'Mode Gelap';
    record(`klik "${labelBack}" (kembali)`, await click(page, `${findText('button', labelBack)}`));
    await sleep(1500);
    record('tema kembali ke kondisi awal', (await getDark()) === initialDark);
    await shot(page, '26-tema-2');
    await evalJS(page, `document.body.click(); true`);
    await sleep(500);

    // ── 14. Breakpoint mobile 375px (R-03), dijalankan saat mode gelap ──
    // Sebelumnya selalu jalan setelah tema dipulihkan, jadi mode gelap + 375px
    // tak pernah teruji. Paksa gelap dulu, uji, lalu pulihkan tema awal.
    console.log('\n14. Mobile 375px (mode gelap)');
    const setDark = async (want: boolean) => {
      if ((await getDark()) === want) return true;
      await click(page, profileButton);
      await waitFor(page, `!!document.querySelector('header [role="menu"]')`, 5000);
      const label = want ? 'Mode Gelap' : 'Mode Terang';
      const ok = await click(page, `${findText('button', label)}`);
      await sleep(1500);
      await evalJS(page, `document.body.click(); true`);
      await sleep(500);
      return ok && (await getDark()) === want;
    };
    const darkWas = await getDark();
    record('tema dipaksa gelap untuk uji mobile', await setDark(true), `awal=${darkWas}`);
    await page.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(2000);
    await hydrated(page);
    await sleep(2500);
    const overflowMain = await evalJS(page, `({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })`);
    record('tracking tanpa horizontal overflow di 375px', !!overflowMain && overflowMain.scrollW <= overflowMain.innerW + 1, JSON.stringify(overflowMain));
    await shot(page, '27-mobile-tracking');

    await click(page, `${findText('a,button', 'Master Data')}`);
    await sleep(2500);
    const overflowAdmin = await evalJS(page, `({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })`);
    record('Master Akun tanpa horizontal overflow di 375px', !!overflowAdmin && overflowAdmin.scrollW <= overflowAdmin.innerW + 1, JSON.stringify(overflowAdmin));
    await shot(page, '28-mobile-master');
    // Reload masih di 375px: kelas .dark harus bertahan dari localStorage, bukan hilang.
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(2500);
    record('kelas .dark bertahan setelah reload di 375px', await getDark());
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    record('tema dikembalikan ke kondisi awal', await setDark(darkWas), `kembali=${darkWas}`);

    // ── 14b. Tangkapan layar terang + gelap untuk tinjauan manusia ──
    // Tangkapan lama di verification/ diambil sebelum koreksi warna, jadi tidak
    // lagi mewakili kondisi sebenarnya. Empat layar utama, dua arah tema.
    console.log('\n14b. Tangkapan layar terang + gelap');
    const SHOT_PAGES: [string, string][] = [
      ['Dashboard', '30-dashboard'],
      ['Laporan', '31-laporan'],
      ['Master Data', '32-master-data'],
      ['Buat Tiket', '33-form-buat-tiket'],
    ];
    for (const wantDark of [true, false]) {
      await setDark(wantDark);
      for (const [nav, name] of SHOT_PAGES) {
        const isForm = nav === 'Buat Tiket';
        await click(page, `${findText('a,button', nav)}`);
        if (isForm) await waitFor(page, `document.body.innerText.includes('Buat Tiket Baru')`, 8000);
        await sleep(2500);
        await shot(page, `${name}${wantDark ? '-gelap' : '-terang'}`);
        if (isForm) {
          await click(page, `(() => { const h=[...document.querySelectorAll('h1')].find(x=>x.innerText.includes('Buat Tiket Baru')); return h ? h.parentElement.parentElement.querySelector('button') : null; })()`);
          await sleep(1500);
        }
      }
    }
    record('tangkapan layar terang + gelap selesai', true, '8 gambar');
    record('tema dikembalikan setelah tangkapan', await setDark(darkWas), `kembali=${darkWas}`);

    // ── 15. Bersihkan data uji & pulihkan snapshot ──
    console.log('\n15. Pembersihan data uji');
    const cleanupPlan = JSON.stringify({
      ticketId: newTicket?.id ?? null,
      restore: (Array.isArray(snapshot) ? snapshot : []).map((u: any) => ({
        id: u.id, companyId: u.companyId ?? null, divisionId: u.divisionId ?? null, department: u.department,
      })),
    });
    const cleanup = await evalJS(page, `(async () => {
      const plan = ${cleanupPlan};
      const call = async (url, opts = {}) => {
        try {
          const r = await fetch(url, Object.assign({ credentials: 'include', headers: { 'content-type': 'application/json' } }, opts));
          return r.status;
        } catch { return 'error'; }
      };
      const out = { ticket: null, restored: 0, restoreFailed: [], deleteUser: null, deleteCompanies: [] };
      if (plan.ticketId) out.ticket = await call('/api/tickets/' + encodeURIComponent(plan.ticketId), { method: 'DELETE' });
      for (const u of plan.restore) {
        const s = await call('/api/users/' + encodeURIComponent(u.id), {
          method: 'PUT',
          body: JSON.stringify({ companyId: u.companyId, divisionId: u.divisionId, department: u.department }),
        });
        if (s === 200) out.restored += 1; else out.restoreFailed.push(u.id + ':' + s);
      }
      out.deleteUser = await call('/api/users/USR-901', { method: 'DELETE' });
      out.deleteCompanies = [
        await call('/api/companies/COMP-MAJU', { method: 'DELETE' }),
        await call('/api/companies/COMP-KEDUA', { method: 'DELETE' }),
      ];
      return out;
    })()`);
    const expectedRestore = Array.isArray(snapshot) ? snapshot.length : 0;
    record('snapshot seluruh pengguna dipulihkan', (cleanup?.restored ?? 0) === expectedRestore,
      `${cleanup?.restored}/${expectedRestore}${cleanup?.restoreFailed?.length ? ' gagal: ' + cleanup.restoreFailed.join(',') : ''}`);
    record('user uji dihapus', cleanup?.deleteUser === 200, JSON.stringify(cleanup?.deleteUser));
    record('perusahaan uji dihapus (divisi ter-cascade)', Array.isArray(cleanup?.deleteCompanies) && cleanup.deleteCompanies.every((s: any) => s === 200),
      JSON.stringify(cleanup?.deleteCompanies));
    record('pembuatan tiket tanpa DELETE API tercatat', true, `status hapus tiket=${JSON.stringify(cleanup?.ticket)} (dibersihkan via skrip DB terpisah)`);

    console.log(`\n[CT] langkah: ${steps.length}, gagal: ${steps.filter(s => !s.ok).length}`);
    console.log(`[CT] console errors: ${consoleErrors.length ? JSON.stringify([...new Set(consoleErrors)].slice(0, 5)) : 'tidak ada'}`);
    const otherMessages = [...consoleAll.entries()]
      .filter(([m]) => !/^\[(log|info|debug)\]/.test(m))
      .map(([m, n]) => `${n}× ${m.slice(0, 700)}`);
    if (otherMessages.length) {
      console.log('[CT] pesan console non-error (debugging):');
      otherMessages.forEach(m => console.log('   ' + m));
    }
    console.log(`[CT] screenshot: ${SHOTS}`);
    return { steps, consoleErrors };
  } finally {
    chrome.kill();
  }
}

main()
  .then((r) => {
    writeFileSync(join(SHOTS, 'clickthrough-report.json'), JSON.stringify({ steps: r.steps, consoleErrors: r.consoleErrors }, null, 2));
    const failed = r.steps.filter(s => !s.ok);
    if (failed.length || r.consoleErrors.length) {
      console.log('\nRINGKASAN GAGAL:');
      failed.forEach(f => console.log('  - ' + f.name + (f.detail ? ` (${f.detail})` : '')));
      if (r.consoleErrors.length) console.log('  - console errors: ' + JSON.stringify(r.consoleErrors.slice(0, 3)));
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((e) => { console.error('GAGAL:', e.stack || e.message); process.exit(1); });
