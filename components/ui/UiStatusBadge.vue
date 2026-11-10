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
    const labels: Record<TicketStatus, string> = {
      DRAFT: 'Draft',
      PROCESS: 'Proses',
      DELEGASI: 'Delegasi',
      SELESAI: 'Selesai',
    };
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
  if (props.label) return LABEL_VARIANTS[props.label] ?? 'default';
  if (props.status) {
    const variants: Record<TicketStatus, 'default' | 'primary' | 'warning' | 'success' | 'danger'> = {
      DRAFT: 'default',
      PROCESS: 'primary',
      DELEGASI: 'warning',
      SELESAI: 'success',
    };
    return variants[props.status];
  }
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
