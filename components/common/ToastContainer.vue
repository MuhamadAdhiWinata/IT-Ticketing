<template>
  <div class="fixed top-4 right-4 z-modal flex flex-col gap-2 pointer-events-none">
    <TransitionGroup
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="[
          'pointer-events-auto px-4 py-3 rounded-lg shadow-md border text-xs font-medium flex items-center gap-2.5 max-w-sm',
          t.type === 'success' && 'bg-success-muted border-success/20 text-success',
          t.type === 'error' && 'bg-destructive/5 border-destructive/20 text-destructive',
          t.type === 'info' && 'bg-info-muted border-info/20 text-info',
        ]"
        role="alert"
      >
        <CheckCircle2 v-if="t.type === 'success'" class="w-4 h-4 shrink-0" />
        <XCircle v-else-if="t.type === 'error'" class="w-4 h-4 shrink-0" />
        <Info v-else class="w-4 h-4 shrink-0" />
        <span class="flex-1">{{ t.message }}</span>
        <button @click="dismiss(t.id)" class="ml-1 text-current opacity-40 hover:opacity-100 transition-opacity" aria-label="Tutup notifikasi">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, Info, X } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
const { toasts, dismiss } = useToast();
</script>
