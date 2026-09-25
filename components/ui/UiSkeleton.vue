<template>
  <div :class="['bg-muted rounded-md animate-skeleton', heightClass, widthClass]" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    width?: string;
    height?: string;
  }>(),
  {
    width: 'w-full',
    height: 'h-4',
  }
);

const widthClass = computed(() => props.width);
const heightClass = computed(() => props.height);
</script>
