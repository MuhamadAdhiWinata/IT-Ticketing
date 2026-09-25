<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
          <Briefcase class="w-3.5 h-3.5" />
          <span>Pekerjaan Pribadi IT Worker</span>
        </div>
        <h2 class="text-lg font-bold text-foreground">
          Pekerjaan Saya ({{ currentUser.name }})
        </h2>
        <p class="text-xs text-muted-foreground">
          Pantau langsung seluruh tiket yang menjadi tanggung jawab primer Anda maupun tim pendukung.
        </p>
      </div>

      <!-- KPI -->
      <div class="flex items-center gap-2">
        <div class="px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg text-center">
          <span class="text-[10px] text-primary font-bold block">Proses</span>
          <span class="text-base font-bold text-primary font-mono">{{ activeCount }}</span>
        </div>
        <div class="px-3 py-2 bg-warning/5 border border-warning/15 rounded-lg text-center">
          <span class="text-[10px] text-warning font-bold block">Delegasi</span>
          <span class="text-base font-bold text-warning font-mono">{{ delegatedCount }}</span>
        </div>
        <div class="px-3 py-2 bg-success/5 border border-success/15 rounded-lg text-center">
          <span class="text-[10px] text-success font-bold block">Selesai</span>
          <span class="text-base font-bold text-success font-mono">{{ completedCount }}</span>
        </div>
        <div class="px-3 py-2 bg-muted border border-border rounded-lg text-center">
          <span class="text-[10px] text-muted-foreground font-bold block">Draft</span>
          <span class="text-base font-bold text-muted-foreground font-mono">{{ draftCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface rounded-lg border border-border p-3 shadow-xs">
      <div class="flex overflow-x-auto no-scrollbar items-center gap-1.5">
        <button
          v-for="st in ['ALL', 'PROCESS', 'SELESAI', 'DELEGASI', 'DRAFT']"
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

    <!-- Grid -->
    <div v-if="filteredTickets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="t in filteredTickets"
        :key="t.id"
        @click="onSelectTicket(t)"
        class="bg-surface rounded-lg border border-border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-2.5 group"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">
            {{ t.id }}
          </span>
          <UiStatusBadge :priority="t.priority" size="xs" />
        </div>

        <h3 class="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {{ t.title }}
        </h3>

        <div class="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ t.requestedByName }}</span>
          <UiStatusBadge :status="t.status" size="xs" />
        </div>
      </div>
    </div>

    <UiEmptyState v-else title="Tidak ada tiket" description="Tidak ada tiket pekerjaan yang ditugaskan kepada Anda pada filter ini." />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Briefcase } from 'lucide-vue-next';
import type { AppUser, Ticket } from '~/types';

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
