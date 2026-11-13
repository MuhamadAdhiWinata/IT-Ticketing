<template>
  <div class="p-5 sm:p-6 space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-foreground">Master SLA</h3>
        <p class="text-[11px] text-muted-foreground">
          Target respon dan resolusi per prioritas. P1 sampai P4 hanya untuk tiket Insiden; jenis lain dan tiket belum ditriase memakai baris Default.
          Respon dihitung dari masuk sampai diakui. Resolusi neto = jam layanan dikurangi jeda Menunggu Pemohon.
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
      <section class="space-y-3">
        <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Target per Prioritas</h4>
        <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                <th class="p-2.5">Prioritas</th>
                <th class="p-2.5">Target Respon (jam)</th>
                <th class="p-2.5">Target Resolusi (jam)</th>
                <th class="p-2.5">Cakupan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="t in draft.targets" :key="t.priority_id">
                <td class="p-2 font-mono font-bold text-primary">{{ t.priority_id === 'DEFAULT' ? 'Default' : t.priority_id }}</td>
                <td class="p-2"><input v-model.number="t.response_hours" type="number" min="0.1" step="0.1" :aria-label="`Respon ${t.priority_id}`" class="w-28 px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2"><input v-model.number="t.resolution_hours" type="number" min="0.1" step="0.5" :aria-label="`Resolusi ${t.priority_id}`" class="w-28 px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2">
                  <select v-model="t.coverage" :aria-label="`Cakupan ${t.priority_id}`" class="px-2 py-1 rounded border border-border bg-surface">
                    <option v-for="(label, v) in COVERAGE_LABEL" :key="v" :value="v">{{ label }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h4 class="text-xs font-bold text-foreground uppercase tracking-wider">Parameter Jam Kerja</h4>
          <p class="text-[11px] text-muted-foreground">Jam kerja berlaku Senin sampai Sabtu (WIB). Minggu tidak dihitung kecuali cakupan 24/7.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <label class="text-xs font-semibold text-foreground">Jam Kerja per Hari
            <input v-model.number="draft.settings.work_hours_per_day" type="number" min="1" max="24" step="0.5" class="mt-1 w-full px-2 py-1.5 rounded border border-border bg-surface font-normal" />
          </label>
          <label class="text-xs font-semibold text-foreground">Jam Mulai (WIB, 0 sampai 23.99)
            <input v-model.number="draft.settings.work_day_start" type="number" min="0" max="23.99" step="0.5" class="mt-1 w-full px-2 py-1.5 rounded border border-border bg-surface font-normal" />
          </label>
          <label class="text-xs font-semibold text-foreground">Ambang Berisiko (%)
            <input v-model.number="riskPct" type="number" min="1" max="100" step="1" class="mt-1 w-full px-2 py-1.5 rounded border border-border bg-surface font-normal" />
          </label>
        </div>
        <p class="text-[11px] text-muted-foreground">Berisiko = waktu berjalan sudah mencapai ambang dari target tetapi belum lewat.</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiFetch } from '~/services/api';
import { useToast } from '~/composables/useToast';
import { useConfirmModal } from '~/composables/useConfirmModal';
import { COVERAGE_LABEL } from '~/utils/slaCalc';
import type { SlaMaster } from '~/types';

const { toast } = useToast();
const { confirm } = useConfirmModal();

const draft = ref<SlaMaster | null>(null);
const snapshot = ref('');
const saving = ref(false);

const dirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== snapshot.value);
const riskPct = computed({
  get: () => Math.round((draft.value?.settings.at_risk_threshold ?? 0) * 100),
  set: (v: number) => { if (draft.value) draft.value.settings.at_risk_threshold = v / 100; },
});

function load(m: SlaMaster) {
  draft.value = JSON.parse(JSON.stringify(m));
  snapshot.value = JSON.stringify(m);
}
let current: SlaMaster | null = null;
const reset = () => current && load(current);

async function save() {
  if (!(await confirm('Simpan Master SLA', 'Perubahan langsung memengaruhi status SLA semua tiket (dihitung ulang saat ditampilkan).', 'Simpan'))) return;
  saving.value = true;
  try {
    const res = await apiFetch<{ data: SlaMaster }>('/api/sla-master', { method: 'PUT', body: draft.value });
    current = res.data;
    load(res.data);
    toast('Master SLA tersimpan.', 'success');
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menyimpan master SLA.', 'error', 6000);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    current = (await apiFetch<{ data: SlaMaster }>('/api/sla-master')).data;
    load(current);
  } catch (e: any) {
    toast(e?.data?.statusMessage || 'Gagal memuat master SLA.', 'error', 6000);
  }
});
</script>
