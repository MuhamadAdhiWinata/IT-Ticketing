<template>
  <div class="space-y-4">
    <!-- Tanpa phase: data formulir pemohon -->
    <div v-if="!phase" class="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
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
        <div class="rich-text text-foreground" v-html="toSafeHtml(ticket.evidence_steps)"></div>
      </div>
    </div>

    <template v-else>
      <!-- Baru -->
      <div v-if="phase === 'Baru'" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          Tiket baru dibuat {{ fmt(ticket.created_at) }}.
          <template v-if="!auth.canTriage">Menunggu PM mengakui tiket.</template>
        </p>
        <button v-if="auth.canTriage && !ticket.acknowledged_at && !done" type="button" :disabled="busy" @click="post('acknowledge')" class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Akui Tiket</button>
      </div>

      <!-- Diakui -->
      <div v-else-if="phase === 'Diakui'" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          Diakui {{ fmt(ticket.acknowledged_at) }}.
          <template v-if="!ticket.triaged_at && !done">Menunggu PM memulai triase.</template>
          <template v-else-if="ticket.triaged_at">Triase dimulai {{ fmt(ticket.triaged_at) }}.</template>
        </p>
        <button v-if="auth.canTriage && ticket.acknowledged_at && !ticket.triaged_at && !done" type="button" :disabled="busy" @click="post('start-triage')" class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Mulai Triase</button>
      </div>

      <!-- Ditriase -->
      <template v-else-if="phase === 'Ditriase'">
        <p v-if="needsDuty && !ticket.duty_confirmed_at" class="text-[11px] text-red-600 font-semibold">Insiden P1/P2 menunggu konfirmasi Duty Engineer sebelum bisa dikerjakan.</p>

        <form v-if="auth.canTriage && !done" class="p-4 rounded-lg border border-border bg-surface space-y-3" @submit.prevent="submitTriage">
          <p class="text-xs font-bold text-foreground">Triase (PM)</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppSelect v-model="tf.ticket_type" :options="TICKET_TYPES" label="Jenis Tiket" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.catalog_item" :options="CATALOG_ITEMS" label="Butir Katalog" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.impact" :options="IMPACTS" label="Dampak" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.urgency" :options="URGENCIES" label="Urgensi" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-if="tf.ticket_type === 'INSIDEN'" v-model="tf.priority" :options="P_OPTIONS" :label="`Prioritas (saran matriks: ${suggestedP || '-'})`" placeholder="-- Otomatis --" size="sm" />
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
          <p v-if="tf.transfer_target" class="text-[11px] text-red-600">Pengalihan menutup tiket ini (hasil Dialihkan).</p>
          <div class="flex justify-end">
            <button type="submit" :disabled="busy" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Simpan Triase</button>
          </div>
        </form>

        <div v-if="isIT && !done" class="flex flex-wrap items-center gap-2">
          <button v-if="auth.isDuty" type="button" :disabled="busy" @click="post('duty-confirm')" class="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-bold disabled:opacity-60">
            {{ ticket.duty_confirmed_at ? 'Konfirmasi Ulang Duty Engineer' : 'Konfirmasi Duty Engineer' }}
          </button>
          <button v-if="auth.canTriage && ticket.status === 'DRAFT'" type="button" :disabled="busy || !canStart" @click="startWork" class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">Mulai Dikerjakan</button>
          <span v-if="auth.canTriage && ticket.status === 'DRAFT' && !canStart" class="text-[11px] text-muted-foreground">{{ startHint }}</span>
        </div>
      </template>

      <!-- Dikerjakan -->
      <template v-else-if="phase === 'Dikerjakan'">
        <p v-if="ticket.delegation" class="text-xs text-muted-foreground">
          Didelegasikan ke <strong class="text-foreground">{{ ticket.delegation.vendor_name || ticket.delegation.technician_name || 'pihak luar' }}</strong>.
        </p>
        <div v-if="isIT && !done" class="flex flex-wrap items-center gap-2">
          <p v-if="!ticket.assignedTo" class="text-xs text-muted-foreground">Belum ada Pelaksana. Worker dapat mengambil tiket, atau PM menugaskan.</p>
          <button v-if="!ticket.assignedTo && !auth.canTriage" type="button" :disabled="busy" @click="takeTicket" class="px-3 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold disabled:opacity-60">Ambil Tiket</button>
          <AppSelect
            v-if="auth.canTriage"
            :modelValue="ticket.assignedTo || ''"
            @update:modelValue="(v: string) => assign(v)"
            :options="workerOptions"
            label="Tugaskan Pelaksana"
            placeholder="-- Pilih --"
            size="sm"
            searchable
          />
          <button v-if="isAssignee && !ticket.accepted_at" type="button" :disabled="busy" @click="post('accept')" class="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-60">Terima</button>
        </div>
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
            <button type="button" :disabled="busy || ticket.status !== 'PROCESS'" @click="run('execution', { waiting: true })" class="px-3 py-2 rounded-lg border border-border text-xs font-bold disabled:opacity-50">Menunggu Pemohon</button>
            <button type="submit" :disabled="busy" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">Simpan</button>
          </div>
        </form>
      </template>

      <!-- Menunggu Pemohon -->
      <div v-else-if="phase === 'Menunggu Pemohon'" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          Menunggu pemohon sejak {{ fmt(ticket.waiting_started_at) }}<template v-if="ticket.waiting_ended_at">, dijawab {{ fmt(ticket.waiting_ended_at) }}</template>.
        </p>
        <button v-if="isIT && isWaiting && !done" type="button" :disabled="busy" @click="run('execution', { waiting: false })" class="px-3 py-2 rounded-lg border border-border text-xs font-bold disabled:opacity-60">Pemohon Sudah Menjawab</button>
      </div>

      <!-- Selesai / Ditutup / Dialihkan -->
      <div v-else-if="phase === 'Selesai'" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          <template v-if="done">Hasil akhir: <strong class="text-foreground">{{ ticket.status_label }}</strong>, {{ fmt(ticket.completed_at) }}.</template>
          <template v-else>Tiket belum selesai.</template>
        </p>
        <div v-if="done" class="flex flex-wrap gap-2">
          <button v-if="auth.canTriage && !ticket.closed_at && !ticket.transfer_target" type="button" :disabled="busy" @click="post('close')" class="px-3 py-2 rounded-lg border border-border bg-surface text-xs font-bold disabled:opacity-60">Tutup Tiket</button>
          <button v-if="isIT" type="button" :disabled="busy" @click="reopen" class="px-3 py-2 rounded-lg border border-border bg-surface text-xs font-bold disabled:opacity-60">Buka Ulang</button>
        </div>
      </div>

      <!-- Ringkasan triase / eksekusi -->
      <dl v-if="phase !== 'Baru' && summaryRows.length" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs pt-2 border-t border-border">
        <div v-for="row in summaryRows" :key="row.label" class="flex gap-2">
          <dt class="text-muted-foreground shrink-0">{{ row.label }}:</dt>
          <dd class="font-semibold text-foreground break-words min-w-0">{{ row.value }}</dd>
        </div>
      </dl>
    </template>
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
  labelOf, priorityFromMatrix, needsDutyConfirm, type Phase,
} from '~/utils/ticketSpec';
import AppSelect from '~/components/common/AppSelect.vue';
import { toSafeHtml } from '~/utils/richText';

const props = defineProps<{ ticket: Ticket; phase?: Phase }>();
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

// Mulai Dikerjakan: triase harus terisi dulu; Insiden P1/P2 juga butuh Duty Engineer.
const canStart = computed(() => !!props.ticket.ticket_type && (!needsDuty.value || !!props.ticket.duty_confirmed_at));
const startHint = computed(() => (!props.ticket.ticket_type ? 'Isi triase (Jenis Tiket) dulu.' : 'Menunggu konfirmasi Duty Engineer.'));

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

const summaryRows = computed(() => {
  const t = props.ticket;
  const rows: { label: string; value: string }[] = [];
  const add = (label: string, value?: string | null) => { if (value) rows.push({ label, value }); };
  add('Jenis', labelOf(TICKET_TYPES, t.ticket_type));
  if (t.impact || t.urgency) add('Dampak / Urgensi', `${labelOf(IMPACTS, t.impact) || '-'} / ${labelOf(URGENCIES, t.urgency) || '-'}`);
  if (t.ticket_type === 'INSIDEN') add('Prioritas', t.p_level);
  add('Butir katalog', t.catalog_item);
  add('Pelaksana', t.assignedToName);
  add('Diakui', t.acknowledged_at ? fmt(t.acknowledged_at) : null);
  add('Diterima Pelaksana', t.accepted_at ? fmt(t.accepted_at) : null);
  if (t.duty_confirmed_at) add('Duty Engineer', `${t.duty_confirmed_by} (${fmt(t.duty_confirmed_at)})`);
  add('Alasan perubahan', t.change_reason);
  add('Persetujuan PIC data', t.data_approval_note);
  if (t.waiting_started_at) add('Menunggu Pemohon', `${fmt(t.waiting_started_at)} s/d ${fmt(t.waiting_ended_at)}`);
  add('Tertahan oleh', labelOf(BLOCKED_BY, t.blocked_by) || null);
  add('Dialihkan ke', labelOf(TRANSFER_TARGETS, t.transfer_target) || null);
  add('Duplikat dari', t.referenced_ticket_id);
  add('Task Odoo', t.odoo_task_url);
  add('Dibuka ulang', `${t.reopen_count ?? 0}x`);
  return rows;
});

const blankTf = () => ({
  ticket_type: props.ticket.ticket_type || '', impact: props.ticket.impact || '', urgency: props.ticket.urgency || '',
  priority: '', catalog_item: props.ticket.catalog_item || '',
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
const assign = (userId: string) => { if (userId && userId !== props.ticket.assignedTo) run('assignee', { userId }, 'Pelaksana diperbarui.'); };
const takeTicket = () => run('assignee', { userId: store.currentUser!.id }, 'Tiket diambil.');

function submitTriage() {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tf)) if (v) body[k] = v;
  if (tf.ticket_type !== 'INSIDEN') delete body.priority;
  run('triage', body, 'Triase tersimpan.').then(() => { tf.change_reason = ''; tf.priority = ''; tf.transfer_target = ''; tf.duplicate_of = ''; });
}

function submitExecution() {
  run('execution', { blocked_by: ef.blocked_by || null, odoo_task_url: ef.odoo_task_url.trim() || null });
}

async function startWork() {
  busy.value = true;
  try {
    await store.completeStage(props.ticket.id, 'START_WORK');
    toast('Tiket mulai dikerjakan.', 'success');
  } catch (e: any) {
    showError('Gagal Memulai Pekerjaan', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    busy.value = false;
  }
}

function reopen() {
  if (window.confirm('Buka ulang tiket ini? Jumlah pembukaan ulang bertambah satu.')) run('reopen', undefined, 'Tiket dibuka ulang.');
}
</script>
