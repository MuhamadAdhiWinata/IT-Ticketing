<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs space-y-2">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Lead Dashboard View</h2>
      <p class="text-xs text-gray-500">Monitoring & Analisis Performa Tim IT Lead.</p>
    </div>
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center text-xs text-gray-400">
      Executive Dashboard Lead View siap digunakan.
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ticket } from '~/types';
defineProps<{ tickets: Ticket[] }>();
</script>
