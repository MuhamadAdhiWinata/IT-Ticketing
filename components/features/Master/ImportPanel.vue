<template>
  <div class="p-5 sm:p-6 space-y-6">
    <div>
      <h3 class="text-sm font-bold text-foreground">Import Data Master & Pengguna</h3>
      <p class="text-[11px] text-muted-foreground">
        Unduh template CSV, isi di Excel, lalu unggah. Baris dengan id baru dibuat, id yang sudah ada diperbarui.
        Jika ada satu baris salah, tidak ada data yang tersimpan. Impor berurutan: Perusahaan, Divisi, Pengguna, Kategori, Aplikasi/Kendala, Modul, Vendor.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr] items-end">
      <AppSelect v-model="dataset" label="Jenis data" :options="options" />
      <div class="flex flex-wrap gap-2">
        <button type="button" class="px-3.5 py-2 rounded-xl border border-border text-xs font-bold flex items-center gap-1.5 hover:bg-muted" @click="download('template')">
          <Download class="w-4 h-4" /> Unduh Template
        </button>
        <button type="button" class="px-3.5 py-2 rounded-xl border border-border text-xs font-bold flex items-center gap-1.5 hover:bg-muted" @click="download('export')">
          <Download class="w-4 h-4" /> Unduh Data Saat Ini
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-border overflow-x-auto">
      <p class="px-4 py-2.5 text-[11px] text-muted-foreground border-b border-border bg-muted">{{ spec.desc }}</p>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-muted-foreground">
            <th class="px-4 py-2 font-semibold">Kolom</th>
            <th class="px-4 py-2 font-semibold">Wajib</th>
            <th class="px-4 py-2 font-semibold">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in spec.columns" :key="c.name" class="border-t border-border">
            <td class="px-4 py-2 font-mono font-bold text-foreground">{{ c.name }}</td>
            <td class="px-4 py-2">{{ c.required ? 'Ya' : '-' }}</td>
            <td class="px-4 py-2 text-muted-foreground">{{ c.hint }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space-y-3">
      <label class="block text-xs font-semibold text-foreground">File CSV</label>
      <input ref="fileInput" type="file" accept=".csv,text/csv" class="block text-xs" @change="onFile" />
      <div class="flex flex-wrap gap-2">
        <button type="button" class="px-3.5 py-2 rounded-xl border border-border text-xs font-bold disabled:opacity-50" :disabled="!csv || busy" @click="run(true)">
          {{ busy && mode === 'check' ? 'Memeriksa...' : 'Periksa Dulu' }}
        </button>
        <button type="button" class="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1.5" :disabled="!csv || busy" @click="run(false)">
          <Upload class="w-4 h-4" /> {{ busy && mode === 'import' ? 'Mengimpor...' : 'Import' }}
        </button>
      </div>
    </div>

    <div v-if="result" class="rounded-xl border p-4 space-y-3 text-xs" :class="result.errorCount ? 'border-red-300 bg-red-50' : 'border-border bg-muted'">
      <p class="font-bold text-foreground">
        <template v-if="result.errorCount">{{ result.errorCount }} kesalahan dari {{ result.total }} baris. Tidak ada data yang disimpan.</template>
        <template v-else-if="result.applied">Import selesai: {{ result.created }} dibuat, {{ result.updated }} diperbarui.</template>
        <template v-else>Pemeriksaan lolos: {{ result.created }} akan dibuat, {{ result.updated }} akan diperbarui. Klik Import untuk menyimpan.</template>
      </p>
      <ul v-if="result.errors.length" class="space-y-1 max-h-64 overflow-y-auto">
        <li v-for="(e, i) in result.errors" :key="i">Baris {{ e.line }}: {{ e.message }}</li>
      </ul>
      <p v-if="result.errorCount > result.errors.length" class="text-muted-foreground">Menampilkan {{ result.errors.length }} kesalahan pertama.</p>

      <div v-if="result.passwords.length" class="space-y-2">
        <p class="font-bold text-foreground">Password awal akun baru (hanya tampil sekali, simpan sekarang):</p>
        <table class="w-full">
          <tbody>
            <tr v-for="p in result.passwords" :key="p.id" class="border-t border-border">
              <td class="py-1 pr-3 font-mono">{{ p.email }}</td>
              <td class="py-1 font-mono font-bold">{{ p.password }}</td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="px-3 py-1.5 rounded-xl border border-border text-xs font-bold" @click="downloadPasswords">Unduh Daftar Password</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Download, Upload } from 'lucide-vue-next';
import AppSelect from '~/components/common/AppSelect.vue';
import { useToast } from '~/composables/useToast';
import { useAppStore } from '~/stores/app';
import { apiFetch } from '~/services/api';
import { toCsv } from '~/utils/csv';
import { IMPORT_LIST } from '~/utils/importSpec';

interface ImportResult {
  applied: boolean; total: number; created: number; updated: number; errorCount: number;
  errors: { line: number; message: string }[];
  passwords: { id: string; email: string; password: string }[];
}

const store = useAppStore();
const { toast } = useToast();

const dataset = ref<string>(IMPORT_LIST[0]!.key);
const options = IMPORT_LIST.map(d => ({ value: d.key, label: d.label }));
const spec = computed(() => IMPORT_LIST.find(d => d.key === dataset.value) ?? IMPORT_LIST[0]!);

const csv = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const busy = ref(false);
const mode = ref<'check' | 'import'>('check');
const result = ref<ImportResult | null>(null);

function save(name: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function download(kind: 'template' | 'export') {
  try {
    const blob = await apiFetch<Blob>(`/api/import/${kind}/${dataset.value}`, { responseType: 'blob' });
    save(kind === 'template' ? `template-${dataset.value}.csv` : `${dataset.value}-${new Date().toISOString().slice(0, 10)}.csv`, blob);
  } catch (e: any) {
    toast(e?.data?.statusMessage || 'Gagal mengunduh file', 'error');
  }
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  result.value = null;
  csv.value = f ? await f.text() : '';
}

async function run(dryRun: boolean) {
  busy.value = true;
  mode.value = dryRun ? 'check' : 'import';
  try {
    const res = await apiFetch<{ data: ImportResult }>(`/api/import/${dataset.value}`, { method: 'POST', body: { csv: csv.value, dryRun } });
    result.value = res.data;
    if (res.data.applied) {
      toast(`Import selesai: ${res.data.created} dibuat, ${res.data.updated} diperbarui`, 'success');
      csv.value = '';
      if (fileInput.value) fileInput.value.value = '';
      await store.refetchMasterData();
    } else if (res.data.errorCount) toast(`${res.data.errorCount} kesalahan, periksa daftar`, 'error');
  } catch (e: any) {
    result.value = null;
    toast(e?.data?.statusMessage || 'Import gagal', 'error', 6000);
  } finally {
    busy.value = false;
  }
}

function downloadPasswords() {
  const rows = result.value?.passwords.map(p => [p.id, p.email, p.password]) ?? [];
  save('password-awal.csv', new Blob([toCsv(['id', 'email', 'password'], rows)], { type: 'text/csv;charset=utf-8' }));
}
</script>
