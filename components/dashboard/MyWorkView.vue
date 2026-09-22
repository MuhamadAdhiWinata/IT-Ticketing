<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#026bb1] dark:text-[#52b5f2] bg-[#e6f1f8] dark:bg-[#026bb1]/20 px-2.5 py-1 rounded-md border border-[#026bb1]/30">
          <Briefcase class="w-3.5 h-3.5" />
          <span>Halaman Pekerjaan Pribadi IT Worker</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Pekerjaan Saya ({{ currentUser.name }})
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Pantau langsung seluruh tiket yang menjadi tanggung jawab primer Anda maupun tim pendukung.
        </p>
      </div>

      <!-- Quick KPI counters -->
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 bg-[#e6f1f8] dark:bg-[#026bb1]/20 border border-[#026bb1]/30 rounded-xl text-center">
          <span class="text-[11px] text-[#026bb1] dark:text-[#52b5f2] font-bold block">Sedang Proses</span>
          <span class="text-lg font-bold text-[#024675] dark:text-white font-mono">{{ activeCount }}</span>
        </div>
        <div class="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-center">
          <span class="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">Delegasi</span>
          <span class="text-lg font-bold text-amber-950 dark:text-amber-200 font-mono">{{ delegatedCount }}</span>
        </div>
        <div class="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center">
          <span class="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">Telah Selesai</span>
          <span class="text-lg font-bold text-emerald-950 dark:text-emerald-200 font-mono">{{ completedCount }}</span>
        </div>
        <div class="px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-center">
          <span class="text-[11px] text-gray-500 font-bold block">Draft</span>
          <span class="text-lg font-bold text-gray-700 dark:text-gray-300 font-mono">{{ draftCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-3 transition-colors">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
        <div class="overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 w-full">
          <button
            v-for="st in ['ALL', 'PROCESS', 'SELESAI', 'DELEGASI', 'DRAFT']"
            :key="st"
            type="button"
            @click="statusFilter = st"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0',
              statusFilter === st
                ? 'bg-[#026bb1] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            ]"
          >
            {{ st === 'ALL' ? 'Semua Status' : st === 'SELESAI' ? 'SELESAI INTERNAL' : st }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tickets Grid/List -->
    <div v-if="filteredTickets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="t in filteredTickets"
        :key="t.id"
        @click="onSelectTicket(t)"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-mono font-bold text-[#026bb1] dark:text-[#52b5f2] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            {{ t.id }}
          </span>
          <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', getTicketPriorityBadgeClass(t.priority)]">
            {{ getTicketPriorityLabel(t.priority) }}
          </span>
        </div>

        <h3 class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#026bb1] dark:group-hover:text-[#52b5f2] transition-colors line-clamp-2">
          {{ t.title }}
        </h3>

        <div class="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Pelapor: {{ t.requestedByName }}</span>
          <span class="font-bold text-gray-700 dark:text-gray-300">{{ t.status }}</span>
        </div>
      </div>
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-12 text-center text-xs text-gray-400">
      Tidak ada tiket pekerjaan yang ditugaskan kepada Anda pada filter ini.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Briefcase } from 'lucide-vue-next';
import { AppUser, Ticket } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';

const props = defineProps<{
  tickets: Ticket[];
  currentUser: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
}>();

const statusFilter = ref('ALL');

const myAssignedTickets = computed(() => {
  const currentUserId = props.currentUser.id;
  return props.tickets.filter(t =>
    (t.assignedTo && t.assignedTo === currentUserId) ||
    (t.requestedBy && t.requestedBy === currentUserId) ||
    (t.members?.some(m => m.user_id === currentUserId)) ||
    (t.worklogs?.some(wl => wl.worker_id === currentUserId))
  );
});

const filteredTickets = computed(() => {
  if (statusFilter.value === 'ALL') return myAssignedTickets.value;
  return myAssignedTickets.value.filter(t => t.status === statusFilter.value);
});

const activeCount = computed(() => myAssignedTickets.value.filter(t => t.status === 'PROCESS').length);
const delegatedCount = computed(() => myAssignedTickets.value.filter(t => t.status === 'DELEGASI').length);
const completedCount = computed(() => myAssignedTickets.value.filter(t => t.status === 'SELESAI').length);
const draftCount = computed(() => myAssignedTickets.value.filter(t => t.status === 'DRAFT').length);
</script>
