<template>
  <div v-if="isOpen && ticket" class="w-full mx-auto space-y-4 sm:space-y-6 pb-12 px-2 sm:px-6">
    <!-- Header -->
    <div class="p-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="store.backToMainView()" class="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 shrink-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <span class="text-xs font-mono font-bold text-[#026bb1] dark:text-[#52b5f2] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">{{ ticket.id }}</span>
          <h2 class="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:truncate">
            <span class="sm:truncate">{{ ticket.title }}</span>
            <span v-if="isCompleted" class="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
              <CheckCircle2 class="w-3.5 h-3.5" /> Selesai
            </span>
          </h2>
          <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Kategori: <strong class="text-gray-700 dark:text-gray-200">{{ ticket.category }}</strong></span>
            <span class="text-gray-300 dark:text-slate-700">•</span>
            <span>Lokasi: <strong class="text-gray-700 dark:text-gray-200">{{ ticket.location }}</strong></span>
          </p>
        </div>
      </div>
      <div class="flex items-center justify-end sm:justify-start gap-2">
        <button
          @click="handlePrint"
          title="Cetak Laporan Tiket (PDF)"
          class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Cetak PDF</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6 space-y-6 shadow-xs">
      <!-- SLA & Status Header Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
          <span class="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Deskripsi Laporan</span>
          <p class="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">{{ ticket.description }}</p>
        </div>

        <div class="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
          <span class="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Status & Penanganan</span>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Status Saat Ini:</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-[#026bb1] dark:text-[#52b5f2]">
              {{ ticket.status }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Worker:</span>
            <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">{{ ticket.assignedToName || ticket.primary_worker_name || 'Belum ditugaskan' }}</span>
          </div>
        </div>
      </div>

      <!-- Progress Tracking Stepper (PRD Section 29 - Stepper Centric) -->
      <div class="bg-gray-50 dark:bg-slate-800/40 p-3 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Progress Pengerjaan & Lampiran Per Tahap</h3>
          <span class="text-[10px] text-gray-400">Klik tahap untuk detail</span>
        </div>

        <!-- Stepper Pipeline with Inter-step Connectors -->
        <div class="py-2">
          <div class="flex items-center justify-start sm:justify-center gap-3 sm:gap-4 overflow-x-auto w-full py-2 custom-scrollbar">
            <template v-for="(step, i) in stepperStages" :key="i">
              <!-- Stepper Card -->
              <div
                :ref="el => { if (step.current) activeStepEl = el as HTMLElement }"
                @click="selectedStepIndex = i"
                :class="[
                  'min-w-[130px] sm:min-w-[150px] shrink-0 p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs relative bg-white dark:bg-slate-800',
                  selectedStepIndex === i
                    ? 'border-[#026bb1] dark:border-[#52b5f2] shadow-sm ring-2 ring-[#026bb1]/20'
                    : step.current
                    ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-gray-400">Tahap {{ i + 1 }}</span>
                  <span :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-xs',
                    step.completed
                      ? 'bg-emerald-600 text-white'
                      : step.current
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                  ]">
                    <span v-if="step.completed">✓</span>
                    <span v-else-if="step.current" class="w-2 h-2 rounded-full bg-white" />
                    <span v-else>{{ i + 1 }}</span>
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {{ step.label }}
                    <span v-if="step.current" class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  </p>
                  <p class="text-[10px] text-gray-500 truncate">{{ step.desc }}</p>
                </div>
                <div class="flex items-center gap-1 text-[10px] text-[#026bb1] dark:text-[#52b5f2] font-semibold pt-1 border-t border-gray-100 dark:border-slate-700/60">
                  <Paperclip class="w-3 h-3" />
                  <span>{{ step.attachments.length }} Berkas</span>
                </div>
              </div>

              <!-- Connecting Line between steps (tampil di semua ukuran layar yang mendukung flex scroll) -->
              <div
                v-if="i < stepperStages.length - 1"
                class="w-4 sm:w-6 h-0.5 shrink-0 bg-gray-300 dark:bg-slate-600"
              />
            </template>
          </div>
        </div>

        <!-- Active Step Detail Panel -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
            <div>
              <h4 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Detail Tahap: {{ stepperStages[selectedStepIndex]?.label }}
              </h4>
              <p class="text-[10px] text-gray-500 mt-0.5">{{ stepperStages[selectedStepIndex]?.actorInfo }}</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-[#026bb1] dark:text-blue-300">
              Stage: {{ stepperStages[selectedStepIndex]?.stageKey }}
            </span>
          </div>

          <!-- Attachments in this step -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold text-gray-500 uppercase">Lampiran / Bukti pada Tahap Ini:</span>
            <div v-if="stepperStages[selectedStepIndex]?.attachments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="att in stepperStages[selectedStepIndex].attachments" :key="att.id" class="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-2 overflow-hidden">
                  <Paperclip class="w-3.5 h-3.5 text-[#026bb1] shrink-0" />
                  <div class="truncate">
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{{ att.file_name }}</p>
                    <p class="text-[9px] text-gray-400">Oleh: {{ att.uploaded_by_name }} • {{ att.file_size || 'Standard' }}</p>
                  </div>
                </div>
                <span class="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-[#026bb1] dark:text-blue-300 rounded font-semibold shrink-0">
                  {{ att.visibility }}
                </span>
              </div>
            </div>
            <div v-else class="text-center py-4 text-xs text-gray-400 bg-gray-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
              Tidak ada lampiran pada tahap ini.
            </div>
          </div>

          <!-- History Catatan / Worklog pada Tahap Ini -->
          <div v-if="filteredWorklogs.length > 0" class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span class="text-[10px] font-bold text-gray-500 uppercase">Catatan & Histori pada Tahap Ini:</span>
            <div class="space-y-2">
              <div
                v-for="wl in filteredWorklogs"
                :key="wl.id"
                class="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-1"
              >
                <div class="flex items-center justify-between text-[10px] text-gray-400">
              <div class="flex flex-wrap items-center gap-2">
                    <span class="font-bold text-[#026bb1] dark:text-[#52b5f2]">Oleh: {{ wl.worker_name || 'Worker' }}</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-[#026bb1] dark:text-[#52b5f2] font-semibold text-[9px]">
                      Tahap {{ stepperStages[selectedStepIndex]?.label }}
                    </span>
                  </div>
                  <span>{{ new Date(wl.created_at || Date.now()).toLocaleString() }}</span>
                </div>
                <p class="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-line">{{ wl.description }}</p>
              </div>
            </div>
          </div>

          <!-- Action / Submit Done for Active Step (Hanya untuk worker IT dan kecuali tahap REQUEST/Created) -->
          <div v-if="stepperStages[selectedStepIndex]?.current && stepperStages[selectedStepIndex]?.stageKey !== 'REQUEST' && store.currentUser?.role !== 'USER_NON_IT'" class="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                {{
                  stepperStages[selectedStepIndex]?.stageKey === 'ASSIGN'
                    ? 'Catatan Penugasan / Ambil Tiket:'
                    : stepperStages[selectedStepIndex]?.stageKey === 'IN_PROGRESS'
                    ? 'Catatan Pengerjaan:'
                    : 'Catatan Eskalasi Delegasi:'
                }}
              </label>
              <textarea
                v-model="stageNotes"
                rows="2"
                :placeholder="
                  stepperStages[selectedStepIndex]?.stageKey === 'ASSIGN'
                    ? 'Tuliskan catatan pengambilan tiket...'
                    : stepperStages[selectedStepIndex]?.stageKey === 'IN_PROGRESS'
                    ? 'Tuliskan catatan pengerjaan / check-in...'
                    : 'Tuliskan catatan delegasi vendor...'
                "
                class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 resize-none"
              ></textarea>
            </div>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input type="file" ref="stageFileInput" @change="handleStageFile" class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#026bb1] hover:file:bg-blue-100" />
              
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <!-- Simpan Catatan / Absen Button (IN_PROGRESS & ASSIGN saja) -->
                <button
                  v-if="stepperStages[selectedStepIndex]?.stageKey === 'IN_PROGRESS' || stepperStages[selectedStepIndex]?.stageKey === 'ASSIGN'"
                  @click="handleSaveNote()"
                  :disabled="!stageNotes.trim()"
                  class="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Clock class="w-4 h-4" />
                  <span>Kirim</span>
                </button>

                <!-- Submit Normal Button -->
                <button
                  @click="handleSubmitCurrentStage()"
                  class="w-full px-4 py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 class="w-4 h-4" />
                  <span>
                    {{
                      stepperStages[selectedStepIndex]?.stageKey === 'ASSIGN'
                        ? 'Konfirmasi Assign'
                        : stepperStages[selectedStepIndex]?.stageKey === 'IN_PROGRESS'
                        ? 'Selesai'
                        : 'Kirim'
                    }}
                  </span>
                </button>

                <!-- Delegasikan Button (Saat berada di tahap Selesai Internal untuk eskalasi lanjutan) -->
                <button
                  v-if="stepperStages[selectedStepIndex]?.stageKey === 'COMPLETION' && ticket?.status !== 'DELEGASI'"
                  @click="handleSubmitCurrentStage('DELEGASI')"
                  class="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLinkIcon class="w-4 h-4" />
                  <span>Delegasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useAppStore } from '~/stores/app';
import { ArrowLeft, CheckCircle2, Paperclip, Printer, Clock, ExternalLinkIcon } from 'lucide-vue-next';
import { triggerPrintPDF } from '~/utils/export';

const store = useAppStore();
const isOpen = computed(() => store.activeView === 'ticket-detail');
const ticket = computed(() => store.selectedTicket);
const isCompleted = computed(() => ticket.value?.status === 'SELESAI');

const selectedStepIndex = ref(0);
const activeStepEl = ref<HTMLElement | null>(null);
const stageNotes = ref('');
const stageFile = ref<{ file_name: string; file_size: string; stage: string; visibility: string } | null>(null);

const handleStageFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    stageFile.value = {
      file_name: file.name,
      file_size: `${(file.size / 1024).toFixed(1)} KB`,
      stage: stepperStages.value[selectedStepIndex.value]?.stageKey || 'IN_PROGRESS',
      visibility: 'Public'
    };
  }
};

const handleSubmitCurrentStage = (targetStatus?: TicketStatus) => {
  if (!ticket.value) return;
  const currentStage = stepperStages.value[selectedStepIndex.value];
  if (!currentStage) return;

  store.completeStage(ticket.value.id, currentStage.stageKey, stageNotes.value, stageFile.value || undefined, targetStatus);
  stageNotes.value = '';
  stageFile.value = null;
};

const handleSaveNote = () => {
  if (!ticket.value || !stageNotes.value.trim()) return;
  const currentStage = stepperStages.value[selectedStepIndex.value];
  if (!currentStage) return;

  store.saveWorklogNote(ticket.value.id, currentStage.stageKey, stageNotes.value, stageFile.value || undefined);
  stageNotes.value = '';
  stageFile.value = null;
};

const stepperStages = computed(() => {
  if (!ticket.value) return [];
  const t = ticket.value;
  const atts = t.attachments || [];
  const hasDelegation = !!t.delegation || t.status === 'DELEGASE' || t.status === 'DELEGASI';

  const isAssignCompleted = (t.audit_logs || []).some(log => log.action === 'TAHAP_ASSIGN_SELESAI');
  const isProcessCompleted = (t.audit_logs || []).some(log => log.action === 'TAHAP_IN_PROGRESS_SELESAI');

  const stages = [
    {
      label: 'Created (Draft)',
      desc: 'Tiket dibuat oleh user',
      stageKey: 'REQUEST',
      completed: true,
      current: false,
      actorInfo: `Dibuat oleh: ${t.created_by_name || 'User'} (${t.created_by_dept || 'General'})`,
      attachments: atts.filter(a => a.stage === 'REQUEST'),
    },
    {
      label: 'Issued & Assigned',
      desc: 'Masuk antrean & Penugasan IT',
      stageKey: 'ASSIGN',
      completed: isAssignCompleted || t.status === 'SELESAI' || t.status === 'DELEGASI',
      current: !isAssignCompleted && t.status !== 'SELESAI' && t.status !== 'DELEGASI',
      actorInfo: `Worker: ${t.assignedToName || t.primary_worker_name || 'Belum ditugaskan'}`,
      attachments: atts.filter(a => a.stage === 'ASSIGN'),
    },
    {
      label: 'Process (In Progress)',
      desc: 'Pengerjaan & Worklog IT',
      stageKey: 'IN_PROGRESS',
      completed: isProcessCompleted || t.status === 'SELESAI' || t.status === 'DELEGASI',
      current: isAssignCompleted && !isProcessCompleted && t.status !== 'SELESAI' && t.status !== 'DELEGASI',
      actorInfo: `Total Worklog: ${t.worklogs?.length || 0} aktivitas tercatat`,
      attachments: atts.filter(a => a.stage === 'IN_PROGRESS'),
    },
    {
      label: 'Selesai Internal',
      desc: 'Penyelesaian tugas IT Internal',
      stageKey: 'COMPLETION',
      completed: t.status === 'SELESAI' || t.status === 'DELEGASI',
      current: t.status === 'SELESAI',
      actorInfo: t.completed_at ? `Selesai pada: ${new Date(t.completed_at).toLocaleString()}` : 'Belum selesai',
      attachments: atts.filter(a => a.stage === 'COMPLETION'),
    },
  ];

  if (hasDelegation) {
    stages.push({
      label: 'Delegasi (Eksternal / Vendor)',
      desc: 'Eskalasi lanjutan ke pihak luar',
      stageKey: 'DELEGATION',
      completed: t.status === 'DELEGASI' && !!t.delegation,
      current: t.status === 'DELEGASI',
      actorInfo: t.delegation ? `Delegasi ke: ${t.delegation.vendor_name || t.delegation.technician_name || 'Vendor'}` : 'Ada delegasi tercatat',
      attachments: atts.filter(a => a.stage === 'DELEGATION'),
    });
  }

  return stages;
});

// Auto-select current step and smooth scroll to it when ticket changes or opens
watch(stepperStages, (stages) => {
  const currentIndex = stages.findIndex(s => s.current);
  if (currentIndex !== -1) {
    selectedStepIndex.value = currentIndex;
    nextTick(() => {
      if (activeStepEl.value) {
        activeStepEl.value.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }
}, { immediate: true });

const filteredWorklogs = computed(() => {
  if (!ticket.value?.worklogs) return [];
  const currentStageKey = stepperStages.value[selectedStepIndex.value]?.stageKey;
  return ticket.value.worklogs.filter(wl => wl.stageKey === currentStageKey);
});

const handlePrint = () => {
  if (ticket.value) triggerPrintPDF(ticket.value);
};
</script>
