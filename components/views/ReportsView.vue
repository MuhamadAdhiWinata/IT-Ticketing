<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
          <FileSpreadsheet class="w-3.5 h-3.5" />
          <span>Pusat Laporan, Audit & Rekapitulasi Kerja IT</span>
        </div>
        <h1 class="text-xl font-extrabold text-gray-900 dark:text-white">
          Laporan & Ekspor Data IT
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Unduh laporan rekapitulasi penanganan insiden, durasi kerja per teknisi, dan kontribusi tim ke Excel dan PDF.
        </p>
      </div>

      <!-- Quick Export Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          @click="handleExportActiveTab"
          class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download class="w-4 h-4" />
          <span>Download Excel</span>
        </button>

        <button
          @click="handlePrintPDF"
          class="px-3.5 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Printer class="w-4 h-4" />
          <span>Cetak PDF</span>
        </button>
      </div>
    </div>

    <!-- Filter Panel -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-[#026bb1]" />
          <h3 class="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Parameter Filter Laporan
          </h3>
        </div>
        <button
          @click="resetFilters"
          class="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline cursor-pointer"
        >
          Reset Filter
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <!-- Time Range Preset -->
        <div>
          <AppSelect
            v-model="timePreset"
            :options="timePresetOptions"
            label="Rentang Waktu"
            size="sm"
          />
        </div>

        <!-- Worker Filter -->
        <div>
          <AppSelect
            v-model="filterWorker"
            :options="workerOptions"
            label="Teknisi / Worker"
            size="sm"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <AppSelect
            v-model="filterStatus"
            :options="statusOptions"
            label="Status Tiket"
            size="sm"
          />
        </div>

        <!-- Category Filter -->
        <div>
          <AppSelect
            v-model="filterCategory"
            :options="categoryOptions"
            label="Kategori"
            size="sm"
          />
        </div>

        <!-- Priority Filter -->
        <div>
          <AppSelect
            v-model="filterPriority"
            :options="priorityOptions"
            label="Prioritas"
            size="sm"
          />
        </div>
      </div>

      <!-- Custom Date Pickers when CUSTOM is chosen -->
      <div v-if="timePreset === 'CUSTOM'" class="grid grid-cols-2 gap-3 pt-2 max-w-md">
        <div>
          <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1 text-[11px]">Tanggal Mulai</label>
          <input
            v-model="customStartDate"
            type="date"
            class="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white font-bold"
          />
        </div>
        <div>
          <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1 text-[11px]">Tanggal Akhir</label>
          <input
            v-model="customEndDate"
            type="date"
            class="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white font-bold"
          />
        </div>
      </div>
    </div>

    <!-- Filtered Results Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
        <span class="text-[10px] font-bold text-gray-400 uppercase">Tiket Tersaring</span>
        <div class="text-2xl font-extrabold text-gray-900 dark:text-white font-mono mt-1">
          {{ filteredTickets.length }}
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
        <span class="text-[10px] font-bold text-emerald-600 uppercase">Selesai Ditangani</span>
        <div class="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
          {{ countFilteredStatus('SELESAI') }}
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
        <span class="text-[10px] font-bold text-[#026bb1] dark:text-[#52b5f2] uppercase">Dalam Proses</span>
        <div class="text-2xl font-extrabold text-[#026bb1] dark:text-[#52b5f2] font-mono mt-1">
          {{ countFilteredStatus('PROCESS') }}
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
        <span class="text-[10px] font-bold text-purple-600 uppercase">Total Jam Kerja</span>
        <div class="text-2xl font-extrabold text-purple-600 font-mono mt-1">
          {{ totalFilteredHours }} <span class="text-xs font-normal text-gray-500">Jam</span>
        </div>
      </div>
    </div>

    <!-- Report Sub-Tabs -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div class="flex flex-wrap border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-2 gap-2">
        <button
          @click="activeReportTab = 'TICKETS'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          :class="activeReportTab === 'TICKETS' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
        >
          <TicketIcon class="w-4 h-4" />
          <span>Rekapitulasi Tiket ({{ filteredTickets.length }})</span>
        </button>

        <button
          @click="activeReportTab = 'WORKLOGS'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          :class="activeReportTab === 'WORKLOGS' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
        >
          <Clock class="w-4 h-4" />
          <span>Log Pekerjaan Rinci ({{ filteredWorklogs.length }})</span>
        </button>

        <button
          @click="activeReportTab = 'WORKERS'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          :class="activeReportTab === 'WORKERS' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
        >
          <Users class="w-4 h-4" />
          <span>Ringkasan Per Teknisi</span>
        </button>
      </div>

      <!-- TAB 1: TICKETS TABLE -->
      <div v-if="activeReportTab === 'TICKETS'" class="p-4 sm:p-6 space-y-4">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                <th class="p-3">No. Tiket</th>
                <th class="p-3">Judul Masalah</th>
                <th class="p-3">Kategori</th>
                <th class="p-3">Pelapor</th>
                <th class="p-3">Teknisi & Kontributor</th>
                <th class="p-3">Prioritas</th>
                <th class="p-3">Status</th>
                <th class="p-3">Tgl Selesai</th>
                <th class="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
              <tr
                v-for="t in filteredTickets"
                :key="t.id"
                class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td class="p-3 font-mono font-bold text-[#026bb1] dark:text-[#52b5f2]">
                  {{ t.id }}
                </td>
                <td class="p-3 font-semibold text-gray-900 dark:text-white max-w-xs truncate">
                  {{ t.title }}
                </td>
                <td class="p-3 text-gray-600 dark:text-gray-300">
                  {{ t.category }}
                </td>
                <td class="p-3">
                  <span class="font-medium text-gray-800 dark:text-gray-200 block">{{ t.requestedByName }}</span>
                  <span class="text-[10px] text-gray-400">{{ t.requestedByDept || t.created_by_dept }}</span>
                </td>
                <td class="p-3 text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                  {{ getTicketContributors(t) }}
                </td>
                <td class="p-3">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', getTicketPriorityBadgeClass(t.priority)]">
                    {{ getTicketPriorityLabel(t.priority) }}
                  </span>
                </td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      t.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      t.status === 'PROCESS' ? 'bg-blue-100 text-[#026bb1] dark:bg-blue-950 dark:text-blue-300' :
                      t.status === 'DELEGASI' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                    ]"
                  >
                    {{ t.status }}
                  </span>
                </td>
                <td class="p-3 text-[11px] text-gray-500 font-mono">
                  {{ t.completed_at ? t.completed_at.split('T')[0] : '-' }}
                </td>
                <td class="p-3 text-right">
                  <button
                    @click="store.openTicketDetail(t.id)"
                    class="text-[#026bb1] dark:text-[#52b5f2] hover:underline font-bold text-xs cursor-pointer"
                  >
                    Detail
                  </button>
                </td>
              </tr>
              <tr v-if="filteredTickets.length === 0">
                <td colspan="9" class="p-8 text-center text-gray-400 text-xs">
                  Tidak ada data tiket sesuai filter parameter ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: WORKLOGS TABLE -->
      <div v-if="activeReportTab === 'WORKLOGS'" class="p-4 sm:p-6 space-y-4">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                <th class="p-3">Tanggal</th>
                <th class="p-3">Teknisi</th>
                <th class="p-3">No. Tiket</th>
                <th class="p-3">Judul Tiket</th>
                <th class="p-3">Jam Kerja</th>
                <th class="p-3 text-center">Durasi (Mnt)</th>
                <th class="p-3">Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
              <tr
                v-for="item in filteredWorklogs"
                :key="item.wl.id"
                class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td class="p-3 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                  {{ item.wl.date || (item.wl.created_at ? item.wl.created_at.split('T')[0] : '-') }}
                </td>
                <td class="p-3 font-bold text-gray-900 dark:text-white">
                  {{ item.wl.worker_name }}
                </td>
                <td class="p-3 font-mono font-bold text-[#026bb1] dark:text-[#52b5f2]">
                  {{ item.ticket.id }}
                </td>
                <td class="p-3 font-semibold text-gray-800 dark:text-gray-200 max-w-xs truncate">
                  {{ item.ticket.title }}
                </td>
                <td class="p-3 font-mono text-[11px] text-gray-500">
                  {{ item.wl.start_at }} - {{ item.wl.finish_at }}
                </td>
                <td class="p-3 text-center font-mono font-bold text-purple-600">
                  {{ item.wl.duration_minutes }} mnt
                </td>
                <td class="p-3 text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm">
                  {{ item.wl.description }}
                </td>
              </tr>
              <tr v-if="filteredWorklogs.length === 0">
                <td colspan="7" class="p-8 text-center text-gray-400 text-xs">
                  Tidak ada data catatan kerja sesuai filter parameter ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: WORKER RECAP TABLE -->
      <div v-if="activeReportTab === 'WORKERS'" class="p-4 sm:p-6 space-y-4">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                <th class="p-3">Nama Teknisi</th>
                <th class="p-3">Departemen</th>
                <th class="p-3 text-center">Tiket Dikontribusikan</th>
                <th class="p-3 text-center">Selesai</th>
                <th class="p-3 text-center">On-Progress</th>
                <th class="p-3 text-center">Total Jam Kerja</th>
                <th class="p-3 text-center">Rata-rata Durasi / Aktivitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
              <tr
                v-for="w in workerRecapData"
                :key="w.user.id"
                class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td class="p-3 font-bold text-gray-900 dark:text-white">
                  {{ w.user.name }}
                </td>
                <td class="p-3 text-gray-500">
                  {{ w.user.department }}
                </td>
                <td class="p-3 text-center font-mono font-bold">
                  {{ w.totalContributed }}
                </td>
                <td class="p-3 text-center font-mono font-bold text-emerald-600">
                  {{ w.completedCount }}
                </td>
                <td class="p-3 text-center font-mono font-bold text-[#026bb1]">
                  {{ w.inProgressCount }}
                </td>
                <td class="p-3 text-center font-mono font-bold text-purple-600">
                  {{ w.totalHours }} Jam
                </td>
                <td class="p-3 text-center font-mono text-gray-600 dark:text-gray-400">
                  {{ w.avgDuration }} mnt
                </td>
              </tr>
              <tr v-if="workerRecapData.length === 0">
                <td colspan="7" class="p-8 text-center text-gray-400 text-xs">
                  Tidak ada data teknisi IT terdaftar.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '~/stores/app';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Ticket as TicketIcon,
  Clock,
  Users,
} from 'lucide-vue-next';
import { exportTicketsToExcel, exportWorklogsToExcel, triggerPrintPDF } from '~/utils/export';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import AppSelect from '~/components/common/AppSelect.vue';
import type { Ticket } from '~/types';

const props = defineProps<{ tickets: Ticket[] }>();
const store = useAppStore();

const activeReportTab = ref<'TICKETS' | 'WORKLOGS' | 'WORKERS'>('TICKETS');

// Filter States
const timePreset = ref('ALL');
const customStartDate = ref('');
const customEndDate = ref('');
const filterWorker = ref('ALL');
const filterStatus = ref('ALL');
const filterCategory = ref('ALL');
const filterPriority = ref('ALL');

const timePresetOptions = [
  { value: 'ALL', label: 'Semua Waktu' },
  { value: 'TODAY', label: 'Hari Ini' },
  { value: '7_DAYS', label: '7 Hari Terakhir' },
  { value: 'THIS_MONTH', label: 'Bulan Ini' },
  { value: 'CUSTOM', label: 'Rentang Tanggal Kustom' },
];

const itWorkers = computed(() => {
  return store.allUsers.filter(u => u.role === 'IT_WORKER');
});

const workerOptions = computed(() => [
  { value: 'ALL', label: 'Semua Teknisi' },
  ...itWorkers.value.map(u => ({ value: u.id, label: u.name }))
]);

const statusOptions = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PROCESS', label: 'PROCESS (Dikerjakan)' },
  { value: 'SELESAI', label: 'SELESAI' },
  { value: 'DELEGASI', label: 'DELEGASI VENDOR' },
  { value: 'DRAFT', label: 'DRAFT' },
];

const categoryOptions = computed(() => [
  { value: 'ALL', label: 'Semua Kategori' },
  ...store.categories.map(cat => ({ value: cat.name, label: cat.name }))
]);

const priorityOptions = [
  { value: 'ALL', label: 'Semua Prioritas' },
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'LOW', label: 'LOW' },
];

const resetFilters = () => {
  timePreset.value = 'ALL';
  customStartDate.value = '';
  customEndDate.value = '';
  filterWorker.value = 'ALL';
  filterStatus.value = 'ALL';
  filterCategory.value = 'ALL';
  filterPriority.value = 'ALL';
};

const getTicketContributors = (t: Ticket): string => {
  const list = new Set<string>();
  if (t.assignedToName) list.add(t.assignedToName);
  if (t.assignedToName) list.add(t.assignedToName);
  (t.members || []).forEach(m => list.add(m.user_name));
  (t.worklogs || []).forEach(wl => {
    if (wl.worker_name) list.add(wl.worker_name);
  });
  return list.size > 0 ? Array.from(list).join(', ') : '-';
};

// Filtered Tickets
const filteredTickets = computed(() => {
  return props.tickets.filter(t => {
    // Status Filter
    if (filterStatus.value !== 'ALL' && t.status !== filterStatus.value) return false;

    // Category Filter
    if (filterCategory.value !== 'ALL' && t.category !== filterCategory.value) return false;

    // Priority Filter
    if (filterPriority.value !== 'ALL' && t.priority !== filterPriority.value) return false;

      // Worker Filter (check assignedTo, members, or worklog worker)
    if (filterWorker.value !== 'ALL') {
      const workerUser = store.allUsers.find(x => x.id === filterWorker.value);
      const workerName = workerUser?.name || '';

      const isAssigned = t.assignedTo === filterWorker.value;
      const isSupporting = (t.members || []).some(m => m.user_id === filterWorker.value);
      const hasWorklog = (t.worklogs || []).some(wl => wl.worker_id === filterWorker.value);

      if (!isAssigned && !isSupporting && !hasWorklog) return false;
    }

    // Time Preset Filter
    if (timePreset.value !== 'ALL') {
      const ticketDateStr = t.created_at ? t.created_at.split('T')[0] : '';
      const todayStr = new Date().toISOString().split('T')[0];

      if (timePreset.value === 'TODAY') {
        if (ticketDateStr !== todayStr) return false;
      } else if (timePreset.value === '7_DAYS') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const ticketDate = new Date(t.created_at);
        if (ticketDate < sevenDaysAgo) return false;
      } else if (timePreset.value === 'THIS_MONTH') {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!ticketDateStr.startsWith(currentMonth)) return false;
      } else if (timePreset.value === 'CUSTOM') {
        if (customStartDate.value && ticketDateStr < customStartDate.value) return false;
        if (customEndDate.value && ticketDateStr > customEndDate.value) return false;
      }
    }

    return true;
  });
});

// Filtered Worklogs
const filteredWorklogs = computed(() => {
  const list: { ticket: Ticket; wl: any }[] = [];
  filteredTickets.value.forEach(ticket => {
    (ticket.worklogs || []).forEach(wl => {
      if (filterWorker.value === 'ALL' || wl.worker_id === filterWorker.value) {
        list.push({ ticket, wl });
      }
    });
  });
  return list;
});

const countFilteredStatus = (status: string) => {
  return filteredTickets.value.filter(t => t.status === status).length;
};

const totalFilteredHours = computed(() => {
  const totalMin = filteredWorklogs.value.reduce((sum, item) => sum + (item.wl.duration_minutes || 0), 0);
  return (totalMin / 60).toFixed(1);
});

// Worker recap calculations (contributor-centric)
const workerRecapData = computed(() => {
  return itWorkers.value.map(user => {
    // Tickets where this user contributed (assigned, member, or wrote worklog)
    const contributedTickets = props.tickets.filter(t => {
      const isAssigned = t.assignedTo === user.id;
      const isSupporting = (t.members || []).some(m => m.user_id === user.id);
      const hasWorklog = (t.worklogs || []).some(wl => wl.worker_id === user.id);
      return isAssigned || isSupporting || hasWorklog;
    });

    const completedCount = contributedTickets.filter(t => t.status === 'SELESAI').length;
    const inProgressCount = contributedTickets.filter(t => t.status === 'PROCESS').length;

    let userMinutes = 0;
    let worklogCount = 0;
    props.tickets.forEach(t => {
      (t.worklogs || []).forEach(wl => {
        if (wl.worker_id === user.id) {
          userMinutes += wl.duration_minutes || 0;
          worklogCount++;
        }
      });
    });

    const avgDuration = worklogCount > 0 ? Math.round(userMinutes / worklogCount) : 0;

    return {
      user,
      totalContributed: contributedTickets.length,
      completedCount,
      inProgressCount,
      totalHours: (userMinutes / 60).toFixed(1),
      avgDuration,
    };
  });
});

const handleExportActiveTab = () => {
  if (activeReportTab.value === 'WORKLOGS') {
    exportWorklogsToExcel(filteredTickets.value, filterWorker.value !== 'ALL' ? filterWorker.value : undefined);
  } else {
    exportTicketsToExcel(filteredTickets.value);
  }
};

const handlePrintPDF = () => {
  triggerPrintPDF(`Laporan_Rekapitulasi_IT_${new Date().toISOString().slice(0, 10)}`);
};
</script>
