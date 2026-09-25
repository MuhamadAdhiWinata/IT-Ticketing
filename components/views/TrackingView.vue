<template>
  <div class="mx-auto space-y-6 px-2 sm:px-0">
    <!-- Header Banner -->
    <div class="bg-primary text-primary-foreground rounded-lg p-5 sm:p-8 relative overflow-hidden">
      <div class="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div class="relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-[11px] sm:text-xs font-semibold border border-white/15">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <img :src="settings.logoUrl || '/images/IO.png'" alt="Logo" class="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            </div>
            <span class="truncate">Tracking Tiket IT {{ settings.companyName }}</span>
          </div>
          <UiButton
            v-if="onCreateTicketClick"
            variant="secondary"
            size="sm"
            class="sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
            @click="onCreateTicketClick"
          >
            <PlusCircle class="w-4 h-4" /> Buat Tiket Baru
          </UiButton>
        </div>

        <div class="space-y-1">
          <h1 class="text-lg sm:text-2xl font-bold tracking-tight">Cek Status & Progress Pengerjaan Tiket</h1>
          <p class="text-xs sm:text-sm text-primary-foreground/70 max-w-2xl">
            Masukkan Nomor Kode Tiket Anda untuk melihat riwayat status terkini dan delegasi pekerjaan teknisi secara real-time.
          </p>
        </div>

        <!-- Search -->
        <div class="pt-2">
          <div class="relative max-w-xl">
            <input
              v-model="searchId"
              type="text"
              placeholder="Cari No. Resi Tiket (Cth: TCK-...)"
              class="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-foreground placeholder-muted-foreground font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/40 shadow-md"
            />
            <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div class="flex items-center gap-2 mt-3 text-xs text-primary-foreground/60 overflow-x-auto pb-1">
            <span class="shrink-0 font-medium">Contoh Resi:</span>
            <button
              v-for="sample in sampleIds"
              :key="sample"
              @click="searchId = sample"
              class="px-2 py-0.5 bg-white/10 hover:bg-white/15 rounded-md font-mono text-[11px] border border-white/10 transition-colors shrink-0"
            >
              {{ sample }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Found Ticket -->
    <div v-if="activeTicket" class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div class="min-w-0 space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
              {{ activeTicket.id }}
            </span>
            <UiStatusBadge :status="activeTicket.status" />
          </div>
          <h2 class="text-base sm:text-lg font-bold text-foreground break-words">{{ activeTicket.title }}</h2>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><MapPin class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.location }}</span>
            <span class="flex items-center gap-1"><User class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.requestedByName }} ({{ activeTicket.requestedByDept }})</span>
            <span v-if="activeTicket.created_by_admin_name && activeTicket.created_by_admin_id !== activeTicket.requestedBy" class="flex items-center gap-1 text-warning">
              <Shield class="w-3.5 h-3.5 shrink-0" />
              Dibuat oleh Admin: {{ activeTicket.created_by_admin_name }}
            </span>
          </div>
        </div>

        <UiButton size="sm" class="shrink-0 sm:w-auto w-full" @click="onSelectTicket(activeTicket)">
          <span>Detail Lengkap</span>
          <ExternalLink class="w-4 h-4" />
        </UiButton>
      </div>

      <!-- Description -->
      <div class="bg-muted/50 p-3 rounded-lg border border-border text-xs text-foreground/80">
        <strong class="text-foreground block mb-1">Deskripsi Permasalahan:</strong>
        {{ activeTicket.description }}
      </div>

      <!-- Timeline -->
      <div class="space-y-3">
        <h3 class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Riwayat Status Pelacakan</h3>

        <div class="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          <div v-for="(log, idx) in activeTicket.audit_logs" :key="idx" class="relative">
            <div class="absolute -left-6 top-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <div class="bg-muted/30 p-3 rounded-lg border border-border">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-foreground">{{ log.action }}</span>
                <span class="text-[10px] text-muted-foreground">{{ new Date(log.performed_at).toLocaleString() }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">Oleh: {{ log.performed_by_name }}</p>
              <p v-if="log.notes" class="text-xs text-muted-foreground italic mt-0.5">"{{ log.notes }}"</p>
              <p v-for="wl in matchingWorklogs(log.action)" :key="wl.id" class="text-xs text-muted-foreground italic mt-0.5">"{{ wl.description }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="searchId.trim()" class="bg-surface rounded-lg border border-border p-8 text-center space-y-3">
      <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-bold text-foreground">Tiket "{{ searchId }}" Tidak Ditemukan</h3>
      <p class="text-xs text-muted-foreground max-w-md mx-auto">
        Periksa kembali nomor resi tiket Anda atau pastikan formatnya sudah benar (contoh: TCK-202609-001).
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import {
  Search, ExternalLink, MapPin, User,
  PlusCircle, AlertTriangle, Shield
} from 'lucide-vue-next';
import type { AppUser, Ticket } from '~/types';
import { useCompany } from '~/composables/useCompany';

const { settings } = useCompany();

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
</script>
