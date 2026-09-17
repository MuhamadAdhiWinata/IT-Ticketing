<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs space-y-2">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Laporan & Ekspor Data</h2>
      <p class="text-xs text-gray-500">Ekspor laporan rekapitulasi tiket dan performa SLA ke Excel/CSV/PDF.</p>
    </div>
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center text-xs text-gray-400">
      Reports View siap digunakan.
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ticket } from '~/types';
defineProps<{ tickets: Ticket[] }>();
</script>
