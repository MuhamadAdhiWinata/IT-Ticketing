<template>
  <Teleport to="body">
    <div v-if="state.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" @click="state.onCancel" />
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div class="flex justify-center">
          <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle class="w-6 h-6" />
          </div>
        </div>
        <div class="text-center space-y-2">
          <h3 class="text-base font-extrabold text-gray-900 dark:text-white">{{ state.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ state.message }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="state.onCancel" class="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors">
            Batal
          </button>
          <button @click="state.onConfirm" class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors">
            Hapus
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import { useConfirmModal } from '~/composables/useConfirmModal';

const { state } = useConfirmModal();
</script>
