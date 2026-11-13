<template>
  <span class="inline-flex flex-wrap items-center gap-1">
    <UiBadge :variant="variant" size="xs" :title="title">{{ ticket.p_level || ticket.priority }}<template v-if="levelLabel"> · {{ levelLabel }}</template></UiBadge>
    <UiBadge v-if="urgencyLabel" variant="outline" size="xs" title="Urgensi">U: {{ urgencyLabel }}</UiBadge>
    <UiBadge v-if="showImpact && impactLabel" variant="outline" size="xs" title="Dampak">D: {{ impactLabel }}</UiBadge>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Ticket } from '~/types';
import { useAppStore } from '~/stores/app';

// Prioritas tiket sebagai P1-P4 (label dari master) beserta Urgensi dan Dampak hasil triase.
const props = defineProps<{ ticket: Pick<Ticket, 'priority' | 'p_level' | 'urgency' | 'impact'>; showImpact?: boolean }>();
const store = useAppStore();

const VARIANTS: Record<string, 'danger' | 'warning' | 'primary' | 'default'> = { P1: 'danger', P2: 'warning', P3: 'primary', P4: 'default' };
const variant = computed(() => VARIANTS[props.ticket.p_level ?? ''] ?? 'default');
const find = (list: { id: string; label: string }[] | undefined, id?: string | null) => (id ? list?.find(x => x.id === id)?.label ?? id : '');
const levelLabel = computed(() => find(store.triageMaster?.priorities, props.ticket.p_level));
const urgencyLabel = computed(() => find(store.triageMaster?.urgencies, props.ticket.urgency));
const impactLabel = computed(() => find(store.triageMaster?.impacts, props.ticket.impact));
const title = computed(() => store.triageMaster?.priorities.find(p => p.id === props.ticket.p_level)?.description ?? '');
</script>
