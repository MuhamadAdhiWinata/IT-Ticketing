<template>
  <div
    :class="[
      'bg-[var(--login-card-bg)] backdrop-blur-sm rounded-2xl border-[var(--login-card-border)] login-floating-card p-4 w-56',
      'login-anim-float',
    ]"
    :style="{ animationDelay: delay }"
  >
    <div class="flex items-center gap-2.5 mb-2">
      <div
        :class="[
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          iconBgClass,
        ]"
      >
        <component :is="icon" class="w-4 h-4" :class="iconColorClass" />
      </div>
      <span class="text-[11px] font-bold text-foreground truncate">{{ title }}</span>
    </div>
    <p class="text-[11px] text-muted-foreground leading-snug">{{ subtitle }}</p>
    <div v-if="badge" class="mt-2.5 flex items-center gap-1.5">
      <span :class="['w-1.5 h-1.5 rounded-full', badgeDotClass]" />
      <span :class="['text-[10px] font-bold', badgeTextClass]">{{ badge }}</span>
    </div>
    <div v-if="value" class="mt-2">
      <span class="text-sm font-bold text-foreground font-mono">{{ value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = withDefaults(
  defineProps<{
    icon: Component;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: 'primary' | 'success' | 'warning';
    value?: string;
    delay?: string;
  }>(),
  {
    subtitle: '',
    badge: '',
    badgeColor: 'primary',
    value: '',
    delay: '0s',
  }
);

const iconBgClass = computed(() => 'bg-primary/10');
const iconColorClass = computed(() => 'text-primary');

const badgeDotClass = computed(() => {
  const map = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
  };
  return map[props.badgeColor];
});

const badgeTextClass = computed(() => {
  const map = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  };
  return map[props.badgeColor];
});
</script>
