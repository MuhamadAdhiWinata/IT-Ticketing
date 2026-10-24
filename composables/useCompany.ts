import { ref } from 'vue';
import { apiFetch } from '~/services/api';

interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  primaryHoverColor: string;
  primaryActiveColor: string;
  primaryMutedColor: string;
  primaryForegroundColor: string;
  secondaryColor: string;
  secondaryHoverColor: string;
  secondaryForegroundColor: string;
  accentColor: string;
  accentForegroundColor: string;
}

const DEFAULTS: CompanySettings = {
  id: 'default',
  companyName: 'Percetakan Integral Offset',
  logoUrl: null,
  primaryColor: '#026bb1',
  primaryHoverColor: '#025790',
  primaryActiveColor: '#014674',
  primaryMutedColor: '#e6f1f8',
  primaryForegroundColor: '#ffffff',
  secondaryColor: '#475569',
  secondaryHoverColor: '#334155',
  secondaryForegroundColor: '#ffffff',
  accentColor: '#0ea5e9',
  accentForegroundColor: '#ffffff',
};

function loadCached(): CompanySettings | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('companySettings');
    if (!raw) return null;
    return JSON.parse(raw) as CompanySettings;
  } catch {
    return null;
  }
}

function saveCache(s: CompanySettings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('companySettings', JSON.stringify(s));
  } catch { /* noop */ }
}

const cached = loadCached();
const settings = ref<CompanySettings>(cached || { ...DEFAULTS });
const loaded = ref(false);

/* ============================================
   PENYESUAIAN KONTRAS (WCAG AA 4.5:1)
   Warna merek dari database dipakai apa adanya; hanya lightness yang digeser
   sampai teks lolos terhadap permukaan mode terang/gelap. Hue tetap.
   ============================================ */

type Rgb = { r: number; g: number; b: number };

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MIN_TEXT_CONTRAST = 4.5;
const DARK_SURFACES = ['#0f172a', '#1e293b', '#253349'];
const LIGHT_SURFACES = ['#ffffff', '#f8fafc', '#f1f5f9'];
const DARK_INK = '#0b1220';

function parseHex(hex: string): Rgb | null {
  const h = HEX_RE.exec((hex || '').trim())?.[1];
  if (!h) return null;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex(c: Rgb): string {
  const p = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${p(c.r)}${p(c.g)}${p(c.b)}`;
}

function luminance(c: Rgb): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbToHsl(c: Rgb) {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return toHex({ r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 });
}

function shiftLightness(hex: string, delta: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const { h, s, l } = rgbToHsl(rgb);
  return hslToHex(h, s, Math.max(0, Math.min(1, l + delta)));
}

function mixHex(color: string, target: string, amount: number): string {
  const a = parseHex(color);
  const b = parseHex(target);
  if (!a || !b) return color;
  const m = (x: number, y: number) => x + (y - x) * amount;
  return toHex({ r: m(a.r, b.r), g: m(a.g, b.g), b: m(a.b, b.b) });
}

// Geser lightness ke arah `direction` sampai semua latar `against` terlampaui `min`.
function ensureContrast(color: string, against: string[], min: number, direction: 'lighter' | 'darker'): string {
  let current = color;
  for (let i = 0; i < 60; i++) {
    const rgb = parseHex(current);
    if (!rgb) return current;
    const ok = against.every((bg) => {
      const b = parseHex(bg);
      return !b || contrastRatio(rgb, b) >= min;
    });
    if (ok) return current;
    const next = shiftLightness(current, direction === 'lighter' ? 0.04 : -0.04);
    if (next === current) return current;
    current = next;
  }
  return current;
}

function pickForeground(background: string, candidates: string[]): string {
  const first = candidates[0] ?? '#ffffff';
  const bg = parseHex(background);
  if (!bg) return first;
  let best = first;
  let bestRatio = 0;
  for (const candidate of candidates) {
    const rgb = parseHex(candidate);
    if (!rgb) continue;
    const r = contrastRatio(bg, rgb);
    if (r > bestRatio) {
      bestRatio = r;
      best = candidate;
    }
  }
  return best;
}

function applyThemeTokens(s: CompanySettings = settings.value) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const dark = el.classList.contains('dark');
  const surfaces = dark ? DARK_SURFACES : [...LIGHT_SURFACES, s.primaryMutedColor];
  const direction = dark ? 'lighter' : 'darker';

  const primary = ensureContrast(s.primaryColor, surfaces, MIN_TEXT_CONTRAST, direction);
  const primaryHover = dark
    ? ensureContrast(shiftLightness(primary, 0.07), surfaces, MIN_TEXT_CONTRAST, 'lighter')
    : ensureContrast(s.primaryHoverColor, surfaces, MIN_TEXT_CONTRAST, direction);
  const primaryActive = dark
    ? ensureContrast(shiftLightness(primary, -0.06), surfaces, MIN_TEXT_CONTRAST, 'lighter')
    : ensureContrast(s.primaryActiveColor, surfaces, MIN_TEXT_CONTRAST, direction);
  const primaryForeground = pickForeground(primary, [s.primaryForegroundColor, '#ffffff', DARK_INK]);
  const primaryMuted = dark
    ? ensureContrast(mixHex(primary, '#0f172a', 0.78), [primary], MIN_TEXT_CONTRAST, 'darker')
    : s.primaryMutedColor;

  el.style.setProperty('--color-primary', primary);
  el.style.setProperty('--color-primary-hover', primaryHover);
  el.style.setProperty('--color-primary-active', primaryActive);
  el.style.setProperty('--color-primary-muted', primaryMuted);
  el.style.setProperty('--color-primary-foreground', primaryForeground);
  el.style.setProperty('--color-secondary', s.secondaryColor);
  el.style.setProperty('--color-secondary-hover', s.secondaryHoverColor);
  el.style.setProperty('--color-secondary-foreground', pickForeground(s.secondaryColor, [s.secondaryForegroundColor, '#ffffff', DARK_INK]));
  el.style.setProperty('--color-accent', s.accentColor);
  el.style.setProperty('--color-accent-foreground', pickForeground(s.accentColor, [s.accentForegroundColor, '#ffffff', DARK_INK]));
}

// Dipanggil setelah kelas .dark ditambah/dibuang: token harus dihitung ulang untuk mode baru.
export function refreshThemeTokens() {
  applyThemeTokens(settings.value);
}

export function useCompany() {
  async function fetchSettings() {
    try {
      const res = await apiFetch<{ success: boolean; data: CompanySettings }>('/api/settings/company');
      if (res.success) {
        settings.value = res.data;
        applyThemeTokens(res.data);
        saveCache(res.data);
        loaded.value = true;
      }
    } catch (e) {
      console.error('Failed to load company settings:', e);
    }
  }

  async function updateSettings(patch: Partial<CompanySettings>) {
    try {
      const res = await apiFetch<{ success: boolean; data: CompanySettings }>('/api/settings/company', {
        method: 'PATCH',
        body: patch,
      });
      if (res.success) {
        settings.value = res.data;
        applyThemeTokens(res.data);
        saveCache(res.data);
      }
      return res;
    } catch (e) {
      console.error('Failed to update company settings:', e);
      throw e;
    }
  }

  // Apply theme tokens from cache immediately on first use
  if (!loaded.value && cached) {
    applyThemeTokens(cached);
  }

  return {
    settings,
    loaded,
    fetchSettings,
    updateSettings,
    applyThemeTokens,
  };
}
