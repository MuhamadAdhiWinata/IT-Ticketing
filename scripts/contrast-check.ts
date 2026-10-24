// Cek kontras teks nyata (R-25) lewat CDP: ambil warna teks + latar efektif tiap elemen,
// hitung rasio WCAG AA, laporkan yang di bawah ambang.
//
// Cakupan mode gelap: SEMUA tab, form buat tiket, detail tiket, modal master, dan
// halaman login diuji pada KEDUA arah tema. Halaman juga di-reload saat mode gelap
// untuk menguji jalur plugin (localStorage -> kelas .dark sebelum render).
// Jalankan: BASE_URL=http://localhost:3000 npx tsx scripts/contrast-check.ts
import { launchChrome, newPage, sleep, BASE, type Page } from './cdp';

async function evalJS(page: Page, expression: string): Promise<any> {
  const r = await page.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

const waitFor = async (page: Page, p: string, t = 20000) => {
  const d = Date.now() + t;
  while (Date.now() < d) {
    try { if (await evalJS(page, p)) return true; } catch { /* tunggu */ }
    await sleep(300);
  }
  return false;
};

const clickText = async (page: Page, tag: string, text: string) => {
  if (!(await waitFor(page, `!![...document.querySelectorAll('${tag}')].find(e => (e.innerText||'').toLowerCase().includes('${text.toLowerCase()}'))`, 9000))) {
    console.log(`  catatan: tidak menemukan ${tag} "${text}"`);
    return false;
  }
  await evalJS(page, `(() => { const el = [...document.querySelectorAll('${tag}')].find(e => (e.innerText||'').toLowerCase().includes('${text.toLowerCase()}')); if (el) el.click(); return true; })()`);
  await sleep(1200);
  return true;
};

const clickButton = async (page: Page, text: string) => {
  await evalJS(page, `(() => { const b = [...document.querySelectorAll('button')].find(x => (x.innerText||'').includes(${JSON.stringify(text)})); if (b) b.click(); return true; })()`);
  await sleep(1200);
};

const getDark = (page: Page) => evalJS(page, `document.documentElement.classList.contains('dark')`);
const openProfile = async (page: Page) => {
  await evalJS(page, `(() => { const b = document.querySelector('header button[aria-haspopup="true"]'); if (b) b.click(); return true; })()`);
  await sleep(900);
};

// Ganti arah tema lewat menu profil, dengan verifikasi: menu harus terbuka,
// label tombol harus sesuai keadaan, dan kelas .dark harus benar-benar berubah.
// Mengembalikan false bila salah satu tahap gagal (jangan dilewati diam-diam).
const toggleTheme = async (page: Page, wantDark: boolean): Promise<boolean> => {
  await openProfile(page);
  if (!(await waitFor(page, `!!document.querySelector('header [role="menu"]')`, 5000))) {
    console.log('  catatan: menu profil tidak terbuka');
    return false;
  }
  const label = wantDark ? 'Mode Gelap' : 'Mode Terang';
  const clicked = await evalJS(page, `(() => {
    const b = [...document.querySelectorAll('header [role="menu"] button')].find(x => (x.innerText||'').includes(${JSON.stringify(label)}));
    if (!b) return false;
    b.click();
    return true;
  })()`);
  if (!clicked) { console.log(`  catatan: tombol "${label}" tidak ada di menu`); return false; }
  await sleep(1500);
  await evalJS(page, `(() => { document.body.click(); return true; })()`);
  await sleep(600);
  const nowDark = await getDark(page);
  if (nowDark !== wantDark) {
    console.log(`  catatan: kelas .dark=${nowDark}, diharapkan ${wantDark}`);
    return false;
  }
  return true;
};

const pressEscape = async (page: Page) => {
  await evalJS(page, `(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    return true;
  })()`);
  await sleep(700);
};

// Nilai token yang ditanam applyThemeTokens di <html>. Dipakai untuk membuktikan
// refreshThemeTokens() benar-benar menghitung ulang saat arah tema berubah.
const readTokens = (page: Page) => evalJS(page, `(() => {
  const cs = getComputedStyle(document.documentElement);
  const g = (n) => (cs.getPropertyValue(n) || '').trim();
  return {
    primary: g('--color-primary'), primaryHover: g('--color-primary-hover'), primaryActive: g('--color-primary-active'),
    primaryMuted: g('--color-primary-muted'), fg: g('--color-primary-foreground'),
    surface: g('--color-surface'), surfaceElevated: g('--color-surface-elevated'),
    muted: g('--color-muted'), mutedFg: g('--color-muted-foreground'),
    secondary: g('--color-secondary'), secondaryFg: g('--color-secondary-foreground'),
    success: g('--color-success'), warning: g('--color-warning'), destructive: g('--color-destructive'),
  };
})()`);

// Ambil semua teks terlihat dengan warna foreground + latar efektifnya.
const SAMPLE = `(() => {
  const parse = (c) => {
    c = c || '';
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(',').map(x => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    // Hasil color-mix di Chrome: "color(srgb 0.2 0.25 0.33 / 0.6)" — kanal 0..1.
    m = c.match(/color\\(srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?/i);
    if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] !== undefined ? +m[4] : 1 };
    return null;
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.95) return c;
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  };
  const out = [];
  for (const el of document.querySelectorAll('p,span,div,button,a,label,th,td,h1,h2,h3,h4,strong,small,li,option')) {
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!direct) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.6) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    const fg = parse(cs.color);
    if (!fg || fg.a < 0.6) continue;
    out.push({
      text: (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
      fg, bg: bgOf(el),
      size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight) || 400,
      tag: el.tagName, cls: String(el.className || '').slice(0, 45),
    });
  }
  // Tombol bawaan <input type="file"> ada di pseudo-element, jadi tak pernah
  // tersentuh pengulasan di atas — sampelkan terpisah agar teksnya ikut diukur.
  for (const el of document.querySelectorAll('input[type=file]')) {
    const btn = getComputedStyle(el, '::file-selector-button');
    if (btn.display === 'none') continue;
    const fg = parse(btn.color);
    const bg = parse(btn.backgroundColor);
    if (!fg || !bg || bg.a < 0.95) continue;
    out.push({
      text: '[label tombol berkas]',
      fg, bg,
      size: parseFloat(btn.fontSize), weight: parseInt(btn.fontWeight) || 400,
      tag: 'INPUT::FILE', cls: String(el.className || '').slice(0, 45),
    });
  }
  return out;
})()`;

// ── Pemeriksaan non-teks (WCAG 1.4.11, ambang 3:1) ──
// Cakupan dibatasi pada kasus yang memang menuntut batas/objek grafis:
//   1. Kolom isian, pilihan, kotak centang, dan sakelar — diidentifikasi batasnya.
//   2. Tombol/tautan ikon-saja (tanpa label teks) — ikonnya yang diukur.
// Tombol/tautan berlabel teks DIKECUALIKAN: labelnya sendiri sudah mengidentifikasi,
// jadi 1.4.11 tidak menuntut batas. Menyertakannya hanya menimbulkan positif palsu.
// Isian transparan dihitung sebagai "tanpa isian"; kalau tidak, rgb(0,0,0) hasil
// rgba(0,0,0,0) terbaca sebagai latar hitam pekat dan semuanya ikut terbendera.
const NONTXT = `(() => {
  const parse = (c) => {
    c = c || '';
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(',').map(x => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    // Hasil color-mix di Chrome: "color(srgb 0.2 0.25 0.33 / 0.6)" — kanal 0..1.
    m = c.match(/color\\(srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?/i);
    if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] !== undefined ? +m[4] : 1 };
    return null;
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.95) return c;
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.6) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 8 && r.height >= 8;
  };
  const out = [];

  // 1) Kontrol yang diidentifikasi oleh batasnya.
  // type=file dikecualikan: tak punya batas sendiri, dan tombol berkinya
  // berlabel teks (diukur lewat sampler teks pseudo-element di atas).
  const BOUNDED = 'input:not([type=checkbox]):not([type=radio]):not([type=file]),select,textarea,[role=checkbox],[role=radio],[role=switch]';
  for (const el of document.querySelectorAll(BOUNDED)) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const own = parse(cs.backgroundColor);
    const around = bgOf(el.parentElement || document.body);
    const fill = own && own.a > 0.95 ? own : around;
    const bw = parseFloat(cs.borderTopWidth) || 0;
    const bo = parseFloat(cs.outlineWidth) || 0;
    out.push({
      kind: 'batas', tag: el.tagName, cls: String(el.className || '').slice(0, 40),
      fill, around, border: bw > 0 ? parse(cs.borderTopColor) : null, borderW: bw,
      outline: bo > 0 && cs.outlineStyle !== 'none' ? parse(cs.outlineColor) : null, outlineW: bo,
    });
  }

  // 2) Tombol/tautan ikon-saja: ikonnya yang mengidentifikasi.
  for (const el of document.querySelectorAll('button,a[href],[role=button]')) {
    if (!visible(el)) continue;
    if ((el.innerText || '').trim().length > 0) continue; // berlabel teks -> dikecualikan
    const g = el.querySelector('svg,img');
    if (!g) continue;
    const cs = getComputedStyle(el);
    const own = parse(cs.backgroundColor);
    const around = bgOf(el.parentElement || document.body);
    out.push({
      kind: 'ikon', tag: el.tagName, cls: String(el.className || '').slice(0, 40),
      fill: own && own.a > 0.95 ? own : around, around,
      icon: parse(getComputedStyle(g).color || getComputedStyle(g).fill),
    });
  }
  return out;
})()`;

// Cincin fokus: dipaksa lewat CSS.forcePseudoState (headless tidak menerima input
// keyboard nyata). Semua lapisan box-shadow dikomposisikan dari belakang ke depan
// di atas latar sekeliling, lalu hasil akhirnya yang diukur — mengambil lapisan
// pertama hanya menangkap cincin celah sewarna latar.
const FOCUS_PROBE = (sel: string) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const parse = (c) => {
    c = c || '';
    let m = c.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(',').map(x => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    // Hasil color-mix di Chrome: "color(srgb 0.2 0.25 0.33 / 0.6)" — kanal 0..1.
    m = c.match(/color\\(srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?/i);
    if (m) return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a: m[4] !== undefined ? +m[4] : 1 };
    return null;
  };
  let n = el.parentElement;
  let around = { r: 255, g: 255, b: 255, a: 1 };
  while (n && n !== document.documentElement) {
    const c = parse(getComputedStyle(n).backgroundColor);
    if (c && c.a > 0.95) { around = c; break; }
    n = n.parentElement;
  }
  const cs = getComputedStyle(el);
  const layers = (cs.boxShadow || '').match(/(?:rgba?\\([^)]+\\)|color\\(srgb[^)]+\\))/g) || [];
  const ow = parseFloat(cs.outlineWidth) || 0;
  const hasOutline = ow > 0 && cs.outlineStyle !== 'none';
  if (!layers.length && !hasOutline) return null; // tanpa cincin -> dilewati
  let cur = { r: around.r, g: around.g, b: around.b };
  for (const l of layers) {
    const c = parse(l);
    if (!c) continue;
    cur = { r: c.r * c.a + cur.r * (1 - c.a), g: c.g * c.a + cur.g * (1 - c.a), b: c.b * c.a + cur.b * (1 - c.a) };
  }
  if (!layers.length && hasOutline) {
    const c = parse(cs.outlineColor);
    if (c && c.a > 0.95) cur = { r: c.r, g: c.g, b: c.b };
  }
  return {
    sel: ${JSON.stringify(sel)},
    ring: { r: Math.round(cur.r), g: Math.round(cur.g), b: Math.round(cur.b) },
    around: { r: Math.round(around.r), g: Math.round(around.g), b: Math.round(around.b) },
    tag: el.tagName, cls: String(el.className || '').slice(0, 40),
  };
})()`;

const lum = (c: { r: number; g: number; b: number }) => {
  const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};
const ratio = (a: any, b: any) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const hex = (c: { r: number; g: number; b: number }) =>
  '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

type Fail = { where: string; text: string; ratio: number; need: number; size: number; tag: string; cls: string; fg: string; bg: string };
const failures: Fail[] = [];
let checked = 0;

function audit(where: string, samples: any[]) {
  for (const s of samples) {
    const r = ratio(s.fg, s.bg);
    const large = s.size >= 24 || (s.size >= 18.66 && s.weight >= 700);
    const need = large ? 3 : 4.5;
    checked += 1;
    if (r < need - 0.02) {
      failures.push({ where, text: `"${s.text}"`, ratio: Math.round(r * 100) / 100, need, size: s.size, tag: s.tag, cls: s.cls, fg: hex(s.fg), bg: hex(s.bg) });
    }
  }
}

// Parse string warna css ("rgb(r,g,b)"/"color(srgb r g b / a)"/"#rrggbb") menjadi Rgb.
// Varian alpha (rgba/color-mix) diparse tanpa kanon compositing: sampel batas memang
// diambil dari computed style yang sudah menyatu dengan latarnya.
// Terima string css ("rgb(r,g,b)"/"#rrggbb") atau objek {r,g,b} dari sampler dalam halaman.
function parseColor(c: string | { r: number; g: number; b: number } | null | undefined): { r: number; g: number; b: number } | null {
  if (!c) return null;
  if (typeof c === 'object') return { r: c.r, g: c.g, b: c.b };
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m?.[1]) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    if (p.length >= 3 && [p[0], p[1], p[2]].every((v) => Number.isFinite(v))) {
      return { r: p[0] as number, g: p[1] as number, b: p[2] as number };
    }
  }
  // Hasil color-mix di Chrome: "color(srgb 0.2 0.25 0.333 / 0.6)" — kanal 0..1.
  const s = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (s?.[1] && s?.[2] && s?.[3]) {
    return { r: parseFloat(s[1]) * 255, g: parseFloat(s[2]) * 255, b: parseFloat(s[3]) * 255 };
  }
  return parseHexNode(c);
}
function parseHexNode(hexStr: string) {
  const h = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hexStr || '').trim())?.[1];
  if (!h) return null;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(2, 6), 16) };
}

// Batas antarmuka / ikon vs isian dan sekelilingnya: bila isian sudah kontras >= 3,
// batas tidak wajib (WCAG 1.4.11 membolehkannya). Ikon diukur apa adanya.
function auditNontext(where: string, samples: any[]) {
  for (const s of samples) {
    const fill = parseColor(s.fill);
    const around = parseColor(s.around);
    if (!fill || !around) continue;
    checked += 1;
    if (ratio(fill, around) >= 3) continue; // isian sudah mengidentifikasi sendiri
    const subject = s.kind === 'ikon' ? parseColor(s.icon) : parseColor(s.border);
    const label = s.kind === 'ikon' ? '"ikon tombol vs latar"' : '"batas kontrol vs sekeliling"';
    if (!subject) {
      failures.push({ where, text: s.kind === 'ikon' ? '"ikon tombol tak terbaca"' : '"kontrol tanpa batas terlihat"', ratio: 1, need: 3, size: 0, tag: s.tag, cls: s.cls, fg: hex(fill), bg: hex(around) });
      continue;
    }
    const r = ratio(subject, around);
    if (r < 2.98) {
      failures.push({ where, text: label, ratio: Math.round(r * 100) / 100, need: 3, size: 0, tag: s.tag, cls: s.cls, fg: hex(subject), bg: hex(around) });
    }
  }
}

// Cincin fokus harus kontras >= 3 terhadap latar sekeliling (WCAG 2.4.7 + 1.4.11).
function auditFocus(where: string, probes: any[]) {
  for (const p of probes) {
    if (!p || !p.ring) continue;
    const ring = parseColor(p.ring);
    const around = parseColor(p.around);
    if (!ring || !around) continue;
    checked += 1;
    const r = ratio(ring, around);
    if (r < 2.98) {
      failures.push({ where, text: '"cincin fokus vs latar"', ratio: Math.round(r * 100) / 100, need: 3, size: 0, tag: p.tag, cls: p.cls, fg: hex(ring), bg: hex(around) });
    }
  }
}

// Keadaan hover/active/disabled dihitung mesin token, tapi tak pernah diukur siapa
// pun. Di sini token-nya dibaca langsung dan diuji: teks di atas latar hover/active
// wajib >= 4.5, dan status nonaktif wajib kontras minimal terhadap latarnya.
function auditTokenStates(where: string, t: any) {
  const pairs: [string, string, string, number][] = [
    ['teks utama di permukaan', t.primary, t.surface, 4.5],
    ['teks tombol di latar hover', t.fg, t.primaryHover, 4.5],
    ['teks tombol di latar aktif', t.fg, t.primaryActive, 4.5],
    ['teks sekunder di latarnya', t.secondaryFg, t.secondary, 4.5],
    ['teks redup di latar meredup', t.mutedFg, t.muted, 4.5],
    ['teks status sukses', t.success, t.surface, 4.5],
    ['teks status peringatan', t.warning, t.surface, 4.5],
    ['teks status merusak', t.destructive, t.surface, 4.5],
  ];
  for (const [label, fgHex, bgHex, need] of pairs) {
    const fg = parseColor(fgHex);
    const bg = parseColor(bgHex);
    if (!fg || !bg) continue;
    checked += 1;
    const r = ratio(fg, bg);
    if (r < need - 0.02) {
      failures.push({ where, text: `"${label}"`, ratio: Math.round(r * 100) / 100, need, size: 0, tag: 'TOKEN', cls: label, fg: fgHex, bg: bgHex });
    }
  }
}

// Tab yang terlihat untuk SYSTEM_ADMIN (lihat components/global/Sidebar.vue).
const TABS = ['Tracking', 'Tiket Saya', 'Dashboard', 'Pekerjaan Saya', 'Log Harian', 'Laporan', 'Master Data', 'Pengaturan'];

// Kata kunci pencarian tracking; harus cocok dengan judul tiket yang benar-benar
// ada di DB (seed memuat "Printer Lantai 2 Kehabisan Tinta & Paper Jam").
const SEARCH_KEYWORD = 'Printer';

// Audit satu tab + kembali ke keadaan bersih. Gagal satu tab tidak menghentikan sisanya.
async function auditTab(page: Page, label: string, tab: string, mode: string) {
  if (!(await clickText(page, 'a,button', tab))) {
    console.log(`  catatan: tab "${tab}" tidak terjangkau, dilewati`);
    return;
  }
  await sleep(1400);
  await auditPage(page, `${label} / ${tab} (${mode})`);
}

// Buka tiga modal master, ukur isinya, tutup lagi dengan Escape.
// Tab ORG harus aktif lebih dulu; tombol modal hanya ada di dalamnya.
async function auditModals(page: Page, label: string, mode: string) {
  if (!(await clickText(page, 'button', 'Perusahaan & Divisi'))) {
    console.log('  catatan: sub-tab Perusahaan & Divisi tidak terjangkau');
    return;
  }
  await sleep(1200);
  for (const btn of ['Tambah Perusahaan', 'Tambah Divisi']) {
    if (!(await clickText(page, 'button', btn))) continue;
    await sleep(900);
    await auditPage(page, `${label} / modal ${btn} (${mode})`);
    await pressEscape(page);
  }
}

// Form buat tiket memuat label Pelapor, jadi wajib terukur di kedua mode.
async function auditCreateForm(page: Page, label: string, mode: string) {
  await clickButton(page, 'Buat Tiket');
  await sleep(1600);
  if (await evalJS(page, `!![...document.querySelectorAll('h1')].find(x => x.innerText.includes('Buat Tiket Baru'))`)) {
    await auditPage(page, `${label} / form buat tiket (${mode})`);
    await evalJS(page, `(() => { const h=[...document.querySelectorAll('h1')].find(x=>x.innerText.includes('Buat Tiket Baru')); const b=h?h.parentElement.parentElement.querySelector('button'):null; if (b) b.click(); return true; })()`);
    await sleep(1500);
  }
}

// Detail tiket dibuka lewat pencarian tracking. Kata kunci dipilih dari judul
// tiket yang benar-benar ada di DB (seed), bukan asumsi.
async function auditTicketDetail(page: Page, label: string, mode: string) {
  await clickText(page, 'a,button', 'Tracking');
  await sleep(1400);
  const searchSel = `(() => [...document.querySelectorAll('input')].find(x => /Cari kode/i.test(x.placeholder || '')) || null)()`;
  if (!(await waitFor(page, `!!(${searchSel})`, 8000))) return;
  const kw = SEARCH_KEYWORD;
  await evalJS(page, `(() => { const i = (${searchSel}); if (!i) return false; i.focus(); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(i, ${JSON.stringify(kw)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
  await sleep(2200);
  if (!(await clickText(page, '[role=option], button', kw))) {
    console.log(`  catatan: saran pencarian "${kw}" tidak tampil, detail tidak terukur`);
    return;
  }
  await sleep(1800);
  if (!(await clickText(page, 'button', 'Detail Lengkap'))) return;
  await sleep(1800);
  if (!(await evalJS(page, `document.body.innerText.includes('Pelapor:')`))) return;
  await auditPage(page, `${label} / detail tiket (${mode})`);
  await clickText(page, 'a,button', 'Tracking');
  await sleep(1200);
}

// Audit teks + batas non-teks + cincin fokus dalam satu pemanggilan.
// Cincin fokus dipaksa dengan CSS.forcePseudoState: input keyboard nyata tidak
// sampai ke renderer pada headless, jadi ini satu-satunya cara melihat :focus-visible.
const FOCUS_SELECTORS = ['input', 'button', 'a[href]'];

async function forceFocus(page: Page, selector: string): Promise<any> {
  const doc = await page.send('DOM.getDocument', { depth: -1 });
  const q = await page.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector });
  if (!q?.nodeId) return null;
  await page.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: ['focus', 'focusVisible'] });
  await sleep(300);
  const probe = await evalJS(page, FOCUS_PROBE(selector));
  await page.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: [] });
  return probe;
}

async function auditPage(page: Page, where: string) {
  audit(where, await evalJS(page, SAMPLE));
  auditNontext(where, await evalJS(page, NONTXT));
  const probes: any[] = [];
  for (const sel of FOCUS_SELECTORS) {
    try { const p = await forceFocus(page, sel); if (p?.ring) probes.push(p); } catch { /* selektor tak ada di halaman ini */ }
  }
  auditFocus(where, probes);
}

// Satu putaran penuh: semua tab, form, detail, modal. Dipanggil untuk tiap arah tema.
async function auditEverything(page: Page, mode: string) {
  for (const tab of TABS) await auditTab(page, mode, tab, mode);
  await auditCreateForm(page, mode, mode);
  await auditTicketDetail(page, mode, mode);
  await clickText(page, 'a,button', 'Master Data');
  await sleep(1200);
  await auditModals(page, mode, mode);
}

async function main() {
  const chrome = await launchChrome();
  try {
    const page = await newPage(BASE + '/login');
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    await page.send('DOM.enable');
    await page.send('CSS.enable');
    await sleep(2500);
    if (!(await waitFor(page, '!!document.querySelector("#login-email")'))) throw new Error('form login tidak ada');
    if (!(await waitFor(page, `!!(document.querySelector('#__nuxt')||{}).__vue_app__`, 30000))) throw new Error('belum hydration');
    await sleep(1200);

    // ── Halaman login pada kedua arah tema ──
    // Ukur arah tema yang sedang aktif, lalu paksa arah lawan lewat localStorage +
    // reload (itu jalur plugin: kelas .dark dipasang sebelum render), ukur lagi,
    // lalu kembalikan localStorage ke nilai semula sebelum login.
    const loginDark0 = await getDark(page);
    await auditPage(page, `login (gelap=${loginDark0})`);

    await evalJS(page, `localStorage.setItem('darkMode', ${loginDark0 ? "'0'" : "'1'"}); true`);
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(2500);
    if (!(await waitFor(page, '!!document.querySelector("#login-email")', 20000))) throw new Error('login tidak termuat setelah reload tema');
    await sleep(1200);
    const loginDark1 = await getDark(page);
    console.log(`login reload: gelap=${loginDark1} (diharapkan ${!loginDark0})`);
    if (loginDark1 === loginDark0) {
      failures.push({ where: 'login-reload', text: '"halaman login tidak berubah arah tema setelah reload"', ratio: 0, need: 1, size: 0, tag: 'DOM', cls: 'html.dark', fg: 'gelap=' + loginDark1, bg: 'diharapkan=' + !loginDark0 });
    }
    await auditPage(page, `login (gelap=${loginDark1})`);

    await evalJS(page, `localStorage.setItem('darkMode', ${loginDark0 ? "'1'" : "'0'"}); true`);
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(2500);
    if (!(await waitFor(page, `!!(document.querySelector('#__nuxt')||{}).__vue_app__`, 30000))) throw new Error('belum hydration setelah reload tema balik');
    await sleep(1200);

    await evalJS(page, `(() => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(document.querySelector('#login-email'),'sysadmin@company.co.id'); document.querySelector('#login-email').dispatchEvent(new Event('input',{bubbles:true})); s.call(document.querySelector('#login-password'),'password123'); document.querySelector('#login-password').dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
    await sleep(400);
    await clickButton(page, 'Masuk');
    if (!(await waitFor(page, `!document.querySelector('#login-email')`, 25000))) throw new Error('login tidak berhasil');
    if (!(await waitFor(page, `!![...document.querySelectorAll('input')].find(x => /Cari kode/i.test(x.placeholder || ''))`, 15000))) throw new Error('halaman tracking tidak termuat');
    await sleep(2500);

    // ── Baseline tema diambil SETELAH login ──
    // Saat ini initApp sudah menerapkan preferensi dari server, yang bisa berbeda
    // dengan localStorage di halaman login. Menangkapnya sebelum login membuat
    // label mode salah dan toggle bisa mengklik tombol yang tidak ada.
    const wasDark = await getDark(page);
    const storedDark = await evalJS(page, `localStorage.getItem('darkMode')`);
    console.log(`\nbaseline setelah login: html.dark=${wasDark} localStorage.darkMode=${storedDark}`);
    const modeA = wasDark ? 'gelap' : 'terang';
    const modeB = wasDark ? 'terang' : 'gelap';

    // ── Putaran 1: arah tema awal ──
    const tokensA = await readTokens(page);
    console.log(`token (${modeA}): primary=${tokensA.primary} fg=${tokensA.fg} surface=${tokensA.surface}`);
    auditTokenStates(`token (${modeA})`, tokensA);
    await auditEverything(page, modeA);

    // ── Ganti tema ──
    if (!(await toggleTheme(page, !wasDark))) throw new Error('toggle tema tidak berubah: tombol ganti tema tidak ditemukan atau tidak bereaksi');
    const tokensB = await readTokens(page);
    console.log(`token (${modeB}): primary=${tokensB.primary} fg=${tokensB.fg} surface=${tokensB.surface}`);
    auditTokenStates(`token (${modeB})`, tokensB);
    // refreshThemeTokens() wajib menghitung ulang; kalau tidak, token identik
    // dan warna primary terang tetap terpakai di latar gelap.
    if (tokensB.primary === tokensA.primary) {
      console.log(`PERINGATAN: --color-primary tidak berubah saat ganti tema (${tokensB.primary})`);
      failures.push({ where: 'token', text: '"--color-primary tidak dihitung ulang"', ratio: 0, need: 1, size: 0, tag: 'CSS', cls: 'applyThemeTokens', fg: tokensB.primary, bg: tokensB.surface });
    }

    // ── Putaran 2: arah tema lawan ──
    await auditEverything(page, modeB);

    // ── Reload saat mode lawan: jalur plugin (localStorage -> .dark sebelum render) ──
    const stored = await evalJS(page, `localStorage.getItem('darkMode')`);
    console.log(`\nlocalStorage.darkMode setelah toggle: ${stored}`);
    await page.send('Page.reload', { ignoreCache: false });
    await sleep(3000);
    const hydratedOk = await waitFor(page, `!!(document.querySelector('#__nuxt')||{}).__vue_app__`, 30000);
    await sleep(1500);
    const darkAfterReload = await getDark(page);
    const tokensReload = await readTokens(page);
    console.log(`setelah reload: gelap=${darkAfterReload} primary=${tokensReload.primary}`);
    if (!hydratedOk) throw new Error('belum hydration setelah reload di mode gelap');
    if (darkAfterReload !== (modeB === 'gelap')) {
      failures.push({ where: 'reload', text: '"tema tidak bertahan setelah reload"', ratio: 0, need: 1, size: 0, tag: 'DOM', cls: 'html.dark', fg: 'gelap=' + darkAfterReload, bg: 'diharapkan=' + (modeB === 'gelap') });
    }
    if (tokensReload.primary !== tokensB.primary) {
      failures.push({ where: 'reload', text: '"token berbeda setelah reload"', ratio: 0, need: 1, size: 0, tag: 'CSS', cls: 'applyThemeTokens', fg: tokensReload.primary, bg: 'sebelumnya=' + tokensB.primary });
    }
    await auditPage(page, `setelah reload (${modeB})`);

    // ── Kembalikan tema seperti semula ──
    // Setelah reload, menu profil dibuka ulang dan perubahannya diverifikasi;
    // kalau gagal sekali, ulangi sampai tema benar-benar kembali.
    let restored = await getDark(page);
    for (let i = 0; i < 3 && restored !== wasDark; i++) {
      if (await toggleTheme(page, wasDark)) restored = await getDark(page);
      else console.log('  catatan: gagal mengganti tema saat pemulihan, ulangi');
    }
    console.log(`tema dikembalikan ke ${modeA}: ${restored === wasDark ? 'ya' : 'TIDAK'}`);
    if (restored !== wasDark) {
      failures.push({ where: 'restore', text: '"tema tidak dipulihkan ke kondisi awal"', ratio: 0, need: 1, size: 0, tag: 'DOM', cls: 'html.dark', fg: 'gelap=' + restored, bg: 'awal=' + wasDark });
    }
    // Pastikan localStorage sinkron dengan keadaan akhir, supaya muat ulang
    // berikutnya tidak memakai sisa keadaan uji.
    await evalJS(page, `localStorage.setItem('darkMode', ${restored ? "'1'" : "'0'"}); true`);

    console.log(`\nelemen diperiksa: ${checked}`);
    const unique = new Map<string, Fail>();
    for (const f of failures) {
      const key = `${f.cls}|${f.text}|${f.ratio}`;
      if (!unique.has(key)) unique.set(key, f);
    }
    if (!unique.size) {
      console.log(`KONTRAS: semua lolos WCAG AA (R-25) pada ${modeA} dan ${modeB}`);
      process.exit(0);
    }
    console.log(`KONTRAS GAGAL: ${failures.length} temuan, ${unique.size} unik`);
    for (const f of unique.values()) {
      console.log(`  ${f.ratio} < ${f.need}  ${f.size}px  ${f.tag}.${f.cls}  ${f.text}  ${f.fg} on ${f.bg}  (${f.where})`);
    }
    process.exit(1);
  } finally {
    chrome.kill();
  }
}

main().catch((e) => { console.error('GAGAL:', e.stack || e.message); process.exit(1); });
