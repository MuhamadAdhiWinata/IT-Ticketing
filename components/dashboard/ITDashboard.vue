<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            IT Helpdesk Dashboard

          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Monitoring & Distribusi Penanganan Tiket IT</p>
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            v-for="mode in viewModes"
            :key="mode.id"
            @click="viewMode = mode.id"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              viewMode === mode.id
                ? 'bg-white dark:bg-slate-900 shadow-sm text-[#026bb1] dark:text-[#52b5f2]'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            <component :is="mode.icon" class="w-3.5 h-3.5" />
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <div class="relative md:col-span-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Tiket, Pelapor, atau Judul..."
            class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50"
          />
          <Search class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div class="min-w-[140px]">
          <AppSelect
            v-model="statusFilter"
            :options="statusOptions"
            size="sm"
          />
        </div>

        <div class="min-w-[140px]">
          <AppSelect
            v-model="priorityFilter"
            :options="priorityOptions"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- View Mode: Kanban Board (Horizontal Scroll Bebas di Mobile, Grid di Desktop) -->
    <div
      v-if="viewMode === 'kanban'"
      class="flex overflow-x-auto gap-4 pb-4 w-full custom-scrollbar md:grid md:grid-cols-4 md:overflow-visible md:pb-0 items-start"
    >
      <div
        v-for="col in kanbanColumns"
        :key="col.id"
        @dragover.prevent="draggedOverCol = col.id"
        @dragleave="draggedOverCol = null"
        @drop="handleDrop($event, col.id as TicketStatus)"
        :class="[
          'bg-gray-50/80 dark:bg-slate-900/60 p-3 rounded-2xl border transition-all space-y-3 min-h-[480px]',
          'w-[85vw] sm:w-[320px] md:w-full shrink-0',
          draggedOverCol === col.id
            ? 'border-[#026bb1] ring-2 ring-[#026bb1]/30 bg-blue-50/40 dark:bg-slate-800/80'
            : 'border-gray-200/60 dark:border-slate-800'
        ]"
      >
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span :class="['w-2.5 h-2.5 rounded-full', col.colorBg]" />
            {{ col.title }}
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-600 dark:text-gray-300">
            {{ getTicketsByStatus(col.id).length }}
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="t in getTicketsByStatus(col.id)"
            :key="t.id"
            draggable="true"
            @dragstart="handleDragStart($event, t.id)"
            @dragend="handleDragEnd"
            @click="onSelectTicket(t)"
            :class="[
              'bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 group touch-pan-y',
              draggedTicketId === t.id ? 'opacity-40 border-dashed border-[#026bb1]' : ''
            ]"
          >
            <div class="flex items-center justify-between text-[10px] font-semibold text-gray-400">
              <span class="font-mono text-[#026bb1] dark:text-[#52b5f2] font-bold">{{ t.id }}</span>
              <div class="flex items-center gap-1.5">
                <span :class="['px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono', getTicketPriorityBadgeClass(t.priority)]">{{ getTicketPriorityLabel(t.priority) }}</span>
              </div>
            </div>

            <h3 class="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#026bb1] transition-colors line-clamp-2">
              {{ t.title }}
            </h3>

            <!-- Quick Status Change Actions for Mobile / Touch Screen -->
            <div class="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-gray-500">
              <span class="truncate max-w-[120px]">{{ t.requestedByName }}</span>
              <div class="flex items-center gap-1" @click.stop>
                <button
                  v-if="!t.assignedTo && t.status !== 'SELESAI'"
                  @click="onTakeTicket(t)"
                  class="px-2 py-1 bg-blue-50 text-[#026bb1] dark:bg-blue-950/60 dark:text-[#52b5f2] hover:bg-[#026bb1] hover:text-white rounded text-[10px] font-bold transition-colors"
                >
                  Ambil Tiket
                </button>
                <div class="min-w-[100px]">
                  <AppSelect
                    :modelValue="t.status"
                    @update:modelValue="val => onMoveStatus(t.id, val as TicketStatus)"
                    :options="cardStatusOptions"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="getTicketsByStatus(col.id).length === 0" class="h-32 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-gray-400">
            Tarik atau geser tiket ke sini
          </div>
        </div>
      </div>
    </div>

    <!-- View Mode: Table -->
    <div v-else-if="viewMode === 'table'" class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div class="w-full overflow-x-auto md:overflow-x-visible custom-scrollbar">
        <table class="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
              <th class="p-3.5">ID & Prioritas</th>
              <th class="p-3.5">Judul & Kategori</th>
              <th class="p-3.5">Pelapor</th>
              <th class="p-3.5">Status & Teknisi</th>
              <th class="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
            <tr
              v-for="t in filteredTickets"
              :key="t.id"
              @click="onSelectTicket(t)"
              class="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <td class="p-3.5 font-mono font-bold text-[#026bb1] dark:text-[#52b5f2]">
                {{ t.id }}
                <div>
                  <span :class="['px-1.5 py-0.5 rounded text-[9px] font-bold font-sans uppercase inline-block mt-0.5', getTicketPriorityBadgeClass(t.priority)]">{{ getTicketPriorityLabel(t.priority) }}</span>
                </div>
              </td>
              <td class="p-3.5">
                <div class="font-bold text-gray-900 dark:text-white">{{ t.title }}</div>
                <div class="text-[10px] text-gray-400">{{ t.category }} • {{ t.subcategory }}</div>
              </td>
              <td class="p-3.5">
                <div class="font-semibold text-gray-800 dark:text-gray-200">{{ t.requestedByName }}</div>
                <div class="text-[10px] text-gray-400">{{ t.location }}</div>
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-[#026bb1] dark:text-[#52b5f2]">
                  {{ t.status }}
                </span>
                <div class="text-[10px] text-gray-400 mt-0.5">{{ t.assignedToName || 'Belum ditugaskan' }}</div>
              </td>
              <td class="p-3.5 text-right">
                <button @click.stop="onSelectTicket(t)" class="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200">
                  Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Columns, Table as TableIcon, LayoutGrid, Search } from 'lucide-vue-next';
import type { AppUser, Ticket, TicketStatus } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import AppSelect from '~/components/common/AppSelect.vue';

const props = defineProps<{
  tickets: Ticket[];
  currentUser: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
  onTakeTicket: (ticket: Ticket) => void;
  onMoveStatus: (ticketId: string, newStatus: TicketStatus) => void;
}>();

const viewMode = ref<'kanban' | 'table'>('kanban');
const searchQuery = ref('');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');

const statusOptions = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'PROCESS', label: 'ON-PROGRESS' },
  { value: 'SELESAI', label: 'SELESAI INTERNAL' },
  { value: 'DELEGASI', label: 'DIDELEGASIKAN' },
];

const priorityOptions = [
  { value: 'ALL', label: 'Semua Prioritas' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const cardStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DELEGASI', label: 'Delegasi' },
];

const viewModes = [
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'table', label: 'Tabel', icon: TableIcon },
];

const kanbanColumns = [
  { id: 'DRAFT', title: 'Baru / Draft', colorBg: 'bg-gray-400' },
  { id: 'PROCESS', title: 'On-Progress', colorBg: 'bg-[#026bb1]' },
  { id: 'SELESAI', title: 'Selesai Internal', colorBg: 'bg-emerald-500' },
  { id: 'DELEGASI', title: 'Didelegasikan', colorBg: 'bg-amber-500' },
];

const filteredTickets = computed(() => {
  return props.tickets.filter(t => {
    const q = searchQuery.value.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.requestedByName.toLowerCase().includes(q);
    const matchStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    const matchPriority = priorityFilter.value === 'ALL' || t.priority === priorityFilter.value;

    return matchSearch && matchStatus && matchPriority;
  });
});

const draggedTicketId = ref<string | null>(null);
const draggedOverCol = ref<string | null>(null);

const handleDragStart = (e: DragEvent, ticketId: string) => {
  draggedTicketId.value = ticketId;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticketId);
  }
};

const handleDragEnd = () => {
  draggedTicketId.value = null;
  draggedOverCol.value = null;
};

const handleDrop = (e: DragEvent, newStatus: TicketStatus) => {
  e.preventDefault();
  const ticketId = e.dataTransfer?.getData('text/plain') || draggedTicketId.value;
  if (ticketId) {
    props.onMoveStatus(ticketId, newStatus);
  }
  draggedTicketId.value = null;
  draggedOverCol.value = null;
};

const getTicketsByStatus = (status: string) => filteredTickets.value.filter(t => t.status === status);
</script>
