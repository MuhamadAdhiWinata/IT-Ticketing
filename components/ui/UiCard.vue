<template>
  <div :class="['bg-surface border border-border rounded-lg', padding ? 'p-4' : '', $attrs.class]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: boolean;
  }>(),
  {
    padding: true,
  }
);
</script>
