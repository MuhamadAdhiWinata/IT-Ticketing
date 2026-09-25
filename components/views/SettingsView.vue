<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
      <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
        <Settings class="w-3.5 h-3.5" />
        <span>Pengaturan Sistem</span>
      </div>
      <h1 class="text-xl font-bold text-foreground">Pengaturan</h1>
      <p class="text-xs text-muted-foreground">Kelola profil perusahaan dan tampilan aplikasi.</p>
    </div>

    <!-- Tabs -->
    <div class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden">
      <div class="flex border-b border-border bg-muted/30 p-1 gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === tab.id ? 'bg-surface shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Company Profile -->
      <div v-if="activeTab === 'company'" class="p-5 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Company Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-foreground">Nama Perusahaan</label>
            <input
              v-model="form.companyName"
              type="text"
              class="w-full px-3 py-2 rounded-lg border border-input bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="Nama perusahaan"
            />
          </div>

          <!-- Logo URL -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-foreground">Logo URL</label>
            <input
              v-model="form.logoUrl"
              type="text"
              class="w-full px-3 py-2 rounded-lg border border-input bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <!-- Logo Preview -->
        <div v-if="form.logoUrl" class="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          <img :src="form.logoUrl" alt="Logo preview" class="w-10 h-10 object-contain rounded" @error="logoError = true" />
          <span class="text-xs text-muted-foreground">Preview logo</span>
        </div>
      </div>

      <!-- Theme Colors -->
      <div v-else-if="activeTab === 'theme'" class="p-5 space-y-5">
        <!-- Primary -->
        <div>
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Primary</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div v-for="(field, key) in primaryFields" :key="key" class="space-y-1.5">
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase">{{ field.label }}</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="form[key]" class="w-8 h-8 rounded border border-border cursor-pointer" />
                <input
                  v-model="form[key]"
                  type="text"
                  class="flex-1 px-2 py-1.5 rounded border border-input bg-surface text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Secondary -->
        <div>
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Secondary</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="(field, key) in secondaryFields" :key="key" class="space-y-1.5">
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase">{{ field.label }}</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="form[key]" class="w-8 h-8 rounded border border-border cursor-pointer" />
                <input
                  v-model="form[key]"
                  type="text"
                  class="flex-1 px-2 py-1.5 rounded border border-input bg-surface text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Accent -->
        <div>
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Accent</h3>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="(field, key) in accentFields" :key="key" class="space-y-1.5">
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase">{{ field.label }}</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="form[key]" class="w-8 h-8 rounded border border-border cursor-pointer" />
                <input
                  v-model="form[key]"
                  type="text"
                  class="flex-1 px-2 py-1.5 rounded border border-input bg-surface text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
          <p class="text-[10px] font-bold text-muted-foreground uppercase">Preview</p>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 rounded-lg text-xs font-bold text-white" :style="{ backgroundColor: form.primaryColor }">Primary Button</button>
            <button class="px-4 py-2 rounded-lg text-xs font-bold border" :style="{ borderColor: form.secondaryColor, color: form.secondaryColor }">Secondary</button>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white" :style="{ backgroundColor: form.accentColor }">Accent Badge</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <p v-if="saveMessage" class="text-xs text-success font-medium">{{ saveMessage }}</p>
        <p v-else />
        <UiButton size="sm" :loading="saving" @click="handleSave">
          Simpan Pengaturan
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Settings, Building2, Palette } from 'lucide-vue-next';
import { useCompany } from '~/composables/useCompany';
import { useModal } from '~/composables/useModal';

const { settings, updateSettings } = useCompany();
const { showSuccess, showError } = useModal();

const activeTab = ref<'company' | 'theme'>('company');
const saving = ref(false);
const saveMessage = ref('');
const logoError = ref(false);

const tabs = [
  { id: 'company' as const, label: 'Profil Perusahaan', icon: Building2 },
  { id: 'theme' as const, label: 'Tampilan & Tema', icon: Palette },
];

const primaryFields = {
  primaryColor: { label: 'Color' },
  primaryHoverColor: { label: 'Hover' },
  primaryActiveColor: { label: 'Active' },
  primaryMutedColor: { label: 'Muted' },
  primaryForegroundColor: { label: 'Foreground' },
};

const secondaryFields = {
  secondaryColor: { label: 'Color' },
  secondaryHoverColor: { label: 'Hover' },
  secondaryForegroundColor: { label: 'Foreground' },
};

const accentFields = {
  accentColor: { label: 'Color' },
  accentForegroundColor: { label: 'Foreground' },
};

const form = reactive({
  companyName: settings.value.companyName,
  logoUrl: settings.value.logoUrl || '',
  primaryColor: settings.value.primaryColor,
  primaryHoverColor: settings.value.primaryHoverColor,
  primaryActiveColor: settings.value.primaryActiveColor,
  primaryMutedColor: settings.value.primaryMutedColor,
  primaryForegroundColor: settings.value.primaryForegroundColor,
  secondaryColor: settings.value.secondaryColor,
  secondaryHoverColor: settings.value.secondaryHoverColor,
  secondaryForegroundColor: settings.value.secondaryForegroundColor,
  accentColor: settings.value.accentColor,
  accentForegroundColor: settings.value.accentForegroundColor,
});

watch(settings, (s) => {
  Object.assign(form, {
    companyName: s.companyName,
    logoUrl: s.logoUrl || '',
    primaryColor: s.primaryColor,
    primaryHoverColor: s.primaryHoverColor,
    primaryActiveColor: s.primaryActiveColor,
    primaryMutedColor: s.primaryMutedColor,
    primaryForegroundColor: s.primaryForegroundColor,
    secondaryColor: s.secondaryColor,
    secondaryHoverColor: s.secondaryHoverColor,
    secondaryForegroundColor: s.secondaryForegroundColor,
    accentColor: s.accentColor,
    accentForegroundColor: s.accentForegroundColor,
  });
});

const handleSave = async () => {
  saving.value = true;
  saveMessage.value = '';
  try {
    await updateSettings({ ...form });
    showSuccess('Berhasil', 'Pengaturan berhasil disimpan.');
    saveMessage.value = 'Tersimpan';
    setTimeout(() => { saveMessage.value = ''; }, 3000);
  } catch {
    showError('Gagal', 'Gagal menyimpan pengaturan.');
  } finally {
    saving.value = false;
  }
};
</script>
