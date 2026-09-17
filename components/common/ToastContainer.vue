<template>
  <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-8 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-8 scale-95"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="[
          'pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 max-w-sm backdrop-blur-sm',
          t.type === 'success' && 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
          t.type === 'error' && 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
          t.type === 'info' && 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
        ]"
      >
        <span v-if="t.type === 'success'" class="text-base">&#10003;</span>
        <span v-else-if="t.type === 'error'" class="text-base">&#10007;</span>
        <span v-else class="text-base">&#9432;</span>
        <span class="flex-1">{{ t.message }}</span>
        <button @click="dismiss(t.id)" class="ml-2 text-current opacity-50 hover:opacity-100">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';
const { toasts, dismiss } = useToast();
</script>
