<template>
  <Teleport to="body">
    <div v-if="modalState.show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" @click="closeModal" />
      
      <!-- Modal -->
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
        <!-- Close button -->
        <button @click="closeModal" class="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X class="w-5 h-5" />
        </button>

        <!-- Icon -->
        <div class="flex justify-center">
          <div :class="[
            'w-12 h-12 rounded-full flex items-center justify-center',
            modalState.type === 'error' ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400' : '',
            modalState.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : '',
            modalState.type === 'warning' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400' : '',
            modalState.type === 'info' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400' : '',
          ]">
            <CheckCircle2 v-if="modalState.type === 'success'" class="w-6 h-6" />
            <XCircle v-else-if="modalState.type === 'error'" class="w-6 h-6" />
            <AlertTriangle v-else-if="modalState.type === 'warning'" class="w-6 h-6" />
            <Info v-else class="w-6 h-6" />
          </div>
        </div>

        <!-- Content -->
        <div class="text-center space-y-2">
          <h3 class="text-base font-extrabold text-gray-900 dark:text-white">{{ modalState.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{{ modalState.message }}</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-center">
          <button @click="closeModal" class="px-6 py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl transition-colors">
            {{ modalState.type === 'success' ? 'OK' : 'Tutup' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-vue-next';
import { useModal } from '~/composables/useModal';

const { modalState, closeModal } = useModal();
</script>
