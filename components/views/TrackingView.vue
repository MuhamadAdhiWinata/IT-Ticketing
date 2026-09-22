<template>
  <div class="mx-auto space-y-6 px-2 sm:px-0">
    <!-- Header Banner -->
    <div class="bg-[#026bb1] text-white rounded-2xl p-4 sm:p-8 shadow-xl relative overflow-hidden">
      <div class="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div class="relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 text-white text-[11px] sm:text-xs font-semibold border border-white/20 backdrop-blur-xs">
            <span class="w-7 h-5 flex items-center justify-center">
              <img src="../../assets/image/IO.png" alt="logo" class="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <span class="truncate">Tracking Tiket IT Percetakan Integral Offset</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="onCreateTicketClick"
              @click="onCreateTicketClick"
              class="w-full sm:w-auto px-4 py-2.5 bg-white text-[#026bb1] hover:bg-blue-50 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <PlusCircle class="w-4 h-4" /> Buat Tiket Baru
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <h1 class="text-lg sm:text-2xl font-extrabold tracking-tight">Cek Status & Progress Pengerjaan Tiket</h1>
          <p class="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
            Masukkan Nomor Kode Tiket Anda untuk melihat riwayat status terkini dan delegasi pekerjaan teknisi secara real-time.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="pt-2">
          <div class="relative max-w-xl">
            <input
              v-model="searchId"
              type="text"
              placeholder="Cari No. Resi Tiket (Cth: TCK-...)"
              class="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 font-medium text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-blue-300/50 shadow-lg"
            />
            <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <!-- Quick Samples -->
          <div class="flex items-center gap-2 mt-3 text-xs text-blue-100/80 overflow-x-auto pb-1">
            <span class="shrink-0 font-medium">Contoh Resi:</span>
            <button
              v-for="sample in sampleIds"
              :key="sample"
              @click="searchId = sample"
              class="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-mono text-[11px] border border-white/10 transition-colors shrink-0"
            >
              {{ sample }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Found Ticket Result -->
    <div v-if="activeTicket" class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 sm:space-y-6 p-4 sm:p-6">
      <!-- Ticket Overview Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-gray-100 dark:border-slate-800">
        <div class="min-w-0 space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-[#026bb1] dark:text-[#52b5f2] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {{ activeTicket.id }}
            </span>
            <component :is="getStatusBadge(activeTicket.status)" />
          </div>
          <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">{{ activeTicket.title }}</h2>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1"><MapPin class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.location }}</span>
            <span class="flex items-center gap-1"><User class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.requestedByName }} ({{ activeTicket.requestedByDept }})</span>
            <span v-if="activeTicket.created_by_admin_name && activeTicket.created_by_admin_id !== activeTicket.requestedBy" class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Shield class="w-3.5 h-3.5 shrink-0" />
              Dibuat oleh Admin: {{ activeTicket.created_by_admin_name }}
            </span>
          </div>
        </div>

        <button
          @click="onSelectTicket(activeTicket)"
          class="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
        >
          <span>Detail Lengkap</span>
          <ExternalLink class="w-4 h-4" />
        </button>
      </div>

      <!-- Description -->
      <div class="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-xs text-gray-700 dark:text-gray-300">
        <strong class="text-gray-900 dark:text-white block mb-1">Deskripsi Permasalahan:</strong>
        {{ activeTicket.description }}
      </div>

      <!-- Timeline Tracking Step (JNE-Style) -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Riwayat Status Pelacakan</h3>

        <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-slate-800">
          <div v-for="(log, idx) in activeTicket.audit_logs" :key="idx" class="relative">
            <div class="absolute -left-6 top-0 w-5 h-5 rounded-full bg-[#026bb1] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
              ✓
            </div>
            <div class="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-gray-900 dark:text-white">{{ log.action }}</span>
                <span class="text-[10px] text-gray-400">{{ new Date(log.performed_at).toLocaleString() }}</span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Oleh: {{ log.performed_by_name }}</p>
              <p v-if="log.notes" class="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">"{{ log.notes }}"</p>
              <p v-for="wl in matchingWorklogs(log.action)" :key="wl.id" class="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">"{{ wl.description }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found View -->
    <div v-else-if="searchId.trim()" class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-3">
      <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <h3 class="text-base font-bold text-gray-900 dark:text-white">Tiket "{{ searchId }}" Tidak Ditemukan</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Periksa kembali nomor resi tiket Anda atau pastikan formatnya sudah benar (contoh: TCK-202609-001).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import {
  Search, CheckCircle2, Clock, ExternalLink, MapPin, User,
  PlusCircle, AlertTriangle, Shield
} from 'lucide-vue-next';
import type { AppUser, Ticket } from '~/types';

const props = defineProps<{
  tickets: Ticket[];
  currentUser?: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
  onQuickTrackId?: string | null;
  onCreateTicketClick?: () => void;
}>();

const searchId = ref(props.onQuickTrackId || 'TCK-202609-001');
const sampleIds = ['TCK-202609-001', 'TCK-202609-002', 'TCK-202609-003', 'TCK-202609-005'];

const activeTicket = computed(() => props.tickets.find(t => t.id.toLowerCase() === searchId.value.trim().toLowerCase()));

const stageMap: Record<string, string> = {
  TAHAP_ASSIGN_SELESAI: 'ASSIGN',
  TAHAP_IN_PROGRESS_SELESAI: 'IN_PROGRESS',
  TAHAP_COMPLETION_SELESAI: 'COMPLETION',
};

const matchingWorklogs = (action: string) => {
  if (!activeTicket.value?.worklogs) return [];
  const stageKey = stageMap[action];
  if (!stageKey) return [];
  return activeTicket.value.worklogs.filter(wl => wl.stageKey === stageKey);
};

const getStatusBadge = (status: Ticket['status']) => {
  switch (status) {
    case 'DRAFT':
      return h('span', { class: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700' }, 'DRAFT');
    case 'PROCESS':
      return h('span', { class: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f1f8] dark:bg-[#026bb1]/20 text-[#026bb1] dark:text-[#52b5f2] border border-[#026bb1]/30' }, 'DIPROSES');
    case 'DELEGASI':
      return h('span', { class: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700' }, 'DIDELEGASIKAN');
    case 'SELESAI':
      return h('span', { class: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' }, 'SELESAI');
  }
};
</script>
