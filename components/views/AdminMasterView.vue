<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs space-y-2">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Admin Master Data</h2>
      <p class="text-xs text-gray-500">Kelola pengguna, kualifikasi teknisi, vendor eksternal, dan kategori layanan.</p>
    </div>
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center text-xs text-gray-400">
      Master Data Administrator View siap digunakan.
    </div>
  </div>
</template>

<script setup lang="ts">
import { AppUser } from '~/types';
defineProps<{ allUsers: AppUser[] }>();
</script>
