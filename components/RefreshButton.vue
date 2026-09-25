<template>
  <button
    @click="handleRefresh"
    :disabled="loading"
    class="w-8 h-8 rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
    title="Refresh Data"
    aria-label="Refresh data"
  >
    <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { useModal } from '~/composables/useModal';

const props = withDefaults(defineProps<{
  mode?: 'tickets' | 'master' | 'all';
}>(), {
  mode: 'all',
});

const emit = defineEmits<{
  (e: 'refreshed'): void;
}>();

const store = useAppStore();
const { showSuccess, showError } = useModal();
const loading = ref(false);

const handleRefresh = async () => {
  loading.value = true;
  try {
    if (props.mode === 'tickets') {
      await store.refetchTickets();
    } else if (props.mode === 'master') {
      await store.refetchMasterData();
    } else {
      await store.refetchAll();
    }
    showSuccess('Berhasil', 'Data berhasil diperbarui.');
    emit('refreshed');
  } catch {
    showError('Gagal', 'Gagal memperbarui data. Silakan coba lagi.');
  } finally {
    loading.value = false;
  }
};
</script>
