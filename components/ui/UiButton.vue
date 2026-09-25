<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none',
      'focus-ring',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses,
      variantClasses,
      block ? 'w-full' : '',
    ]"
    @click="$emit('click', $event)"
  >
    <svg v-if="loading" class="animate-spin shrink-0" :class="iconSizeClass" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    to?: string;
    href?: string;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
  }
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink');
  if (props.href) return 'a';
  return 'button';
});

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2.5 py-1 text-[11px] rounded-md',
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-xs rounded-lg',
    lg: 'px-5 py-2.5 text-sm rounded-lg',
  };
  return sizes[props.size];
});

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-xs hover:shadow-sm',
    secondary: 'bg-muted text-foreground border border-border hover:bg-border/50',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-xs',
    success: 'bg-success text-success-foreground hover:opacity-90 shadow-xs',
  };
  return variants[props.variant];
});

const iconSizeClass = computed(() => {
  const sizes = { xs: 'w-3 h-3', sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-4 h-4' };
  return sizes[props.size];
});
</script>
