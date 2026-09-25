<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-3">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>IT Helpdesk Dashboard</span>
          </div>
          <h1 class="text-xl font-bold text-foreground">IT Helpdesk Dashboard</h1>
          <p class="text-xs text-muted-foreground">Monitoring & Distribusi Penanganan Tiket IT</p>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg">
          <button
            v-for="mode in viewModes"
            :key="mode.id"
            @click="viewMode = mode.id"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
              viewMode === mode.id
                ? 'bg-surface shadow-xs text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <component :is="mode.icon" class="w-3.5 h-3.5" />
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
        <div class="relative md:col-span-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Tiket, Pelapor, atau Judul..."
            class="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <Search class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <AppSelect v-model="statusFilter" :options="statusOptions" size="sm" />
        <AppSelect v-model="priorityFilter" :options="priorityOptions" size="sm" />
      </div>
    </div>

    <!-- Kanban -->
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
          'bg-muted/40 p-3 rounded-lg border transition-all space-y-3 min-h-[400px]',
          'w-[85vw] sm:w-[300px] md:w-full shrink-0',
          draggedOverCol === col.id
            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
            : 'border-border'
        ]"
      >
        <div class="flex items-center justify-between px-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span :class="['w-2 h-2 rounded-full', col.colorClass]" />
            {{ col.title }}
          </span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface border border-border text-muted-foreground">
            {{ getTicketsByStatus(col.id).length }}
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="t in getTicketsByStatus(col.id)"
            :key="t.id"
            draggable="true"
            @dragstart="handleDragStart($event, t.id)"
            @dragend="handleDragEnd"
            @click="onSelectTicket(t)"
            :class="[
              'bg-surface p-3 rounded-lg border border-border shadow-xs hover:shadow-sm transition-all cursor-grab active:cursor-grabbing space-y-2 group touch-pan-y',
              draggedTicketId === t.id ? 'opacity-30 border-dashed border-primary' : ''
            ]"
          >
            <div class="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
              <span class="font-mono text-primary font-bold">{{ t.id }}</span>
              <UiStatusBadge :priority="t.priority" size="xs" />
            </div>

            <h3 class="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {{ t.title }}
            </h3>

            <div class="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span class="truncate max-w-[120px]">{{ t.requestedByName }}</span>
              <div class="flex items-center gap-1" @click.stop>
                <button
                  v-if="!t.assignedTo && t.status !== 'SELESAI'"
                  @click="onTakeTicket(t)"
                  class="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded text-[10px] font-bold transition-colors"
                >
                  Ambil
                </button>
                <div class="min-w-[90px]">
                  <AppSelect
                    :modelValue="t.status"
                    @update:modelValue="(val: string) => onMoveStatus(t.id, val as TicketStatus)"
                    :options="cardStatusOptions"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="getTicketsByStatus(col.id).length === 0" class="h-24 border border-dashed border-border rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">
            Kosong
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-else-if="viewMode === 'table'" class="bg-surface rounded-lg border border-border overflow-hidden shadow-xs">
      <div class="w-full overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              <th class="px-4 py-3">ID & Prioritas</th>
              <th class="px-4 py-3">Judul & Kategori</th>
              <th class="px-4 py-3">Pelapor</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border text-xs">
            <tr
              v-for="t in filteredTickets"
              :key="t.id"
              @click="onSelectTicket(t)"
              class="hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <td class="px-4 py-3">
                <span class="font-mono font-bold text-primary">{{ t.id }}</span>
                <div class="mt-0.5">
                  <UiStatusBadge :priority="t.priority" size="xs" />
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="font-bold text-foreground">{{ t.title }}</div>
                <div class="text-[10px] text-muted-foreground">{{ t.category }} · {{ t.subcategory }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="font-semibold text-foreground">{{ t.requestedByName }}</div>
                <div class="text-[10px] text-muted-foreground">{{ t.location }}</div>
              </td>
              <td class="px-4 py-3">
                <UiStatusBadge :status="t.status" size="xs" />
                <div class="text-[10px] text-muted-foreground mt-0.5">
                  <template v-if="t.members && t.members.length > 0">
                    <span v-for="(m, i) in t.members.slice(0, 2)" :key="m.id">{{ m.user_name }}<span v-if="i < Math.min(t.members.length, 2) - 1">, </span></span>
                    <span v-if="t.members.length > 2" class="text-muted-foreground/50">+{{ t.members.length - 2 }}</span>
                  </template>
                  <span v-else>Belum ditugaskan</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <UiButton variant="secondary" size="xs" @click.stop="onSelectTicket(t)">
                  Detail
                </UiButton>
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
import { Columns, Table as TableIcon, Search, LayoutGrid } from 'lucide-vue-next';
import type { AppUser, Ticket, TicketStatus } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';

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
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESS', label: 'Proses' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DELEGASI', label: 'Delegasi' },
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

const viewModes: Array<{ id: 'kanban' | 'table'; label: string; icon: any }> = [
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'table', label: 'Tabel', icon: TableIcon },
];

const kanbanColumns = [
  { id: 'DRAFT', title: 'Baru / Draft', colorClass: 'bg-muted-foreground' },
  { id: 'PROCESS', title: 'On-Progress', colorClass: 'bg-primary' },
  { id: 'SELESAI', title: 'Selesai Internal', colorClass: 'bg-success' },
  { id: 'DELEGASI', title: 'Didelegasikan', colorClass: 'bg-warning' },
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
