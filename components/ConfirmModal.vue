<template>
  <UiModal v-model="state.show" size="sm" :closable="false">
    <div class="flex flex-col items-center text-center space-y-3">
      <div class="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-foreground">{{ state.title }}</h3>
        <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ state.message }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UiButton variant="secondary" class="flex-1" @click="state.onCancel?.()">
          Batal
        </UiButton>
        <UiButton variant="danger" class="flex-1" @click="state.onConfirm?.()">
          Hapus
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import { useConfirmModal } from '~/composables/useConfirmModal';

const { state } = useConfirmModal();
</script>
