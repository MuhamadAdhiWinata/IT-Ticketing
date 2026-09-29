<template>
  <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Inbox class="w-3.5 h-3.5 text-primary" />
        Aktivitas Tiket Masuk IT
      </h3>
      <button @click="fetchData" class="text-[11px] text-primary hover:underline font-semibold">
        Muat Ulang
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-2">
      <div class="p-2.5 bg-primary/5 border border-primary/15 rounded-lg text-center">
        <span class="text-[10px] text-primary font-bold block">Hari Ini</span>
        <span class="text-base font-bold text-primary font-mono">{{ summary.today }}</span>
      </div>
      <div class="p-2.5 bg-warning/5 border border-warning/15 rounded-lg text-center">
        <span class="text-[10px] text-warning font-bold block">7 Hari</span>
        <span class="text-base font-bold text-warning font-mono">{{ summary.sevenDays }}</span>
      </div>
      <div class="p-2.5 bg-muted border border-border rounded-lg text-center">
        <span class="text-[10px] text-muted-foreground font-bold block">Bulan Ini</span>
        <span class="text-base font-bold text-muted-foreground font-mono">{{ summary.month }}</span>
      </div>
    </div>

    <!-- Period Tabs -->
    <div class="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg">
      <button
        v-for="p in periods"
        :key="p.id"
        @click="changePeriod(p.id)"
        :class="[
          'flex-1 px-2.5 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all text-center',
          period === p.id
            ? 'bg-surface shadow-xs text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
      <Loader2 class="w-3.5 h-3.5 animate-spin" />
      Memuat data...
    </div>

    <!-- Empty -->
    <div v-else-if="log.length === 0" class="text-center py-6">
      <Inbox class="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
      <p class="text-xs text-muted-foreground font-medium">Belum ada tiket masuk pada periode ini.</p>
    </div>

    <!-- Log List -->
    <div v-else class="max-h-72 md:max-h-[480px] overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        <div
          v-for="item in log"
          :key="item.id"
          @click="$emit('selectTicket', item.id)"
          class="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
        >
          <!-- Time -->
          <div class="text-[10px] text-muted-foreground font-mono font-bold shrink-0 pt-0.5 w-10 text-center">
            {{ formatTime(item.created_at) }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-[11px] font-bold text-primary">{{ item.id }}</span>
              <UiStatusBadge :priority="item.priority" size="xs" />
              <UiStatusBadge :status="item.status" size="xs" />
            </div>
            <p class="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {{ item.title }}
            </p>
            <div class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <User class="w-3 h-3 shrink-0" />
              <span class="truncate">{{ item.requestedByName }}</span>
              <template v-if="item.requestedByDept">
                <span>-</span>
                <span class="truncate">{{ item.requestedByDept }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Inbox, Loader2, User } from 'lucide-vue-next';

interface IncomingTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  requestedByName: string;
  requestedByDept: string;
  created_at: string;
}

const emit = defineEmits<{
  selectTicket: [id: string];
}>();

const period = ref<'today' | '7days' | 'month'>('today');
const loading = ref(false);
const summary = ref({ today: 0, sevenDays: 0, month: 0 });
const log = ref<IncomingTicket[]>([]);

const periods = [
  { id: 'today' as const, label: 'Hari Ini' },
  { id: '7days' as const, label: '7 Hari' },
  { id: 'month' as const, label: 'Bulan Ini' },
];

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: { summary: any; period: string; log: IncomingTicket[] } }>(
      `/api/tickets/incoming-log?period=${period.value}`,
      { credentials: 'include' }
    );
    if (res.success) {
      summary.value = res.data.summary;
      log.value = res.data.log;
    }
  } catch {
    summary.value = { today: 0, sevenDays: 0, month: 0 };
    log.value = [];
  } finally {
    loading.value = false;
  }
};

const changePeriod = (p: 'today' | '7days' | 'month') => {
  period.value = p;
};

watch(period, () => fetchData());

onMounted(() => fetchData());
</script>
