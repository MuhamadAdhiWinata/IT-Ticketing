<template>
  <span :class="['inline-flex items-center gap-1 font-semibold select-none', sizeClasses, variantClasses]">
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full shrink-0', dotColorClass]" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    size?: 'xs' | 'sm' | 'md';
    dot?: boolean;
  }>(),
  {
    variant: 'default',
    size: 'sm',
  }
);

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] rounded',
    sm: 'px-2 py-0.5 text-[11px] rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-md',
  };
  return sizes[props.size];
});

const variantClasses = computed(() => {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-info',
    outline: 'border border-border text-muted-foreground',
  };
  return variants[props.variant];
});

const dotColorClass = computed(() => {
  const colors = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    info: 'bg-info',
    outline: 'bg-muted-foreground',
  };
  return colors[props.variant];
});
</script>
