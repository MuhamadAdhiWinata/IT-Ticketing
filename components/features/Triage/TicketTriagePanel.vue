<template>
  <div class="space-y-4">
    <!-- Data formulir pemohon -->
    <div class="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
      <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">Data Pemohon</span>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <div v-for="row in intakeRows" :key="row.label" class="flex gap-2">
          <dt class="text-muted-foreground shrink-0">{{ row.label }}:</dt>
          <dd class="font-semibold text-foreground break-words min-w-0">{{ row.value }}</dd>
        </div>
      </dl>
      <div v-if="ticket.expected_behavior" class="text-xs">
        <span class="text-muted-foreground">Yang seharusnya terjadi:</span>
        <p class="text-foreground whitespace-pre-line leading-relaxed">{{ ticket.expected_behavior }}</p>
      </div>
      <div v-if="ticket.evidence_steps" class="text-xs">
        <span class="text-muted-foreground">Langkah / bukti:</span>
        <p class="text-foreground whitespace-pre-line leading-relaxed">{{ ticket.evidence_steps }}</p>
      </div>
    </div>

    <!-- Tombol Akui / Terima / Konfirmasi Duty -->
    <div v-if="isIT && !done" class="flex flex-wrap gap-2">
      <button v-if="!ticket.acknowledged_at" type="button" :disabled="busy" @click="post('acknowledge')" class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Akui Tiket</button>
      <button v-if="isAssignee && !ticket.accepted_at" type="button" :disabled="busy" @click="post('accept')" class="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-60">Terima</button>
      <button v-if="auth.isDuty" type="button" :disabled="busy" @click="post('duty-confirm')" class="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-bold disabled:opacity-60">
        {{ ticket.duty_confirmed_at ? 'Konfirmasi Ulang Duty Engineer' : 'Konfirmasi Duty Engineer' }}
      </button>
    </div>

    <!-- Info triase / pelacakan waktu -->
    <div class="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
      <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">Triase dan Eksekusi</span>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <div v-for="row in triageRows" :key="row.label" class="flex gap-2">
          <dt class="text-muted-foreground shrink-0">{{ row.label }}:</dt>
          <dd class="font-semibold text-foreground break-words min-w-0">{{ row.value }}</dd>
        </div>
      </dl>
      <p v-if="needsDuty && !ticket.duty_confirmed_at" class="text-[11px] text-red-600 font-semibold">Insiden P1/P2 menunggu konfirmasi Duty Engineer sebelum bisa diproses.</p>
    </div>

    <!-- Form triase PM -->
    <form v-if="auth.canTriage && !done" class="p-4 rounded-lg border border-border bg-surface space-y-3" @submit.prevent="submitTriage">
      <p class="text-xs font-bold text-foreground">Triase (PM)</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AppSelect v-model="tf.ticket_type" :options="TICKET_TYPES" label="Jenis Tiket" placeholder="-- Pilih --" size="sm" />
        <AppSelect v-model="tf.catalog_item" :options="CATALOG_ITEMS" label="Butir Katalog" placeholder="-- Pilih --" size="sm" />
        <AppSelect v-model="tf.impact" :options="IMPACTS" label="Dampak" placeholder="-- Pilih --" size="sm" />
        <AppSelect v-model="tf.urgency" :options="URGENCIES" label="Urgensi" placeholder="-- Pilih --" size="sm" />
        <AppSelect v-if="tf.ticket_type === 'INSIDEN'" v-model="tf.priority" :options="P_OPTIONS" :label="`Prioritas (saran matriks: ${suggestedP || '-'})`" placeholder="-- Otomatis --" size="sm" />
        <AppSelect v-model="tf.assignee_id" :options="workerOptions" label="Pelaksana" placeholder="-- Pilih --" size="sm" searchable />
      </div>
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1">Alasan Perubahan Jenis / Prioritas</label>
        <input v-model="tf.change_reason" type="text" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs" />
      </div>
      <div v-if="tf.ticket_type === 'PL_DATA' || ticket.ticket_type === 'PL_DATA'">
        <label class="block text-xs font-semibold text-foreground mb-1">Persetujuan PIC Data <span class="text-red-500">*</span></label>
        <input v-model="tf.data_approval_note" type="text" placeholder="Catatan persetujuan (atau lampirkan berkas pada tiket)" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AppSelect v-model="tf.transfer_target" :options="TRANSFER_TARGETS" label="Tujuan Pengalihan" placeholder="-- Tidak dialihkan --" size="sm" />
        <div v-if="tf.transfer_target === 'DUPLIKAT'">
          <label class="block text-xs font-semibold text-foreground mb-1">Duplikat Dari (nomor tiket)</label>
          <input v-model="tf.duplicate_of" type="text" placeholder="TCK-..." class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono" />
        </div>
      </div>
      <p v-if="tf.transfer_target" class="text-[11px] text-red-600">Pengalihan menutup tiket ini (status Dialihkan).</p>
      <div class="flex justify-end">
        <button type="submit" :disabled="busy" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Simpan Triase</button>
      </div>
    </form>

    <!-- Eksekusi Pelaksana -->
    <form v-if="isIT && !done" class="p-4 rounded-lg border border-border bg-surface space-y-3" @submit.prevent="submitExecution">
      <p class="text-xs font-bold text-foreground">Eksekusi (Pelaksana)</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AppSelect v-model="ef.blocked_by" :options="BLOCKED_BY" label="Tertahan Oleh" placeholder="-- Tidak tertahan --" size="sm" />
        <div>
          <label class="block text-xs font-semibold text-foreground mb-1.5">Tautan Task Odoo</label>
          <input v-model="ef.odoo_task_url" type="url" placeholder="https://..." class="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-xs" />
        </div>
      </div>
      <div class="flex flex-wrap justify-between gap-2">
        <button v-if="isWaiting" type="button" :disabled="busy" @click="run('execution', { waiting: false })" class="px-3 py-2 rounded-lg border border-border text-xs font-bold">Pemohon Sudah Menjawab</button>
        <button v-else type="button" :disabled="busy || ticket.status !== 'PROCESS'" @click="run('execution', { waiting: true })" class="px-3 py-2 rounded-lg border border-border text-xs font-bold disabled:opacity-50">Menunggu Pemohon</button>
        <button type="submit" :disabled="busy" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Simpan</button>
      </div>
    </form>

    <div v-if="auth.canTriage && ticket.status === 'SELESAI' && !ticket.closed_at && !ticket.transfer_target" class="flex justify-end">
      <button type="button" :disabled="busy" @click="post('close')" class="px-3 py-2 rounded-lg border border-border bg-surface text-xs font-bold">Tutup Tiket</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Ticket } from '~/types';
import { useAppStore } from '~/stores/app';
import { useAuthStore } from '~/stores/auth';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import { isITRole } from '~/utils/roles';
import {
  TICKET_TYPES, IMPACTS, URGENCIES, CATALOG_ITEMS, TRANSFER_TARGETS, BLOCKED_BY, AFFECTED_SCOPES, WORK_STATUSES, CHANNELS,
  labelOf, priorityFromMatrix, needsDutyConfirm,
} from '~/utils/ticketSpec';
import AppSelect from '~/components/common/AppSelect.vue';

const props = defineProps<{ ticket: Ticket }>();
const store = useAppStore();
const auth = useAuthStore();
const { showError } = useModal();
const { toast } = useToast();
const busy = ref(false);

const P_OPTIONS = ['P1', 'P2', 'P3', 'P4'].map(v => ({ value: v, label: v }));

const isIT = computed(() => isITRole(store.currentUser?.role));
const isAssignee = computed(() => props.ticket.assignedTo === store.currentUser?.id);
const done = computed(() => props.ticket.status === 'SELESAI');
const isWaiting = computed(() => !!props.ticket.waiting_started_at && !props.ticket.waiting_ended_at);
const needsDuty = computed(() => needsDutyConfirm(props.ticket.ticket_type, props.ticket.priority));
const workerOptions = computed(() => store.allUsers.filter(u => isITRole(u.role)).map(u => ({ value: u.id, label: u.name })));

const fmt = (v?: string | null) => (v ? v.replace('T', ' ').slice(0, 16) : '-');

const intakeRows = computed(() => {
  const t = props.ticket;
  const rows = [
    { label: 'Unit', value: t.unit || '-' },
    { label: 'Kanal Asal', value: labelOf(CHANNELS, t.channel) },
    { label: 'Sejak kapan', value: fmt(t.since_at) },
    { label: 'Jumlah terdampak', value: labelOf(AFFECTED_SCOPES, t.affected_scope) || '-' },
    { label: 'Pekerjaan', value: labelOf(WORK_STATUSES, t.work_status) || '-' },
    { label: 'Acara / tryout', value: t.is_event ? 'Ya' : 'Tidak' },
  ];
  if (t.workaround) rows.push({ label: 'Cara lain', value: t.workaround });
  return rows;
});

const triageRows = computed(() => {
  const t = props.ticket;
  const rows = [
    { label: 'Status', value: t.status_label || t.status },
    { label: 'Jenis', value: labelOf(TICKET_TYPES, t.ticket_type) || 'Belum ditriase' },
    { label: 'Dampak / Urgensi', value: `${labelOf(IMPACTS, t.impact) || '-'} / ${labelOf(URGENCIES, t.urgency) || '-'}` },
    { label: 'Prioritas', value: t.ticket_type === 'INSIDEN' ? (t.p_level || '-') : '-' },
    { label: 'Diakui', value: fmt(t.acknowledged_at) },
    { label: 'Diterima Pelaksana', value: fmt(t.accepted_at) },
  ];
  if (t.catalog_item) rows.push({ label: 'Butir katalog', value: t.catalog_item });
  if (t.duty_confirmed_at) rows.push({ label: 'Duty Engineer', value: `${t.duty_confirmed_by} (${fmt(t.duty_confirmed_at)})` });
  if (t.change_reason) rows.push({ label: 'Alasan perubahan', value: t.change_reason });
  if (t.data_approval_note) rows.push({ label: 'Persetujuan PIC data', value: t.data_approval_note });
  if (t.waiting_started_at) rows.push({ label: 'Menunggu Pemohon', value: `${fmt(t.waiting_started_at)} s/d ${fmt(t.waiting_ended_at)}` });
  if (t.blocked_by) rows.push({ label: 'Tertahan oleh', value: labelOf(BLOCKED_BY, t.blocked_by) });
  if (t.transfer_target) rows.push({ label: 'Dialihkan ke', value: labelOf(TRANSFER_TARGETS, t.transfer_target) });
  if (t.referenced_ticket_id) rows.push({ label: 'Duplikat dari', value: t.referenced_ticket_id });
  if (t.odoo_task_url) rows.push({ label: 'Task Odoo', value: t.odoo_task_url });
  rows.push({ label: 'Dibuka ulang', value: `${t.reopen_count ?? 0}x` });
  return rows;
});

const blankTf = () => ({
  ticket_type: props.ticket.ticket_type || '', impact: props.ticket.impact || '', urgency: props.ticket.urgency || '',
  priority: '', catalog_item: props.ticket.catalog_item || '', assignee_id: props.ticket.assignedTo || '',
  change_reason: '', data_approval_note: props.ticket.data_approval_note || '', transfer_target: '', duplicate_of: '',
});
const tf = reactive(blankTf());
const ef = reactive({ blocked_by: props.ticket.blocked_by || '', odoo_task_url: props.ticket.odoo_task_url || '' });
watch(() => props.ticket.id, () => {
  Object.assign(tf, blankTf());
  Object.assign(ef, { blocked_by: props.ticket.blocked_by || '', odoo_task_url: props.ticket.odoo_task_url || '' });
});

const suggestedP = computed(() => priorityFromMatrix(tf.impact, tf.urgency));

async function run(path: string, body?: Record<string, unknown>, okMsg = 'Tersimpan.') {
  busy.value = true;
  try {
    await apiFetch(`/api/tickets/${props.ticket.id}/${path}`, { method: 'POST', body });
    await store.refreshTicket(props.ticket.id);
    toast(okMsg, 'success');
  } catch (e: any) {
    showError('Gagal', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    busy.value = false;
  }
}
const post = (path: string) => run(path);

function submitTriage() {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tf)) if (v) body[k] = v;
  if (tf.ticket_type !== 'INSIDEN') delete body.priority;
  run('triage', body, 'Triase tersimpan.').then(() => { tf.change_reason = ''; tf.priority = ''; tf.transfer_target = ''; tf.duplicate_of = ''; });
}

function submitExecution() {
  run('execution', { blocked_by: ef.blocked_by || null, odoo_task_url: ef.odoo_task_url.trim() || null });
}
</script>
