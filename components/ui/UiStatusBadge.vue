<template>
  <UiBadge :variant="badgeVariant" :dot="dot">
    {{ label }}
  </UiBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TicketStatus, TicketPriority } from '~/types';

const props = defineProps<{
  status?: TicketStatus;
  label?: string;
  priority?: TicketPriority;
  dot?: boolean;
}>();

const label = computed(() => {
  if (props.label) return props.label;
  if (props.status) {
    // Tanpa label turunan server: fase terdekat dari status DB (fase pasti ada di status_label).
    const labels: Record<TicketStatus, string> = { DRAFT: 'Baru', PROCESS: 'Dikerjakan', DELEGASI: 'Dikerjakan', SELESAI: 'Selesai' };
    return labels[props.status];
  }
  if (props.priority) {
    const labels: Record<TicketPriority, string> = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical',
    };
    return labels[props.priority];
  }
  return '';
});

const LABEL_VARIANTS: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'danger'> = {
  Baru: 'default', Diakui: 'default', Ditriase: 'primary', Dikerjakan: 'primary',
  'Menunggu Pemohon': 'warning', Selesai: 'success', Ditutup: 'success', Dialihkan: 'warning',
};

const badgeVariant = computed(() => {
  if (label.value && LABEL_VARIANTS[label.value]) return LABEL_VARIANTS[label.value];
  if (props.status) return 'default';
  if (props.priority) {
    const variants: Record<TicketPriority, 'default' | 'primary' | 'warning' | 'danger'> = {
      LOW: 'default',
      MEDIUM: 'primary',
      HIGH: 'warning',
      CRITICAL: 'danger',
    };
    return variants[props.priority];
  }
  return 'default';
});
</script>
