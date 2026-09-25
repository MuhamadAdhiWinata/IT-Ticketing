<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-surface rounded-lg border border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/15">
          <CalendarDays class="w-3.5 h-3.5" />
          <span>Daily Work Log & Monitoring Aktivitas Kerja</span>
        </div>
        <h1 class="text-xl font-bold text-foreground">
          Aktivitas Kerja Harian & Rentang Waktu IT
        </h1>
        <p class="text-xs text-muted-foreground">
          Rekapitulasi catatan waktu, penugasan tiket, dan histori durasi pekerjaan teknisi berdasarkan rentang tanggal fleksibel.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="isAddModalOpen = true"
          class="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Catat Log Kerja</span>
        </button>

        <button
          @click="handleExportExcel"
          class="px-3.5 py-2 border border-emerald-600/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
          title="Download Rekap Worklog Excel untuk Rentang Tanggal Ini"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>Ekspor Excel</span>
        </button>

        <button
          @click="handlePrintPDF"
          class="px-3 py-2 border border-border bg-surface text-foreground hover:bg-muted text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
          title="Cetak Laporan Aktivitas Periode Ini"
        >
          <Printer class="w-4 h-4" />
          <span>Cetak</span>
        </button>
      </div>
    </div>

    <!-- Date Range Navigation & Filter Controls -->
    <div class="bg-surface rounded-lg border border-border p-4 sm:p-5 shadow-xs space-y-3.5">
      <!-- Quick Preset Filter Tabs & Worker Filter -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div class="flex-1">
          <span class="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1 mb-2 sm:mb-0">
            <Filter class="w-3.5 h-3.5 text-primary" />
            Periode:
          </span>
          <div class="overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1">
            <button
              v-for="preset in presets"
              :key="preset.id"
              @click="applyPreset(preset.id)"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0',
                activePreset === preset.id
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-muted text-foreground border-border hover:bg-muted'
              ]"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Worker Filter (hanya untuk SYSTEM_ADMIN) -->
        <div v-if="store.currentUser?.role === 'SYSTEM_ADMIN'" class="w-full sm:w-auto flex items-center justify-end sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
          <span class="text-xs font-bold text-muted-foreground shrink-0">Worker:</span>
          <div class="min-w-[180px]">
            <AppSelect
              v-model="selectedWorkerId"
              :options="workerOptions"
              size="sm"
              searchable
              search-placeholder="Cari worker..."
            />
          </div>
        </div>
      </div>

      <!-- Date Range Inputs with Step Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex-1 flex items-center gap-2 text-xs">
          <!-- Step backward button -->
          <button
            @click="shiftRange(-1)"
            class="p-2 rounded-lg border border-border bg-surface hover:bg-muted text-muted-foreground shrink-0"
            title="Mundur Satu Periode"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <div class="flex-1 grid grid-cols-2 gap-2">
            <!-- Start Date -->
            <div class="flex flex-col">
              <span class="text-muted-foreground font-semibold text-[11px] mb-1">Dari:</span>
              <input
                v-model="startDate"
                type="date"
                @change="onDateInputChange"
                class="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <!-- End Date -->
            <div class="flex flex-col">
              <span class="text-muted-foreground font-semibold text-[11px] mb-1">Sampai:</span>
              <input
                v-model="endDate"
                type="date"
                @change="onDateInputChange"
                class="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <!-- Step forward button -->
          <button
            @click="shiftRange(1)"
            class="p-2 rounded-lg border border-border bg-surface hover:bg-muted text-muted-foreground shrink-0"
            title="Maju Satu Periode"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <div class="w-full sm:w-auto text-xs text-muted-foreground font-medium flex items-center justify-center sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <Calendar class="w-3.5 h-3.5 text-primary" />
          <span>Rentang aktif: <strong class="text-foreground font-bold">{{ formattedDateRangeDisplay }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Daily/Period KPI Metric Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-muted-foreground uppercase">Tiket Dikerjakan</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-foreground font-mono">{{ dailyTicketsCount }}</span>
          <div class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <TicketIcon class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-muted-foreground/50">Total tiket unik beraktivitas</p>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-success uppercase">Tiket Selesai</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-success font-mono">{{ completedInRangeCount }}</span>
          <div class="w-8 h-8 rounded-lg bg-success/5 text-success flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-muted-foreground/50">Diselesaikan pada rentang ini</p>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-primary uppercase">On-Progress</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-primary font-mono">{{ onProgressCount }}</span>
          <div class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-muted-foreground/50">Tiket aktif dalam penanganan</p>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-info uppercase">Total Jam Kerja</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-info font-mono">{{ totalHoursInRange }} <span class="text-xs font-sans font-normal text-muted-foreground">Jam</span></span>
          <div class="w-8 h-8 rounded-lg bg-info/5 text-info flex items-center justify-center">
            <Timer class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-muted-foreground/50">Akumulasi durasi worklog</p>
      </div>
    </div>

    <!-- Timeline of Work Activities for the Selected Date Range -->
    <div class="bg-surface rounded-lg border border-border p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 class="text-sm font-bold text-foreground uppercase tracking-wider">
            Histori Aktivitas: {{ formattedDateRangeDisplay }}
          </h2>
          <p class="text-[11px] text-muted-foreground">Urutan kronologis catatan pengerjaan tiket oleh teknisi IT</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground">
          {{ rangeWorklogs.length }} Catatan Aktivitas
        </span>
      </div>

      <!-- Worklogs List / Timeline -->
      <div v-if="rangeWorklogs.length > 0" class="space-y-3 pt-2">
        <div
          v-for="item in rangeWorklogs"
          :key="item.wl.id"
          class="p-4 rounded-lg border border-border bg-muted/60 hover:bg-surface transition-all space-y-2.5 shadow-xs group"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Date Badge -->
              <span class="font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border text-[11px] flex items-center gap-1">
                <Calendar class="w-3 h-3 text-muted-foreground" />
                {{ formatItemDate(item.wl.date || item.wl.created_at) }}
              </span>

              <span class="font-mono font-bold px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/15">
                {{ item.ticket.id }}
              </span>
              <span class="font-bold text-foreground">{{ item.ticket.title }}</span>
              <span class="text-muted-foreground/50">•</span>
              <span class="text-muted-foreground">{{ item.ticket.category }}</span>
            </div>

            <div class="flex items-center gap-2 text-[11px]">
              <span class="font-bold px-2 py-0.5 rounded bg-info/10 text-info flex items-center gap-1">
                <Clock class="w-3 h-3 text-info" />
                {{ item.wl.start_at }} - {{ item.wl.finish_at }} ({{ item.wl.duration_minutes }} mnt)
              </span>
              <button
                @click="store.openTicketDetail(item.ticket.id)"
                class="text-primary hover:underline font-bold transition-all"
              >
                Lihat Tiket &rarr;
              </button>
            </div>
          </div>

          <!-- Description and Worker -->
          <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/50">
            <p class="text-xs text-foreground font-medium whitespace-pre-line leading-relaxed">
              {{ item.wl.description }}
            </p>
            <div class="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
              <User class="w-3.5 h-3.5" />
              <span>Teknisi: <strong class="text-foreground">{{ item.wl.worker_name }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-xs text-muted-foreground/50 space-y-2">
        <Clock class="w-8 h-8 text-muted-foreground/50 mx-auto" />
        <p>Belum ada catatan log aktivitas pengerjaan pada periode {{ formattedDateRangeDisplay }}.</p>
        <button
          @click="isAddModalOpen = true"
          class="px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-all"
        >
          + Catat Log Pekerjaan
        </button>
      </div>
    </div>

    <!-- Modal Catat Log Kerja Cepat -->
    <Teleport to="body">
      <div
        v-if="isAddModalOpen"
        class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4"
      >
        <div class="bg-surface rounded-lg border border-border p-6 max-w-lg w-full shadow-lg space-y-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <Clock class="w-5 h-5 text-primary" />
              <span>Catat Log Pekerjaan IT</span>
            </h3>
            <button @click="isAddModalOpen = false" class="text-muted-foreground hover:text-muted-foreground/50 cursor-pointer">
              ✕
            </button>
          </div>

          <form @submit.prevent="submitWorklog" class="space-y-4">
            <div>
              <AppSelect
                v-model="newWlTicketId"
                :options="candidateTicketOptions"
                label="Pilih Tiket yang Dikerjakan *"
                placeholder="-- Pilih Tiket --"
                searchable
                search-placeholder="Cari tiket..."
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-foreground mb-1">Tanggal Pengerjaan</label>
                <input
                  v-model="newWlDate"
                  type="date"
                  required
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-foreground mb-1">Durasi (Menit)</label>
                <input
                  v-model.number="newWlDuration"
                  type="number"
                  min="5"
                  step="5"
                  required
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-foreground mb-1">Jam Mulai</label>
                <input
                  v-model="newWlStart"
                  type="time"
                  required
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-foreground mb-1">Jam Selesai</label>
                <input
                  v-model="newWlFinish"
                  type="time"
                  required
                  class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-foreground mb-1">
                Rincian Aktivitas / Troubleshooting <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="newWlDesc"
                rows="3"
                required
                placeholder="Jelaskan tindakan teknis yang telah dilakukan..."
                class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              ></textarea>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                @click="isAddModalOpen = false"
                class="px-4 py-2 bg-muted text-foreground text-xs font-bold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                class="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Log
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '~/stores/app';
import { useToast } from '~/composables/useToast';
import AppSelect from '~/components/common/AppSelect.vue';
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Timer,
  User,
  Filter,
} from 'lucide-vue-next';
import { exportWorklogsToExcel, triggerPrintPDF } from '~/utils/export';

const store = useAppStore();
const { toast } = useToast();

const getTodayIso = () => new Date().toISOString().split('T')[0]!;
const getDaysAgoIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]!;
};
const getFirstDayOfMonthIso = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0]!;
};

const presets = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari Terakhir' },
  { id: '30days', label: '30 Hari Terakhir' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'custom', label: 'Rentang Kustom' },
];

const activePreset = ref<'today' | '7days' | '30days' | 'month' | 'custom'>('7days');
const startDate = ref(getDaysAgoIso(6));
const endDate = ref(getTodayIso());
const selectedWorkerId = ref(
  store.currentUser?.role === 'IT_WORKER'
    ? store.currentUser.id
    : 'ALL'
);

const isAddModalOpen = ref(false);
const newWlTicketId = ref('');
const newWlDate = ref(getTodayIso());
const newWlStart = ref('09:00');
const newWlFinish = ref('09:45');
const newWlDuration = ref(45);
const newWlDesc = ref('');

const itWorkers = computed(() => {
  return store.allUsers.filter(u => u.role === 'IT_WORKER');
});

const applyPreset = (presetId: string) => {
  activePreset.value = presetId as any;
  const today = getTodayIso();
  if (presetId === 'today') {
    startDate.value = today;
    endDate.value = today;
  } else if (presetId === '7days') {
    startDate.value = getDaysAgoIso(6);
    endDate.value = today;
  } else if (presetId === '30days') {
    startDate.value = getDaysAgoIso(29);
    endDate.value = today;
  } else if (presetId === 'month') {
    startDate.value = getFirstDayOfMonthIso();
    endDate.value = today;
  }
};

const onDateInputChange = () => {
  if (startDate.value > endDate.value) {
    endDate.value = startDate.value;
  }
  activePreset.value = 'custom';
};

const shiftRange = (direction: number) => {
  const start = new Date(startDate.value);
  const end = new Date(endDate.value);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  start.setDate(start.getDate() + direction * diffDays);
  end.setDate(end.getDate() + direction * diffDays);

  startDate.value = start.toISOString().split('T')[0]!;
  endDate.value = end.toISOString().split('T')[0]!;
  activePreset.value = 'custom';
};

const formatDateIndo = (isoDate: string) => {
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return isoDate;
  } catch {
    return isoDate;
  }
};

const formatItemDate = (val?: string) => {
  if (!val) return '-';
  const iso = val.includes('T') ? val.split('T')[0]! : val;
  return formatDateIndo(iso);
};

const formattedDateRangeDisplay = computed(() => {
  if (startDate.value === endDate.value) {
    return formatDateIndo(startDate.value);
  }
  return `${formatDateIndo(startDate.value)} — ${formatDateIndo(endDate.value)}`;
});

// All worklogs within the date range
const rangeWorklogs = computed(() => {
  const results: { ticket: any; wl: any }[] = [];
  const start = startDate.value;
  const end = endDate.value;

  store.tickets.forEach(ticket => {
    (ticket.worklogs || []).forEach(wl => {
      const wlDate = wl.date || (wl.created_at ? wl.created_at.split('T')[0]! : '');
      const inRange = wlDate >= start && wlDate <= end;
      const matchWorker = selectedWorkerId.value === 'ALL' || wl.worker_id === selectedWorkerId.value;
      if (inRange && matchWorker) {
        results.push({ ticket, wl });
      }
    });
  });

  // Sort descending by date, then by start_at
  return results.sort((a, b) => {
    const dateA = a.wl.date || (a.wl.created_at ? a.wl.created_at.split('T')[0]! : '');
    const dateB = b.wl.date || (b.wl.created_at ? b.wl.created_at.split('T')[0]! : '');
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return (b.wl.start_at || '').localeCompare(a.wl.start_at || '');
  });
});

// KPI Calculations
const dailyTicketsCount = computed(() => {
  const set = new Set(rangeWorklogs.value.map(item => item.ticket.id));
  return set.size;
});

const completedInRangeCount = computed(() => {
  const start = startDate.value;
  const end = endDate.value;
  return store.tickets.filter(t => {
    if (t.status !== 'SELESAI' || !t.completed_at) return false;
    const completedDate = t.completed_at.split('T')[0]!;
    const inRange = completedDate >= start && completedDate <= end;
    const matchWorker = selectedWorkerId.value === 'ALL' || t.assignedTo === selectedWorkerId.value;
    return inRange && matchWorker;
  }).length;
});

const onProgressCount = computed(() => {
  return store.tickets.filter(t => {
    if (t.status !== 'PROCESS') return false;
    const matchWorker = selectedWorkerId.value === 'ALL' || t.assignedTo === selectedWorkerId.value;
    return matchWorker;
  }).length;
});

const totalHoursInRange = computed(() => {
  const totalMinutes = rangeWorklogs.value.reduce((sum, item) => sum + (item.wl.duration_minutes || 0), 0);
  return (totalMinutes / 60).toFixed(1);
});

const activeCandidateTickets = computed(() => {
  return store.tickets.filter(t => t.status !== 'DRAFT');
});

const workerOptions = computed(() => {
  return [
    { value: 'ALL', label: 'Semua Worker (Tim IT)' },
    ...itWorkers.value.map(u => ({ value: u.id, label: `${u.name} (${u.department})` }))
  ];
});

const candidateTicketOptions = computed(() => {
  return activeCandidateTickets.value.map(t => ({
    value: t.id,
    label: `[${t.id}] ${t.title} (${t.status})`
  }));
});

const submitWorklog = async () => {
  if (!newWlTicketId.value || !newWlDesc.value.trim()) return;

  const currentWorker = store.allUsers.find(u => u.id === selectedWorkerId.value) || store.currentUser;

  await store.addCustomWorklog(newWlTicketId.value, {
    date: newWlDate.value || getTodayIso(),
    start_at: newWlStart.value,
    finish_at: newWlFinish.value,
    duration_minutes: newWlDuration.value,
    description: newWlDesc.value.trim(),
    stageKey: 'IN_PROGRESS',
    worker_id: currentWorker?.id,
    worker_name: currentWorker?.name,
  });

  toast('Log pekerjaan berhasil disimpan.', 'success');
  newWlDesc.value = '';
  newWlTicketId.value = '';
  isAddModalOpen.value = false;
};

const handleExportExcel = () => {
  const workerName = selectedWorkerId.value !== 'ALL'
    ? store.allUsers.find(u => u.id === selectedWorkerId.value)?.name
    : undefined;
  exportWorklogsToExcel(store.tickets, workerName, {
    start: startDate.value,
    end: endDate.value,
  });
};

const handlePrintPDF = () => {
  triggerPrintPDF(`Laporan_Aktivitas_IT_${startDate.value}_sd_${endDate.value}`);
};
</script>
