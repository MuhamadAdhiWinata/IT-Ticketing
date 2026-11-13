<template>
  <form class="p-4 rounded-lg border border-border bg-surface space-y-3" @submit.prevent="submit()">
    <p class="text-xs font-bold text-foreground">Eksekusi (Pelaksana)</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AppSelect v-model="ef.blocked_by" :options="BLOCKED_BY" label="Tertahan Oleh" placeholder="-- Tidak tertahan --" size="sm" />
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1.5">Tautan Task Odoo</label>
        <input v-model="ef.odoo_task_url" type="url" placeholder="https://..." class="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-xs" />
      </div>
    </div>

    <p class="text-xs font-bold text-foreground">Solusi Penyelesaian</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AppSelect v-model="ef.solution_type" :options="SOLUTION_TYPES" label="Jenis Solusi" placeholder="-- Belum dipilih --" size="sm" />
      <div v-if="ef.solution_type === 'SEMENTARA'">
        <label class="block text-xs font-semibold text-foreground mb-1.5">Tautan Utang Teknis <span class="text-red-500">*</span></label>
        <input v-model="ef.tech_debt_url" type="url" placeholder="https://..." class="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-xs" />
      </div>
    </div>
    <textarea v-model="ef.resolution_summary" rows="3" aria-label="Ringkasan solusi" placeholder="Jelaskan solusi yang diterapkan..." class="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground" />

    <div v-if="!saved || dirty" class="flex justify-end gap-2">
      <button v-if="saved" type="button" :disabled="!!busy" class="px-4 py-2 rounded-lg border border-border text-xs font-bold" @click="Object.assign(ef, fromTicket())">Batalkan Perubahan</button>
      <button type="submit" :disabled="busy === 'save'" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">{{ busy === 'save' ? 'Menyimpan...' : saved ? 'Update Eksekusi' : 'Simpan Eksekusi' }}</button>
    </div>
    <button
      type="button"
      :disabled="busy === 'wait' || ticket.status !== 'PROCESS' || !solutionReady"
      class="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
      @click="submit(true)"
    >
      <Clock class="w-4 h-4" />
      <span>{{ busy === 'wait' ? 'Memproses...' : 'Kirim ke Pemohon' }}</span>
    </button>
    <p class="text-[11px] text-muted-foreground text-center">
      {{ solutionReady ? 'Hasil dikirim ke pemohon untuk dicek. Tiket masuk fase Menunggu Pemohon.' : 'Isi Jenis Solusi dan ringkasan solusi dulu (Utang Teknis wajib bila Sementara).' }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import { Clock } from 'lucide-vue-next';
import type { Ticket } from '~/types';
import { useAppStore } from '~/stores/app';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import { BLOCKED_BY, SOLUTION_TYPES } from '~/utils/ticketSpec';
import AppSelect from '~/components/common/AppSelect.vue';

const props = defineProps<{ ticket: Ticket }>();
const store = useAppStore();
const { showError } = useModal();
const { toast } = useToast();
const busy = ref<'' | 'save' | 'wait'>('');

const fromTicket = () => ({
  blocked_by: props.ticket.blocked_by || '',
  odoo_task_url: props.ticket.odoo_task_url || '',
  solution_type: props.ticket.solution_type || '',
  resolution_summary: props.ticket.resolution_summary || '',
  tech_debt_url: props.ticket.tech_debt_url || '',
});
const ef = reactive(fromTicket());
watch(() => props.ticket.id, () => Object.assign(ef, fromTicket()));
const saved = computed(() => Object.values(fromTicket()).some(Boolean));
const solutionReady = computed(() => !!ef.solution_type && !!ef.resolution_summary.trim()
  && (ef.solution_type !== 'SEMENTARA' || !!ef.tech_debt_url.trim()));
const dirty = computed(() => JSON.stringify(ef) !== JSON.stringify(fromTicket()));

// "Menunggu Pemohon" ikut menyimpan isian form agar tidak hilang.
async function submit(waiting = false) {
  if (busy.value) return;
  busy.value = waiting ? 'wait' : 'save';
  try {
    await apiFetch(`/api/tickets/${props.ticket.id}/execution`, {
      method: 'POST',
      body: {
        blocked_by: ef.blocked_by || null,
        odoo_task_url: ef.odoo_task_url.trim() || null,
        solution_type: ef.solution_type || null,
        resolution_summary: ef.resolution_summary.trim() || null,
        tech_debt_url: ef.solution_type === 'SEMENTARA' ? ef.tech_debt_url.trim() || null : null,
        ...(waiting ? { waiting: true } : {}),
      },
    });
    await store.refreshTicket(props.ticket.id);
    Object.assign(ef, fromTicket());
    toast(waiting ? 'Hasil dikirim ke pemohon.' : 'Tersimpan.', 'success');
  } catch (e: any) {
    showError('Gagal', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    busy.value = '';
  }
}
</script>
