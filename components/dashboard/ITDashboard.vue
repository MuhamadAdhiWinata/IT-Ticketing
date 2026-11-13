<template>
  <div class="space-y-5">
    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <LayoutGrid class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-muted-foreground uppercase">Total Tiket</p>
          <p class="text-xl font-bold text-foreground">{{ stats.total }}</p>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
          <UserCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-muted-foreground uppercase">Dikerjakan tanpa Pelaksana</p>
          <p class="text-xl font-bold text-foreground">{{ stats.unassigned }}</p>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex items-center gap-4">
        <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', stats.slaBreached > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 animate-pulse' : 'bg-muted text-muted-foreground']">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-muted-foreground uppercase">SLA Breach</p>
          <p :class="['text-xl font-bold', stats.slaBreached > 0 ? 'text-red-600' : 'text-foreground']">{{ stats.slaBreached }}</p>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
          <Inbox class="w-5 h-5" />
        </div>
        <div>
          <p class="text-[10px] font-bold text-muted-foreground uppercase">Baru</p>
          <p class="text-xl font-bold text-foreground">{{ stats.incoming }}</p>
        </div>
      </div>
    </div>

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

        <div class="flex items-center gap-2">
          <!-- Activity Toggle -->
          <button
            @click="showActivity = !showActivity"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border',
              showActivity
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface text-muted-foreground border-border hover:bg-muted'
            ]"
          >
            <Activity class="w-3.5 h-3.5" />
            <span>Antrean IT</span>
            <span v-if="activityCount > 0" class="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {{ activityCount }}
            </span>
          </button>

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
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
        <div class="relative md:col-span-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari Tiket, Pelapor, atau Judul..."
            class="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          <Search class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <AppSelect v-model="statusFilter" :options="statusOptions" size="sm" />
        <AppSelect v-model="priorityFilter" :options="priorityOptions" size="sm" />
        <AppSelect v-model="urgencyFilter" :options="urgencyOptions" size="sm" />
        <AppSelect v-model="impactFilter" :options="impactOptions" size="sm" />
      </div>

      <!-- Technician Workload Summary -->
      <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pt-2">
        <span class="text-[10px] font-bold text-muted-foreground uppercase shrink-0">Workload:</span>
        <div v-for="w in technicianWorkload" :key="w.id" class="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted/30 shrink-0">
          <div class="w-1.5 h-1.5 rounded-full" :class="w.activeCount > 3 ? 'bg-red-500' : w.activeCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'" />
          <span class="text-[10px] font-semibold text-foreground">{{ w.name }}</span>
          <span class="text-[10px] font-bold px-1 rounded bg-surface border border-border text-primary">{{ w.activeCount }}</span>
        </div>
      </div>
    </div>

    <!-- IT Activity Feed -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showActivity">
        <TicketIncomingLog @selectTicket="(id) => onSelectTicket({ id } as Ticket)" />
      </div>
    </Transition>

    <!-- Kanban -->
    <div
      v-if="viewMode === 'kanban'"
      class="flex overflow-x-auto gap-4 pb-4 w-full custom-scrollbar items-start snap-x snap-proximity overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch]"
    >
      <div
        v-for="col in kanbanColumns"
        :key="col.id"
        @dragover.prevent="draggedOverCol = col.id"
        @dragleave="draggedOverCol === col.id && (draggedOverCol = null)"
        @drop="handleDrop($event, col.id)"
        :class="[
          'p-3 rounded-lg border transition-colors space-y-3 min-h-[400px] w-[85vw] sm:w-[280px] shrink-0 snap-start',
          draggedOverCol === col.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'bg-muted/40 border-border',
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
              'bg-surface p-3 rounded-lg border border-border shadow-xs hover:shadow-sm transition-all cursor-grab active:cursor-grabbing space-y-2 group',
              draggedTicketId === t.id ? 'opacity-30 border-dashed border-primary' : '',
            ]"
          >
            <div class="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
              <span class="font-mono text-primary font-bold">{{ t.id }}</span>
              <div class="flex items-center gap-1.5">
                <div v-if="isSlaBreached(t)" class="flex items-center gap-0.5 text-red-600 animate-pulse" title="SLA Breached!">
                  <AlertTriangle class="w-3 h-3" />
                  <span class="font-bold">SLA</span>
                </div>
                <PriorityBadge :ticket="t" />
              </div>
            </div>

            <h3 class="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {{ t.title }}
            </h3>

            <div class="pt-2 border-t border-border flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div class="min-w-0">
                <span class="block truncate text-foreground/80 font-semibold">{{ t.requestedByName }}</span>
                <span class="block truncate" :title="requesterIdentity(t)">{{ orgLabel(t) || t.requestedByDept || '-' }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <button
                  v-if="t.status_phase === 'Dikerjakan' && !t.assignedTo && !auth.canTriage"
                  @click="onTakeTicket(t)"
                  class="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded text-[10px] font-bold transition-colors"
                >
                  Ambil
                </button>
                <span v-else-if="t.assignedTo" class="truncate max-w-[110px] text-[10px] font-semibold text-foreground/80" :title="t.assignedToName">{{ t.assignedToName }}</span>
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
                  <PriorityBadge :ticket="t" />
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="font-bold text-foreground">{{ t.title }}</div>
                <div class="text-[10px] text-muted-foreground">{{ t.category }} · {{ t.project_kendala }}<template v-if="t.submodule"> · {{ t.submodule }}</template></div>
              </td>
              <td class="px-4 py-3">
                <div class="font-semibold text-foreground">{{ t.requestedByName }}</div>
                <div class="text-[10px] text-muted-foreground truncate max-w-[220px]" :title="requesterIdentity(t)">{{ requesterIdentity(t) }}</div>
                <div class="text-[10px] text-muted-foreground">{{ t.location || '-' }}</div>
              </td>
              <td class="px-4 py-3">
                <UiStatusBadge :status="t.status" :label="t.status_label" size="xs" />
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
import { isITRole } from '~/utils/roles';
import { ref, computed } from 'vue';
import {
  Columns,
  Table as TableIcon,
  Search,
  LayoutGrid,
  Activity,
  AlertTriangle,
  UserCheck,
  Inbox,
  Clock
} from 'lucide-vue-next';
import type { AppUser, Ticket } from '~/types';
import { useAuthStore } from '~/stores/auth';
import { useAppStore } from '~/stores/app';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import PriorityBadge from '~/components/common/PriorityBadge.vue';
import TicketIncomingLog from '~/components/common/TicketIncomingLog.vue';
import AppSelect from '~/components/common/AppSelect.vue';
import { formatOrgLabel, formatRequesterIdentity } from '~/utils/identity';
import { STATUS_FILTERS, matchesStatusFilter } from '~/utils/ticketSpec';

const isSlaBreached = (t: Ticket) =>
  !!t.sla && (t.sla.response_status === 'BREACHED' || t.sla.resolution_status === 'BREACHED') && t.status !== 'SELESAI';

const appStore = useAppStore();

const props = withDefaults(defineProps<{
  tickets: Ticket[];
  allUsers: AppUser[];
  currentUser: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
  onTakeTicket: (ticket: Ticket) => void;
  activityCount?: number;
}>(), {
  activityCount: 0,
});

// Stats
const auth = useAuthStore();

const stats = computed(() => {
  const all = props.tickets;
  return {
    total: all.length,
    unassigned: all.filter(t => !t.assignedTo && t.status_phase === 'Dikerjakan').length,
    slaBreached: all.filter(isSlaBreached).length,
    incoming: all.filter(t => t.status_phase === 'Baru').length,
  };
});

const technicianWorkload = computed(() => {
  const itWorkers = props.allUsers?.filter(u => isITRole(u.role) && u.role !== 'SYSTEM_ADMIN') || [];
  return itWorkers.map(w => {
    const active = props.tickets.filter(t => t.assignedTo === w.id && t.status_phase === 'Dikerjakan').length;
    return { ...w, activeCount: active };
  }).sort((a, b) => b.activeCount - a.activeCount);
});

// Identitas pelapor pada kartu & tabel dashboard.
function orgLabel(t: Ticket) {
  return formatOrgLabel({
    company: t.requested_by_company,
    division: t.requested_by_division,
    department: t.requestedByDept,
  });
}

function requesterIdentity(t: Ticket) {
  return formatRequesterIdentity({
    name: t.requestedByName,
    company: t.requested_by_company,
    division: t.requested_by_division,
    department: t.requestedByDept,
  }, '-');
}

const viewMode = ref<'kanban' | 'table'>('kanban');
const searchQuery = ref('');
const statusFilter = ref('ALL');
const priorityFilter = ref('ALL');
const showActivity = ref(false);

const statusOptions = [
  { value: 'ALL', label: 'Semua Status' },
  ...STATUS_FILTERS.map(p => ({ value: p, label: p })),
];

// Prioritas P1-P4, Urgensi, dan Dampak: opsi dan label dari master (Master Data > Prioritas & Triase).
const urgencyFilter = ref('ALL');
const impactFilter = ref('ALL');
const priorityOptions = computed(() => [
  { value: 'ALL', label: 'Semua Prioritas' },
  ...(appStore.triageMaster?.priorities ?? []).map(p => ({ value: p.id, label: `${p.id} · ${p.label}` })),
]);
const urgencyOptions = computed(() => [
  { value: 'ALL', label: 'Semua Urgensi' },
  ...(appStore.triageMaster?.urgencies ?? []).map(u => ({ value: u.id, label: u.label })),
]);
const impactOptions = computed(() => [
  { value: 'ALL', label: 'Semua Dampak' },
  ...(appStore.triageMaster?.impacts ?? []).map(i => ({ value: i.id, label: i.label })),
]);

const viewModes: Array<{ id: 'kanban' | 'table'; label: string; icon: any }> = [
  { id: 'kanban', label: 'Kanban', icon: Columns },
  { id: 'table', label: 'Tabel', icon: TableIcon },
];

const kanbanColumns = [
  { id: 'Baru', title: 'Baru', colorClass: 'bg-muted-foreground' },
  { id: 'Diakui', title: 'Diakui', colorClass: 'bg-info' },
  { id: 'Ditriase', title: 'Ditriase', colorClass: 'bg-info' },
  { id: 'Dikerjakan', title: 'Dikerjakan', colorClass: 'bg-primary' },
  { id: 'Menunggu Pemohon', title: 'Menunggu Pemohon', colorClass: 'bg-warning' },
  { id: 'Selesai', title: 'Selesai / Ditutup / Dialihkan', colorClass: 'bg-success' },
];

const filteredTickets = computed(() => {
  return props.tickets.filter(t => {
    const q = searchQuery.value.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(q)
      || t.title.toLowerCase().includes(q)
      || t.requestedByName.toLowerCase().includes(q)
      || (t.requested_by_company || '').toLowerCase().includes(q)
      || (t.requested_by_division || '').toLowerCase().includes(q)
      || (t.requestedByDept || '').toLowerCase().includes(q);
    const matchStatus = matchesStatusFilter(t, statusFilter.value);
    const matchPriority = priorityFilter.value === 'ALL' || t.p_level === priorityFilter.value;
    const matchUrgency = urgencyFilter.value === 'ALL' || t.urgency === urgencyFilter.value;
    const matchImpact = impactFilter.value === 'ALL' || t.impact === impactFilter.value;
    return matchSearch && matchStatus && matchPriority && matchUrgency && matchImpact;
  });
});

const getTicketsByStatus = (phase: string) => filteredTickets.value.filter(t => t.status_phase === phase);

// Drag & drop antar fase: bebas maju/mundur, server yang menjaga syarat dan mencatat log FASE_DIPINDAHKAN.
const { showError } = useModal();
const { toast } = useToast();
const draggedTicketId = ref<string | null>(null);
const draggedOverCol = ref<string | null>(null);

const handleDragStart = (e: DragEvent, ticketId: string) => {
  draggedTicketId.value = ticketId;
  e.dataTransfer?.setData('text/plain', ticketId);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
};
const handleDragEnd = () => {
  draggedTicketId.value = null;
  draggedOverCol.value = null;
};
const handleDrop = async (e: DragEvent, phase: string) => {
  e.preventDefault();
  const ticketId = e.dataTransfer?.getData('text/plain') || draggedTicketId.value;
  handleDragEnd();
  const ticket = props.tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.status_phase === phase) return;
  try {
    await apiFetch(`/api/tickets/${ticket.id}/move-phase`, { method: 'POST', body: { to: phase } });
    await appStore.refreshTicket(ticket.id);
    toast(`Tiket dipindahkan ke ${phase}.`, 'success');
  } catch (err: any) {
    showError('Gagal Memindahkan Tiket', err?.data?.statusMessage || err?.message || 'Terjadi kesalahan.');
  }
};
</script>
