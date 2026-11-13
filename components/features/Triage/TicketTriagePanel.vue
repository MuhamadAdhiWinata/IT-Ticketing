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
          <p class="text-xs font-bold text-foreground">{{ triaged ? 'Triase (PM) · tersimpan, dapat diubah' : 'Triase (PM)' }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppSelect v-model="tf.ticket_type" :options="TICKET_TYPES" label="Jenis Tiket" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.urgency" :options="urgencyOptions" label="Urgensi" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.impact" :options="impactOptions" label="Dampak" placeholder="-- Pilih --" size="sm" />
            <AppSelect v-model="tf.priority" :options="P_OPTIONS" :disabled="!!tf.ticket_type && tf.ticket_type !== 'INSIDEN'" :label="`Prioritas (saran matriks: ${suggestedP || '-'})`" :placeholder="!!tf.ticket_type && tf.ticket_type !== 'INSIDEN' ? 'Hanya untuk Insiden' : '-- Otomatis --'" size="sm" />
            <AppSelect v-model="tf.data_complete" :options="DATA_COMPLETE" label="Data Lengkap Saat Masuk" placeholder="-- Belum dinilai --" size="sm" />
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
          <div v-if="!triaged || triageDirty" class="flex justify-end gap-2">
            <button v-if="triaged" type="button" :disabled="busy" class="px-4 py-2 rounded-lg border border-border text-xs font-bold" @click="Object.assign(tf, blankTf())">Batalkan Perubahan</button>
            <button type="submit" :disabled="busy" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60">{{ triaged ? 'Update Triase' : 'Simpan Triase' }}</button>
          </div>
        </form>

        <div v-if="isIT && !done" class="flex flex-wrap items-center gap-2">
          <button v-if="auth.isDuty" type="button" :disabled="busy" @click="post('duty-confirm')" class="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs font-bold disabled:opacity-60">
            {{ ticket.duty_confirmed_at ? 'Konfirmasi Ulang Duty Engineer' : 'Konfirmasi Duty Engineer' }}
          </button>
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
          <button v-if="ticket.assignedTo && !auth.canTriage && !isAssignee && !isMember" type="button" :disabled="busy" @click="joinTicket" class="px-3 py-2 rounded-lg border border-border bg-surface text-xs font-bold disabled:opacity-60">Gabung sebagai Pelaksana</button>
          <div v-if="auth.canTriage" class="w-full space-y-1.5">
            <span class="block text-xs font-semibold text-foreground">Pelaksana</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <span v-if="ticket.assignedTo" class="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">{{ ticket.assignedToName }} · Utama</span>
              <span v-for="m in ticket.members" :key="m.id" class="px-2 py-1 rounded-lg bg-muted border border-border text-[11px] font-semibold text-foreground">{{ m.user_name }}</span>
              <button type="button" :disabled="busy" class="px-2.5 py-1 rounded-lg border border-dashed border-border text-[11px] font-bold text-primary disabled:opacity-60" @click="pickerOpen = true">
                {{ ticket.assignedTo ? 'Atur Pelaksana' : 'Pilih Pelaksana' }}
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground">Pilih satu atau lebih. {{ ticket.assignedTo ? 'Pelaksana utama tidak berubah.' : 'Yang pertama dipilih menjadi pelaksana utama.' }}</p>
          </div>
          <WorkerPickerModal :show="pickerOpen" :users="pickerUsers" :initial="memberIds" @close="pickerOpen = false" @confirm="savePelaksana" />
          <button v-if="isAssignee && !ticket.accepted_at" type="button" :disabled="busy" @click="post('accept')" class="px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-60">Terima</button>
        </div>
        <!-- Form Eksekusi (Tertahan Oleh, Odoo, Solusi, Menunggu Pemohon) ada paling bawah di TicketDetailView -->
      </template>

      <!-- Menunggu Pemohon -->
      <div v-else-if="phase === 'Menunggu Pemohon'" class="space-y-3">
        <!-- Status: siapa yang sedang ditunggu -->
        <div :class="['rounded-lg border p-3 text-xs space-y-0.5', reviewTone]">
          <p class="font-bold">{{ reviewHeadline }}</p>
          <p class="opacity-90">{{ reviewHint }}</p>
        </div>

        <!-- Timeline: tiap langkah punya pelaku dan waktu -->
        <ol class="space-y-0">
          <li v-for="(s, i) in reviewSteps" :key="s.label" class="flex gap-3">
            <div class="flex flex-col items-center">
              <span :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', s.at ? 'bg-primary border-primary text-primary-foreground' : s.next ? 'border-primary bg-surface' : 'border-border bg-surface']">
                <Check v-if="s.at" class="w-3 h-3" />
              </span>
              <span v-if="i < reviewSteps.length - 1" :class="['w-0.5 flex-1 min-h-4', s.at ? 'bg-primary' : 'bg-border']"></span>
            </div>
            <div class="pb-3 min-w-0">
              <p :class="['text-xs font-bold', s.at || s.next ? 'text-foreground' : 'text-muted-foreground']">{{ s.label }}</p>
              <p class="text-[11px] text-muted-foreground">{{ s.at ? `${fmt(s.at)} · ${s.by || '-'}` : s.next ? s.pending : 'Belum' }}</p>
            </div>
          </li>
        </ol>

        <!-- Aksi pemohon -->
        <div v-if="isRequester && !ticket.verified_at" class="space-y-2">
          <button v-if="!ticket.review_started_at" type="button" :disabled="busy" class="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5" @click="review('start', 'Pengecekan dimulai.')">
            <Eye class="w-4 h-4" /><span>Mulai Cek Hasil</span>
          </button>
          <div v-else class="flex flex-col sm:flex-row gap-2">
            <button type="button" :disabled="busy" class="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5" @click="review('pass', 'Hasil dinyatakan sesuai.')">
              <Check class="w-4 h-4" /><span>Lolos Pengecekan</span>
            </button>
            <button type="button" :disabled="busy" class="w-full sm:w-auto px-4 py-2.5 border border-border bg-surface text-xs font-bold rounded-lg disabled:opacity-60" @click="openReason('reject')">Belum Sesuai</button>
          </div>
        </div>

        <!-- Aksi PM -->
        <div v-if="auth.canTriage && !done" class="pt-3 border-t border-border space-y-2">
          <p class="text-[11px] font-bold text-foreground">Keputusan PM</p>
          <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <button type="button" :disabled="busy || !ticket.verified_at" class="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed" @click="review('finish', 'Tiket selesai.', { outcome: 'SELESAI' })">Selesaikan</button>
            <button type="button" :disabled="busy || !ticket.verified_at" class="w-full sm:w-auto px-4 py-2.5 border border-border bg-surface text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" @click="review('finish', 'Tiket ditutup.', { outcome: 'DITUTUP' })">Tutup</button>
            <button type="button" :disabled="busy || !ticket.verified_at" class="w-full sm:w-auto px-4 py-2.5 border border-border bg-surface text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" @click="openReason('transfer')">Alihkan</button>
            <button v-if="!ticket.verified_at" type="button" :disabled="busy" class="w-full sm:w-auto px-4 py-2.5 border border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/5 text-xs font-bold rounded-lg disabled:opacity-60 sm:ml-auto" @click="openReason('skip')">Lewati Pengecekan</button>
          </div>
          <p v-if="!ticket.verified_at" class="text-[11px] text-muted-foreground">Terbuka setelah pemohon lolos pengecekan, atau setelah Anda melewati pengecekan.</p>
        </div>

        <!-- Isian alasan / tujuan pengalihan -->
        <form v-if="reasonMode" class="p-3 rounded-lg border border-border bg-surface space-y-2" @submit.prevent="submitReason">
          <template v-if="reasonMode === 'transfer'">
            <AppSelect v-model="transferForm.target" :options="TRANSFER_TARGETS" label="Tujuan Pengalihan" placeholder="-- Pilih --" size="sm" />
            <div v-if="transferForm.target === 'DUPLIKAT'">
              <label class="block text-xs font-semibold text-foreground mb-1">Duplikat Dari (nomor tiket)</label>
              <input v-model="transferForm.duplicate_of" type="text" placeholder="TCK-..." class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono" />
            </div>
            <p class="text-[11px] text-red-600">Pengalihan menutup tiket ini (hasil Dialihkan).</p>
          </template>
          <template v-else>
            <label class="block text-xs font-semibold text-foreground">
              {{ reasonMode === 'reject' ? 'Alasan hasil belum sesuai' : 'Alasan melewati pengecekan pemohon' }} <span class="text-red-500">*</span>
            </label>
            <textarea v-model="reasonText" rows="3" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs" :placeholder="reasonMode === 'reject' ? 'Apa yang belum sesuai? Tiket kembali ke Dikerjakan.' : 'Cth: pemohon tidak merespons 3 hari, sudah dikonfirmasi lewat telepon.'" />
            <p class="text-[11px] text-muted-foreground">{{ reasonMode === 'reject' ? 'Alasan tercatat di histori dan dikirim ke Pelaksana.' : 'Dicatat sebagai "diputuskan tanpa konfirmasi pemohon" dan diberitahukan ke pemohon.' }}</p>
          </template>
          <div class="flex justify-end gap-2">
            <button type="button" class="px-4 py-2 rounded-lg border border-border text-xs font-bold" @click="reasonMode = ''">Batal</button>
            <button type="submit" :disabled="busy || !canSubmitReason" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
              {{ reasonMode === 'reject' ? 'Kembalikan ke Dikerjakan' : reasonMode === 'skip' ? 'Lewati Pengecekan' : 'Alihkan Tiket' }}
            </button>
          </div>
        </form>
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
      <div v-if="phase !== 'Baru' && summaryGroups.length" class="space-y-3 pt-3 border-t border-border">
        <section v-for="g in summaryGroups" :key="g.title" class="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
          <h5 class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{{ g.title }}</h5>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div v-for="row in g.rows" :key="row.label" class="min-w-0">
              <dt class="text-[11px] text-muted-foreground mb-0.5">{{ row.label }}</dt>
              <dd class="min-w-0 break-words flex flex-wrap items-center gap-x-2 gap-y-1">
                <a v-if="row.href" :href="row.href" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary underline break-all">{{ row.value }}</a>
                <span v-else :class="row.muted ? 'text-muted-foreground' : 'font-semibold text-foreground'">{{ row.value }}</span>
                <span v-if="row.status" :class="['px-1.5 py-0.5 rounded text-[10px] font-bold', SLA_BADGE[row.status]]">{{ SLA_STATUS_LABEL[row.status] }}</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Check, Eye } from 'lucide-vue-next';
import { dbUtcToIso } from '~/utils/utcTime';
import type { Ticket } from '~/types';
import { useAppStore } from '~/stores/app';
import { useAuthStore } from '~/stores/auth';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import { isITRole } from '~/utils/roles';
import {
  TICKET_TYPES, TRANSFER_TARGETS, BLOCKED_BY, AFFECTED_SCOPES, WORK_STATUSES, CHANNELS,
  labelOf, priorityFromMatrix, needsDutyConfirm, type Phase,
} from '~/utils/ticketSpec';
import { COVERAGE_LABEL, SLA_STATUS_LABEL, type SlaStatus } from '~/utils/slaCalc';
import AppSelect from '~/components/common/AppSelect.vue';
import WorkerPickerModal from '~/components/common/WorkerPickerModal.vue';
import { toSafeHtml } from '~/utils/richText';

const props = defineProps<{ ticket: Ticket; phase?: Phase }>();
const store = useAppStore();
const auth = useAuthStore();
const { showError } = useModal();
const { toast } = useToast();
const busy = ref(false);

const DATA_COMPLETE = [{ value: 'YA', label: 'Ya' }, { value: 'TIDAK', label: 'Tidak' }];
// Pilihan P1-P4 menampilkan target SLA-nya (master SLA) agar PM bisa membandingkan sebelum memilih.
const P_OPTIONS = computed(() => (store.triageMaster?.priorities ?? []).map((p) => {
  const t = store.slaMaster?.targets.find(x => x.priority_id === p.id);
  return {
    value: p.id,
    label: p.id,
    detail: t ? `${p.label} · Respon ${t.response_hours} jam · Resolusi ${t.resolution_hours} jam · ${COVERAGE_LABEL[t.coverage]}` : p.label,
  };
}));

const isIT = computed(() => isITRole(store.currentUser?.role));
const isAssignee = computed(() => props.ticket.assignedTo === store.currentUser?.id);
const done = computed(() => props.ticket.status === 'SELESAI');
const needsDuty = computed(() => needsDutyConfirm(props.ticket.ticket_type, props.ticket.priority));
const isMember = computed(() => (props.ticket.members ?? []).some(m => m.user_id === store.currentUser?.id));
const memberIds = computed(() => (props.ticket.members ?? []).map(m => m.user_id));
// Pelaksana utama (assignedTo) tidak ikut daftar pilihan; dia tetap utama.
const pickerOpen = ref(false);
const pickerUsers = computed(() => store.allUsers.filter(u => isITRole(u.role) && u.id !== props.ticket.assignedTo));

const fmt = (v?: string | null) => (v ? v.replace('T', ' ').slice(0, 16) : '-');

// ── Fase Menunggu Pemohon: kirim -> mulai cek -> lolos -> keputusan PM ──
const isRequester = computed(() => props.ticket.requestedBy === store.currentUser?.id);
const sinceText = (v?: string | null) => {
  if (!v) return '';
  const min = Math.max(0, Math.floor((Date.now() - new Date(dbUtcToIso(v)).getTime()) / 60000));
  if (min < 60) return `${min} menit`;
  if (min < 1440) return `${Math.floor(min / 60)} jam`;
  return `${Math.floor(min / 1440)} hari`;
};
const reviewHeadline = computed(() => {
  const t = props.ticket;
  if (t.verified_at) return t.review_skipped ? 'Pengecekan dilewati PM' : 'Lolos pengecekan pemohon';
  if (t.review_started_at) return `Pemohon sedang mengecek (${sinceText(t.review_started_at)})`;
  return `Belum ada aksi pemohon sejak ${fmt(t.waiting_started_at)} (${sinceText(t.waiting_started_at)})`;
});
const reviewHint = computed(() => {
  const t = props.ticket;
  if (t.verified_at) return auth.canTriage ? 'Pilih keputusan akhir di bawah.' : 'Menunggu keputusan PM.';
  if (isRequester.value) return t.review_started_at ? 'Periksa hasilnya, lalu nyatakan Lolos atau Belum Sesuai.' : 'Hasil sudah dikirim ke Anda. Klik Mulai Cek Hasil, lalu periksa.';
  if (t.review_started_at) return 'Menunggu pemohon menyatakan Lolos atau Belum Sesuai.';
  return 'Menunggu pemohon membuka dan mulai mengecek hasil.';
});
const reviewTone = computed(() => props.ticket.verified_at
  ? 'border-success/30 bg-success/10 text-success'
  : props.ticket.review_started_at
    ? 'border-info/30 bg-info/10 text-info'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400');
const reviewSteps = computed(() => {
  const t = props.ticket;
  const steps = [
    { label: 'Dikirim ke pemohon', at: t.waiting_started_at, by: t.submitted_by, pending: '' },
    { label: 'Dalam pengecekan pemohon', at: t.review_started_at, by: t.review_started_by, pending: 'Menunggu pemohon klik Mulai Cek' },
    { label: t.review_skipped ? 'Pengecekan dilewati PM' : 'Lolos pengecekan pemohon', at: t.verified_at, by: t.verified_by, pending: 'Menunggu pemohon, atau PM melewati pengecekan' },
    { label: 'Keputusan PM', at: null, by: null, pending: 'Selesai, Ditutup, atau Dialihkan' },
  ];
  const nextIdx = steps.findIndex(s => !s.at);
  return steps.map((s, i) => ({ ...s, next: i === nextIdx }));
});

// Isian alasan (Belum Sesuai / Lewati) dan tujuan pengalihan.
const reasonMode = ref<'' | 'reject' | 'skip' | 'transfer'>('');
const reasonText = ref('');
const transferForm = reactive({ target: '', duplicate_of: '' });
const canSubmitReason = computed(() => reasonMode.value === 'transfer'
  ? !!transferForm.target && (transferForm.target !== 'DUPLIKAT' || !!transferForm.duplicate_of.trim())
  : !!reasonText.value.trim());
function openReason(mode: 'reject' | 'skip' | 'transfer') {
  reasonMode.value = mode;
  reasonText.value = '';
  Object.assign(transferForm, { target: '', duplicate_of: '' });
}
const review = (action: string, okMsg: string, extra: Record<string, unknown> = {}) => run('review', { action, ...extra }, okMsg);
async function submitReason() {
  const mode = reasonMode.value;
  if (!mode || !canSubmitReason.value) return;
  const ok = mode === 'transfer'
    ? await run('triage', { transfer_target: transferForm.target, ...(transferForm.duplicate_of.trim() ? { duplicate_of: transferForm.duplicate_of.trim() } : {}) }, 'Tiket dialihkan.')
    : await review(mode, mode === 'reject' ? 'Dikembalikan ke Dikerjakan.' : 'Pengecekan dilewati.', { reason: reasonText.value.trim() });
  if (ok) reasonMode.value = '';
}

const intakeRows = computed(() => {
  const t = props.ticket;
  const rows = [
    { label: 'Kontak', value: t.contact || '-' },
    { label: 'Unit', value: t.unit || '-' },
    { label: 'Cabang / bagian', value: t.location || '-' },
    { label: 'Kanal Asal', value: labelOf(CHANNELS, t.channel) },
    { label: 'Sejak kapan', value: fmt(t.since_at) },
    { label: 'Jumlah terdampak', value: labelOf(AFFECTED_SCOPES, t.affected_scope) || '-' },
    { label: 'Pekerjaan', value: labelOf(WORK_STATUSES, t.work_status) || '-' },
    { label: 'Acara / tryout', value: t.is_event ? 'Ya' : 'Tidak' },
  ];
  if (t.workaround) rows.push({ label: 'Cara lain', value: t.workaround });
  return rows;
});

interface SummaryRow { label: string; value: string; muted?: boolean; href?: string; status?: SlaStatus }
const SLA_BADGE: Record<SlaStatus, string> = {
  MET: 'bg-success/10 text-success',
  ON_TRACK: 'bg-info/10 text-info',
  AT_RISK: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  BREACHED: 'bg-red-500/10 text-red-600',
};

// Tiga kelompok: Klasifikasi (isi form triase), SLA, Penanganan. Kelompok kosong tidak tampil.
const summaryGroups = computed(() => {
  const t = props.ticket;
  const klas: SummaryRow[] = [];
  const sla: SummaryRow[] = [];
  const tangani: SummaryRow[] = [];
  const url = (v?: string | null) => (v && /^https?:\/\//i.test(v) ? v : undefined);
  const add = (to: SummaryRow[], label: string, value?: string | null, extra: Partial<SummaryRow> = {}) => { if (value) to.push({ label, value, ...extra }); };
  // Isi form triase selalu tampil (kosong = "-" redup) agar ringkasan setara dengan form.
  const always = (to: SummaryRow[], label: string, value?: string | null) => to.push({ label, value: value || '-', muted: !value });

  always(klas, 'Jenis Tiket', labelOf(TICKET_TYPES, t.ticket_type));
  always(klas, 'Urgensi', masterLabel(store.triageMaster?.urgencies, t.urgency));
  always(klas, 'Dampak', masterLabel(store.triageMaster?.impacts, t.impact));
  const onlyIncident = !!t.ticket_type && t.ticket_type !== 'INSIDEN';
  klas.push({
    label: 'Prioritas',
    value: t.ticket_type === 'INSIDEN' && t.p_level ? `${t.p_level} (${masterLabel(store.triageMaster?.priorities, t.p_level)})` : onlyIncident ? 'Hanya untuk Insiden' : '-',
    muted: !(t.ticket_type === 'INSIDEN' && t.p_level),
  });
  klas.push({ label: 'Data lengkap saat masuk', value: t.data_complete ? labelOf(DATA_COMPLETE, t.data_complete) : 'Belum dinilai', muted: !t.data_complete });
  always(klas, 'Alasan perubahan', t.change_reason);
  always(klas, 'Tujuan pengalihan', labelOf(TRANSFER_TARGETS, t.transfer_target));
  add(klas, 'Butir katalog', t.catalog_item);
  add(klas, 'Persetujuan PIC data', t.data_approval_note);
  add(klas, 'Duplikat dari', t.referenced_ticket_id);

  if (t.sla) {
    const s = t.sla;
    add(sla, 'Cakupan', `${s.key} · ${COVERAGE_LABEL[s.coverage]}`);
    add(sla, 'Respon', `${s.elapsed_response_hours} / ${s.target_response_hours} jam`, { status: s.response_status });
    add(sla, 'Resolusi', `${s.elapsed_resolution_hours} / ${s.target_resolution_hours} jam`, { status: s.resolution_status });
  }

  add(tangani, 'Pelaksana', t.assignedToName);
  add(tangani, 'Diakui', t.acknowledged_at ? fmt(t.acknowledged_at) : null);
  add(tangani, 'Diterima Pelaksana', t.accepted_at ? fmt(t.accepted_at) : null);
  if (t.duty_confirmed_at) add(tangani, 'Duty Engineer', `${t.duty_confirmed_by} (${fmt(t.duty_confirmed_at)})`);
  if (t.waiting_started_at) add(tangani, 'Menunggu Pemohon', `${fmt(t.waiting_started_at)} s/d ${t.waiting_ended_at ? fmt(t.waiting_ended_at) : 'sekarang'}`);
  add(tangani, 'Tertahan oleh', labelOf(BLOCKED_BY, t.blocked_by) || null);
  add(tangani, 'Task Odoo', t.odoo_task_url, { href: url(t.odoo_task_url) });
  if (t.reopen_count) add(tangani, 'Dibuka ulang', `${t.reopen_count}x`);

  return [
    { title: 'Klasifikasi', rows: klas },
    { title: 'SLA', rows: sla },
    { title: 'Penanganan', rows: tangani },
  ].filter(g => g.rows.length);
});

const blankTf = () => ({
  ticket_type: props.ticket.ticket_type || '', impact: props.ticket.impact || '', urgency: props.ticket.urgency || '',
  priority: props.ticket.p_level || '', data_complete: props.ticket.data_complete || '',
  change_reason: '', data_approval_note: props.ticket.data_approval_note || '', transfer_target: '', duplicate_of: '',
});
const tf = reactive(blankTf());
// Triase terisi = Jenis Tiket sudah ada. Form tetap terbuka dengan nilai tersimpan terpilih.
const triaged = computed(() => !!props.ticket.ticket_type);
// Tombol simpan baru muncul bila ada opsi yang berbeda dari nilai tersimpan.
const triageDirty = computed(() => JSON.stringify(tf) !== JSON.stringify(blankTf()));
watch(() => props.ticket.id, () => {
  Object.assign(tf, blankTf());
  reasonMode.value = '';
});

const suggestedP = computed(() => priorityFromMatrix(tf.impact, tf.urgency, store.triageMaster?.matrix));
const masterLabel = (list: { id: string; label: string }[] | undefined, id?: string | null) => list?.find(x => x.id === id)?.label ?? id ?? '';
// Item nonaktif tidak ditawarkan lagi, kecuali yang sudah terpilih pada tiket ini.
const masterOptions = (list: { id: string; label: string; is_active?: boolean }[] | undefined, current?: string | null) =>
  (list ?? []).filter(x => x.is_active !== false || x.id === current).map(x => ({ value: x.id, label: x.label }));
const impactOptions = computed(() => masterOptions(store.triageMaster?.impacts, props.ticket.impact));
const urgencyOptions = computed(() => masterOptions(store.triageMaster?.urgencies, props.ticket.urgency));

async function run(path: string, body?: Record<string, unknown>, okMsg = 'Tersimpan.') {
  busy.value = true;
  try {
    await apiFetch(`/api/tickets/${props.ticket.id}/${path}`, { method: 'POST', body });
    await store.refreshTicket(props.ticket.id);
    toast(okMsg, 'success');
    return true;
  } catch (e: any) {
    showError('Gagal', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
    return false;
  } finally {
    busy.value = false;
  }
}
const post = (path: string) => run(path);
const takeTicket = () => run('assignee', { userId: store.currentUser!.id }, 'Tiket diambil.');
const joinTicket = () => run('members', { userIds: [store.currentUser!.id] }, 'Anda bergabung sebagai Pelaksana.');

// PM: simpan daftar Pelaksana. Belum ada utama: yang pertama dipilih jadi utama (assignee), sisanya member.
// Member yang tidak dipilih lagi dihapus.
async function savePelaksana(ids: string[]) {
  pickerOpen.value = false;
  const have = new Set(memberIds.value);
  let toAdd = ids.filter(id => !have.has(id));
  const toRemove = memberIds.value.filter(id => !ids.includes(id));
  busy.value = true;
  try {
    if (!props.ticket.assignedTo && ids.length) {
      const first = ids[0]!;
      await apiFetch(`/api/tickets/${props.ticket.id}/assignee`, { method: 'POST', body: { userId: first } });
      toAdd = toAdd.filter(id => id !== first);
      if (have.has(first)) toRemove.push(first);
    }
    if (toAdd.length) await apiFetch(`/api/tickets/${props.ticket.id}/members`, { method: 'POST', body: { userIds: toAdd } });
    for (const id of toRemove) await apiFetch(`/api/tickets/${props.ticket.id}/members/${id}`, { method: 'DELETE' });
    await store.refreshTicket(props.ticket.id);
    toast('Pelaksana diperbarui.', 'success');
  } catch (e: any) {
    showError('Gagal', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    busy.value = false;
  }
}

function submitTriage() {
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tf)) if (v) body[k] = v;
  if (tf.ticket_type !== 'INSIDEN') delete body.priority;
  run('triage', body, 'Triase tersimpan.').then(ok => { if (ok) Object.assign(tf, blankTf()); });
}

function reopen() {
  if (window.confirm('Buka ulang tiket ini? Jumlah pembukaan ulang bertambah satu.')) run('reopen', undefined, 'Tiket dibuka ulang.');
}
</script>
