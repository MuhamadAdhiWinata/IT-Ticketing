<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div v-if="icon" class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <component :is="icon" class="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 class="text-sm font-bold text-foreground mb-1">{{ title }}</h3>
    <p v-if="description" class="text-xs text-muted-foreground max-w-sm mb-4">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>
