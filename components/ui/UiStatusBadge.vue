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
  priority?: TicketPriority;
  dot?: boolean;
}>();

const label = computed(() => {
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
      LOW: 'Rendah',
      MEDIUM: 'Sedang',
      HIGH: 'Tinggi',
      CRITICAL: 'Kritis',
    };
    return labels[props.priority];
  }
  return '';
});

const badgeVariant = computed(() => {
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
