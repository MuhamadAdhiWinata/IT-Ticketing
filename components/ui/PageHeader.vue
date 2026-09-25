<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div class="space-y-1">
      <h1 class="text-lg font-bold text-foreground">{{ title }}</h1>
      <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
