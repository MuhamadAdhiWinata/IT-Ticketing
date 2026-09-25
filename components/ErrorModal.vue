<template>
  <UiModal v-model="modalState.show" :title="modalState.title" size="sm" :closable="true" @update:model-value="closeModal">
    <div class="flex flex-col items-center text-center space-y-3">
      <div :class="[
        'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
        modalState.type === 'error' ? 'bg-destructive/10 text-destructive' : '',
        modalState.type === 'success' ? 'bg-success/10 text-success' : '',
        modalState.type === 'warning' ? 'bg-warning/10 text-warning' : '',
        modalState.type === 'info' ? 'bg-info/10 text-info' : '',
      ]">
        <CheckCircle2 v-if="modalState.type === 'success'" class="w-6 h-6" />
        <XCircle v-else-if="modalState.type === 'error'" class="w-6 h-6" />
        <AlertTriangle v-else-if="modalState.type === 'warning'" class="w-6 h-6" />
        <Info v-else class="w-6 h-6" />
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{{ modalState.message }}</p>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <UiButton @click="closeModal">
          {{ modalState.type === 'success' ? 'OK' : 'Tutup' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-vue-next';
import { useModal } from '~/composables/useModal';

const { modalState, closeModal } = useModal();
</script>
