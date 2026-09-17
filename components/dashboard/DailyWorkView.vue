<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#026bb1] dark:text-[#52b5f2] bg-[#e6f1f8] dark:bg-[#026bb1]/20 px-2.5 py-1 rounded-md border border-[#026bb1]/30">
          <CalendarDays class="w-3.5 h-3.5" />
          <span>PRD 25: Daily Work Log & Monitoring Aktivitas Kerja</span>
        </div>
        <h1 class="text-xl font-extrabold text-gray-900 dark:text-white">
          Aktivitas Kerja Harian & Rentang Waktu IT
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Rekapitulasi catatan waktu, penugasan tiket, dan histori durasi pekerjaan teknisi berdasarkan rentang tanggal fleksibel.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="isAddModalOpen = true"
          class="px-3.5 py-2 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Catat Log Kerja</span>
        </button>

        <button
          @click="handleExportExcel"
          class="px-3.5 py-2 border border-emerald-600/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          title="Download Rekap Worklog Excel untuk Rentang Tanggal Ini"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>Ekspor Excel</span>
        </button>

        <button
          @click="handlePrintPDF"
          class="px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          title="Cetak Laporan Aktivitas Periode Ini"
        >
          <Printer class="w-4 h-4" />
          <span>Cetak</span>
        </button>
      </div>
    </div>

    <!-- Date Range Navigation & Filter Controls -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
      <!-- Quick Preset Filter Tabs -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
            <Filter class="w-3.5 h-3.5 text-[#026bb1]" />
            Periode:
          </span>
          <button
            v-for="preset in presets"
            :key="preset.id"
            @click="applyPreset(preset.id)"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
              activePreset === preset.id
                ? 'bg-[#026bb1] text-white border-[#026bb1] shadow-xs'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
            ]"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- Worker Filter -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-gray-500">Worker:</span>
          <select
            v-model="selectedWorkerId"
            class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#026bb1]/40"
          >
            <option value="ALL">Semua Worker (Tim IT)</option>
            <option v-for="user in itWorkers" :key="user.id" :value="user.id">
              {{ user.name }} ({{ user.department }})
            </option>
          </select>
        </div>
      </div>

      <!-- Date Range Inputs with Step Navigation -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <!-- Step backward button -->
          <button
            @click="shiftRange(-1)"
            class="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 text-gray-600 dark:text-gray-300"
            title="Mundur Satu Periode"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- Start Date -->
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500 font-semibold text-[11px]">Dari:</span>
            <input
              v-model="startDate"
              type="date"
              @change="onDateInputChange"
              class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#026bb1]/40"
            />
          </div>

          <span class="text-gray-400 font-bold">—</span>

          <!-- End Date -->
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500 font-semibold text-[11px]">Sampai:</span>
            <input
              v-model="endDate"
              type="date"
              @change="onDateInputChange"
              class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#026bb1]/40"
            />
          </div>

          <!-- Step forward button -->
          <button
            @click="shiftRange(1)"
            class="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 text-gray-600 dark:text-gray-300"
            title="Maju Satu Periode"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <div class="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-[#026bb1]" />
          <span>Rentang aktif: <strong class="text-gray-900 dark:text-white font-bold">{{ formattedDateRangeDisplay }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Daily/Period KPI Metric Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-gray-500 uppercase">Tiket Dikerjakan</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">{{ dailyTicketsCount }}</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#026bb1] flex items-center justify-center">
            <TicketIcon class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-gray-400">Total tiket unik beraktivitas</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-emerald-600 uppercase">Tiket Selesai</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-extrabold text-emerald-600 font-mono">{{ completedInRangeCount }}</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-gray-400">Diselesaikan pada rentang ini</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-[#026bb1] dark:text-[#52b5f2] uppercase">On-Progress</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-extrabold text-[#026bb1] dark:text-[#52b5f2] font-mono">{{ onProgressCount }}</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#026bb1] flex items-center justify-center">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-gray-400">Tiket aktif dalam penanganan</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
        <span class="text-[11px] font-bold text-purple-600 uppercase">Total Jam Kerja</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-extrabold text-purple-600 font-mono">{{ totalHoursInRange }} <span class="text-xs font-sans font-normal text-gray-500">Jam</span></span>
          <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Timer class="w-4 h-4" />
          </div>
        </div>
        <p class="text-[10px] text-gray-400">Akumulasi durasi worklog</p>
      </div>
    </div>

    <!-- Timeline of Work Activities for the Selected Date Range -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
        <div>
          <h2 class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Histori Aktivitas: {{ formattedDateRangeDisplay }}
          </h2>
          <p class="text-[11px] text-gray-500">Urutan kronologis catatan pengerjaan tiket oleh teknisi IT</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
          {{ rangeWorklogs.length }} Catatan Aktivitas
        </span>
      </div>

      <!-- Worklogs List / Timeline -->
      <div v-if="rangeWorklogs.length > 0" class="space-y-3 pt-2">
        <div
          v-for="item in rangeWorklogs"
          :key="item.wl.id"
          class="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-2.5 shadow-xs group"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Date Badge -->
              <span class="font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[11px] flex items-center gap-1">
                <Calendar class="w-3 h-3 text-slate-500" />
                {{ formatItemDate(item.wl.date || item.wl.created_at) }}
              </span>

              <span class="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#026bb1] dark:bg-blue-950/60 dark:text-[#52b5f2] border border-blue-200 dark:border-blue-900">
                {{ item.ticket.id }}
              </span>
              <span class="font-bold text-gray-900 dark:text-white">{{ item.ticket.title }}</span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-500">{{ item.ticket.category }}</span>
            </div>

            <div class="flex items-center gap-2 text-[11px]">
              <span class="font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Clock class="w-3 h-3 text-purple-500" />
                {{ item.wl.start_at }} - {{ item.wl.finish_at }} ({{ item.wl.duration_minutes }} mnt)
              </span>
              <button
                @click="store.openTicketDetail(item.ticket.id)"
                class="text-[#026bb1] dark:text-[#52b5f2] hover:underline font-bold transition-all"
              >
                Lihat Tiket &rarr;
              </button>
            </div>
          </div>

          <!-- Description and Worker -->
          <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-200/50 dark:border-slate-700/50">
            <p class="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">
              {{ item.wl.description }}
            </p>
            <div class="flex items-center gap-1.5 shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
              <User class="w-3.5 h-3.5" />
              <span>Teknisi: <strong class="text-gray-800 dark:text-gray-200">{{ item.wl.worker_name }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-xs text-gray-400 space-y-2">
        <Clock class="w-8 h-8 text-gray-300 mx-auto" />
        <p>Belum ada catatan log aktivitas pengerjaan pada periode {{ formattedDateRangeDisplay }}.</p>
        <button
          @click="isAddModalOpen = true"
          class="px-3.5 py-2 bg-[#026bb1] text-white text-xs font-bold rounded-xl hover:bg-[#025a95] transition-all"
        >
          + Catat Log Pekerjaan
        </button>
      </div>
    </div>

    <!-- Modal Catat Log Kerja Cepat -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock class="w-5 h-5 text-[#026bb1]" />
            <span>Catat Log Pekerjaan IT</span>
          </h3>
          <button @click="isAddModalOpen = false" class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form @submit.prevent="submitWorklog" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Pilih Tiket yang Dikerjakan <span class="text-red-500">*</span>
            </label>
            <select
              v-model="newWlTicketId"
              required
              class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#026bb1]/40"
            >
              <option value="" disabled>-- Pilih Tiket --</option>
              <option v-for="t in activeCandidateTickets" :key="t.id" :value="t.id">
                [{{ t.id }}] {{ t.title }} ({{ t.status }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tanggal Pengerjaan</label>
              <input
                v-model="newWlDate"
                type="date"
                required
                class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Durasi (Menit)</label>
              <input
                v-model.number="newWlDuration"
                type="number"
                min="5"
                step="5"
                required
                class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Jam Mulai</label>
              <input
                v-model="newWlStart"
                type="time"
                required
                class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Jam Selesai</label>
              <input
                v-model="newWlFinish"
                type="time"
                required
                class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Rincian Aktivitas / Troubleshooting <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="newWlDesc"
              rows="3"
              required
              placeholder="Jelaskan tindakan teknis yang telah dilakukan..."
              class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#026bb1]/40 resize-none"
            ></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Simpan Log
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '~/stores/app';
import { useToast } from '~/composables/useToast';
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

const getTodayIso = () => new Date().toISOString().split('T')[0];
const getDaysAgoIso = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};
const getFirstDayOfMonthIso = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
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
const selectedWorkerId = ref('ALL');

const isAddModalOpen = ref(false);
const newWlTicketId = ref('');
const newWlDate = ref(getTodayIso());
const newWlStart = ref('09:00');
const newWlFinish = ref('09:45');
const newWlDuration = ref(45);
const newWlDesc = ref('');

const itWorkers = computed(() => {
  return store.allUsers.filter(u => u.role === 'IT_WORKER' || u.role === 'IT_LEAD');
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

  startDate.value = start.toISOString().split('T')[0];
  endDate.value = end.toISOString().split('T')[0];
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
  const iso = val.includes('T') ? val.split('T')[0] : val;
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
      const wlDate = wl.date || (wl.created_at ? wl.created_at.split('T')[0] : '');
      const inRange = wlDate >= start && wlDate <= end;
      const matchWorker = selectedWorkerId.value === 'ALL' || wl.worker_id === selectedWorkerId.value;
      if (inRange && matchWorker) {
        results.push({ ticket, wl });
      }
    });
  });

  // Sort descending by date, then by start_at
  return results.sort((a, b) => {
    const dateA = a.wl.date || (a.wl.created_at ? a.wl.created_at.split('T')[0] : '');
    const dateB = b.wl.date || (b.wl.created_at ? b.wl.created_at.split('T')[0] : '');
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
    const completedDate = t.completed_at.split('T')[0];
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

const submitWorklog = () => {
  if (!newWlTicketId.value || !newWlDesc.value.trim()) return;

  const currentWorker = store.allUsers.find(u => u.id === selectedWorkerId.value) || store.currentUser;

  store.addCustomWorklog(newWlTicketId.value, {
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
