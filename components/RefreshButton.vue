<template>
  <button
    @click="handleRefresh"
    :disabled="loading"
    class="hidden sm:flex px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold items-center gap-1.5 transition-all"
    title="Refresh Data"
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
