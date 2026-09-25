import { ref } from 'vue';

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

function applyThemeTokens(s: CompanySettings) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.style.setProperty('--color-primary', s.primaryColor);
  el.style.setProperty('--color-primary-hover', s.primaryHoverColor);
  el.style.setProperty('--color-primary-active', s.primaryActiveColor);
  el.style.setProperty('--color-primary-muted', s.primaryMutedColor);
  el.style.setProperty('--color-primary-foreground', s.primaryForegroundColor);
  el.style.setProperty('--color-secondary', s.secondaryColor);
  el.style.setProperty('--color-secondary-hover', s.secondaryHoverColor);
  el.style.setProperty('--color-secondary-foreground', s.secondaryForegroundColor);
  el.style.setProperty('--color-accent', s.accentColor);
  el.style.setProperty('--color-accent-foreground', s.accentForegroundColor);
}

export function useCompany() {
  async function fetchSettings() {
    try {
      const res = await $fetch<{ success: boolean; data: CompanySettings }>('/api/settings/company', {
        credentials: 'include',
      });
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
      const res = await $fetch<{ success: boolean; data: CompanySettings }>('/api/settings/company', {
        method: 'PATCH',
        body: patch,
        credentials: 'include',
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
