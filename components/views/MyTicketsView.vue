<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="bg-surface rounded-lg border border-border p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
          <ClipboardList class="w-3.5 h-3.5" />
          <span>Riwayat Tiket Pribadi</span>
        </div>
        <h2 class="text-lg font-bold text-foreground">Tiket Saya ({{ currentUser.name }})</h2>
        <p class="text-xs text-muted-foreground">
          Daftar seluruh tiket yang Anda ajukan. Hanya tiket milik Anda yang tampil di sini.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg text-center">
          <span class="text-[10px] text-primary font-bold block">Total</span>
          <span class="text-base font-bold text-primary font-mono">{{ store.myTickets.length }}</span>
        </div>
        <div class="px-3 py-2 bg-success/5 border border-success/15 rounded-lg text-center">
          <span class="text-[10px] text-success font-bold block">Selesai</span>
          <span class="text-base font-bold text-success font-mono">{{ completedCount }}</span>
        </div>
        <button
          type="button"
          class="px-3.5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
          @click="store.openCreateTicket()"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Tiket Baru</span>
        </button>
      </div>
    </div>

    <!-- Status Filter -->
    <div class="bg-surface rounded-lg border border-border p-3 shadow-xs">
      <div class="flex overflow-x-auto no-scrollbar items-center gap-1.5">
        <button
          v-for="st in ['ALL', 'DRAFT', 'PROCESS', 'DELEGASI', 'SELESAI']"
          :key="st"
          type="button"
          @click="statusFilter = st"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0',
            statusFilter === st
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted text-muted-foreground hover:bg-border/50'
          ]"
        >
          {{ st === 'ALL' ? 'Semua Status' : st === 'SELESAI' ? 'Selesai' : st }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.myTicketsLoading" class="bg-surface rounded-lg border border-border p-8 shadow-xs text-center text-xs text-muted-foreground font-medium">
      Memuat tiket Anda...
    </div>

    <!-- Table -->
    <div v-else class="bg-surface rounded-lg border border-border shadow-xs overflow-x-auto custom-scrollbar">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
            <th class="p-3">Kode Tiket</th>
            <th class="p-3">Detail Tiket</th>
            <th class="p-3">Prioritas</th>
            <th class="p-3">Status</th>
            <th class="p-3">Tanggal Diajukan</th>
            <th class="p-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="t in filteredTickets"
            :key="t.id"
            class="hover:bg-muted/70 transition-colors cursor-pointer"
            @click="onSelectTicket(t)"
          >
            <td class="p-3 font-mono font-bold text-primary">{{ t.id }}</td>
            <td class="p-3">
              <div class="font-bold text-foreground">{{ t.title }}</div>
              <div class="text-[10px] text-muted-foreground mt-0.5">
                {{ t.category }} · {{ t.project_kendala }}<template v-if="t.submodule"> · {{ t.submodule }}</template>
                <template v-if="t.location"> · {{ t.location }}</template>
              </div>
            </td>
            <td class="p-3"><UiStatusBadge :priority="t.priority" size="xs" /></td>
            <td class="p-3"><UiStatusBadge :status="t.status" size="xs" /></td>
            <td class="p-3 text-muted-foreground whitespace-nowrap">{{ formatDate(t.created_at) }}</td>
            <td class="p-3 text-right">
              <button
                type="button"
                class="text-primary hover:underline font-bold"
                @click.stop="onSelectTicket(t)"
              >
                Lihat Detail
              </button>
            </td>
          </tr>
          <tr v-if="filteredTickets.length === 0">
            <td colspan="6" class="p-8 text-center text-muted-foreground text-xs">
              {{ store.myTickets.length === 0
                ? 'Belum ada tiket yang Anda ajukan. Klik "Buat Tiket Baru" untuk mengajukan.'
                : `Tidak ada tiket dengan status "${statusFilter}".` }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ClipboardList, Plus } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import type { AppUser, Ticket } from '~/types';

const props = defineProps<{
  tickets: Ticket[];
  currentUser: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
}>();

const store = useAppStore();
const statusFilter = ref('ALL');

const completedCount = computed(() =>
  store.myTickets.filter(t => t.status === 'SELESAI').length
);

const filteredTickets = computed(() => {
  if (statusFilter.value === 'ALL') return props.tickets;
  return props.tickets.filter(t => t.status === statusFilter.value);
});

const formatDate = (iso: string) => {
  if (!iso) return '-';
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Refetch setiap kali tab dibuka agar data selalu up-to-date
const load = () => store.fetchMyTickets();
onMounted(load);
watch(() => store.activeTab, (tab) => {
  if (tab === 'my-tickets') load();
});
</script>
