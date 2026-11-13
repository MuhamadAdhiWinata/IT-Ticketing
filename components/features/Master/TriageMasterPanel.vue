<template>
  <div class="p-5 sm:p-6 space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-foreground">Master Triase: Dampak, Urgensi, dan Prioritas</h3>
        <p class="text-[11px] text-muted-foreground">
          Dipakai di form triase PM, badge Dashboard, dan filter. Prioritas selalu P1 sampai P4 (target waktunya diatur di tab SLA); yang dapat diubah label, deskripsi, dan isi matriks.
        </p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold disabled:opacity-50" :disabled="!dirty || saving" @click="reset">Batalkan Perubahan</button>
        <button type="button" class="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold disabled:opacity-50" :disabled="!dirty || saving" @click="save">
          {{ saving ? 'Menyimpan...' : 'Simpan Master' }}
        </button>
      </div>
    </div>

    <div v-if="!draft" class="text-xs text-muted-foreground">Memuat...</div>
    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section v-for="sec in sections" :key="sec.key" class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">{{ sec.title }}</h4>
            <button type="button" class="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 flex items-center gap-1" @click="addItem(sec.key)">
              <Plus class="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
          <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <th class="p-2.5">ID</th>
                  <th class="p-2.5">Label</th>
                  <th class="p-2.5 text-center">Aktif</th>
                  <th class="p-2.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(it, i) in draft[sec.key]" :key="it._k">
                  <td class="p-2">
                    <input v-if="it._new" v-model="it.id" :aria-label="`ID ${sec.title}`" placeholder="MISAL_ID" class="w-28 px-2 py-1 rounded border border-border bg-surface font-mono uppercase" @input="it.id = it.id.toUpperCase().replace(/[^A-Z0-9_]/g, '')" />
                    <span v-else class="font-mono font-bold text-primary">{{ it.id }}</span>
                  </td>
                  <td class="p-2"><input v-model="it.label" :aria-label="`Label ${it.id}`" maxlength="100" class="w-full min-w-[120px] px-2 py-1 rounded border border-border bg-surface" /></td>
                  <td class="p-2 text-center"><input v-model="it.is_active" type="checkbox" :aria-label="`Aktif ${it.id}`" class="w-4 h-4 accent-primary" /></td>
                  <td class="p-2 text-right whitespace-nowrap">
                    <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === 0" aria-label="Naikkan" @click="move(sec.key, i, -1)"><ArrowUp class="w-3.5 h-3.5" /></button>
                    <button type="button" class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" :disabled="i === draft[sec.key].length - 1" aria-label="Turunkan" @click="move(sec.key, i, 1)"><ArrowDown class="w-3.5 h-3.5" /></button>
                    <button type="button" class="p-1 text-destructive hover:bg-destructive/10 rounded" :aria-label="`Hapus ${it.id}`" @click="remove(sec.key, i)"><Trash2 class="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="space-y-3">
        <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Prioritas P1 sampai P4</h4>
        <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                <th class="p-2.5">Kode</th>
                <th class="p-2.5">Label</th>
                <th class="p-2.5">Deskripsi</th>
                <th class="p-2.5">Setara SLA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="p in draft.priorities" :key="p.id">
                <td class="p-2"><span :class="['px-2 py-0.5 rounded text-xs font-bold', P_CLASS[p.id]]">{{ p.id }}</span></td>
                <td class="p-2"><input v-model="p.label" :aria-label="`Label ${p.id}`" maxlength="100" class="w-full min-w-[120px] px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2"><input v-model="p.description" :aria-label="`Deskripsi ${p.id}`" maxlength="255" class="w-full min-w-[220px] px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2 text-muted-foreground">{{ SLA_LEVEL[p.id] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Matriks Dampak x Urgensi menjadi Prioritas</h4>
          <p class="text-[11px] text-muted-foreground">Dipakai sebagai saran prioritas Insiden di form triase. Sel kosong berarti tanpa saran.</p>
        </div>
        <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                <th class="p-2.5">Dampak \ Urgensi</th>
                <th v-for="u in draft.urgencies" :key="u._k" class="p-2.5">{{ u.label || u.id }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="im in draft.impacts" :key="im._k">
                <td class="p-2.5 font-bold text-foreground">{{ im.label || im.id }}</td>
                <td v-for="u in draft.urgencies" :key="u._k" class="p-2">
                  <select
                    :value="draft.matrix[im.id]?.[u.id] ?? ''"
                    :aria-label="`${im.label} x ${u.label}`"
                    class="px-2 py-1 rounded border border-border bg-surface font-bold"
                    @change="setCell(im.id, u.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">-</option>
                    <option v-for="p in draft.priorities" :key="p.id" :value="p.id">{{ p.id }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-vue-next';
import { apiFetch } from '~/services/api';
import { useAppStore } from '~/stores/app';
import { useToast } from '~/composables/useToast';
import { useConfirmModal } from '~/composables/useConfirmModal';
import { P_TO_PRIORITY } from '~/utils/ticketSpec';
import type { TriageMaster } from '~/types';

type Row = { id: string; label: string; is_active: boolean; _k: number; _new?: boolean };
type Draft = { impacts: Row[]; urgencies: Row[]; priorities: TriageMaster['priorities']; matrix: TriageMaster['matrix'] };

const store = useAppStore();
const { toast } = useToast();
const { confirm } = useConfirmModal();

const sections = [
  { key: 'impacts' as const, title: 'Dampak' },
  { key: 'urgencies' as const, title: 'Urgensi' },
];
const P_CLASS: Record<string, string> = {
  P1: 'bg-destructive/10 text-destructive border border-destructive/20',
  P2: 'bg-warning/10 text-warning border border-warning/20',
  P3: 'bg-primary/10 text-primary border border-primary/15',
  P4: 'bg-muted text-muted-foreground border border-border',
};
const SLA_LEVEL = P_TO_PRIORITY as Record<string, string>;

let seq = 0;
const draft = ref<Draft | null>(null);
const saving = ref(false);
const snapshot = ref('');

const toDraft = (m: TriageMaster): Draft => ({
  impacts: m.impacts.map(x => ({ ...x, _k: ++seq })),
  urgencies: m.urgencies.map(x => ({ ...x, _k: ++seq })),
  priorities: m.priorities.map(p => ({ ...p })),
  matrix: JSON.parse(JSON.stringify(m.matrix)),
});
const payload = (d: Draft) => ({
  impacts: d.impacts.map(({ id, label, is_active }) => ({ id, label, is_active })),
  urgencies: d.urgencies.map(({ id, label, is_active }) => ({ id, label, is_active })),
  priorities: d.priorities,
  matrix: d.matrix,
});
const dirty = computed(() => !!draft.value && JSON.stringify(payload(draft.value)) !== snapshot.value);

function load(m: TriageMaster) {
  draft.value = toDraft(m);
  snapshot.value = JSON.stringify(payload(draft.value));
}
const reset = () => store.triageMaster && load(store.triageMaster);

function addItem(key: 'impacts' | 'urgencies') {
  draft.value![key].push({ id: '', label: '', is_active: true, _k: ++seq, _new: true });
}
function move(key: 'impacts' | 'urgencies', i: number, d: number) {
  const list = draft.value![key];
  [list[i], list[i + d]] = [list[i + d]!, list[i]!];
}
function remove(key: 'impacts' | 'urgencies', i: number) {
  const [gone] = draft.value![key].splice(i, 1);
  if (!gone) return;
  const m = draft.value!.matrix;
  if (key === 'impacts') delete m[gone.id];
  else for (const row of Object.values(m)) delete row[gone.id];
}
function setCell(impactId: string, urgencyId: string, p: string) {
  const m = draft.value!.matrix;
  (m[impactId] ??= {})[urgencyId] = p;
  if (!p) delete m[impactId]![urgencyId];
}

async function save() {
  const d = draft.value!;
  const blank = [...d.impacts, ...d.urgencies].find(x => !x.id || !x.label.trim());
  if (blank) return toast('Setiap Dampak dan Urgensi wajib punya ID dan label.', 'error', 5000);
  if (!(await confirm('Simpan Master Triase', 'Perubahan langsung berlaku untuk form triase, Dashboard, dan saran prioritas.', 'Simpan'))) return;
  saving.value = true;
  try {
    const res = await apiFetch<{ data: TriageMaster }>('/api/triage-master', { method: 'PUT', body: payload(d) });
    store.triageMaster = res.data;
    load(res.data);
    toast('Master triase tersimpan.', 'success');
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menyimpan master triase.', 'error', 6000);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (!store.triageMaster) await store.loadTriageMaster();
  if (store.triageMaster) load(store.triageMaster);
});
</script>
