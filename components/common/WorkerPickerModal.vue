<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" @click="$emit('close')" />
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-extrabold text-gray-900 dark:text-white">Pilih Worker IT</h3>
          <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-[11px] text-gray-500 dark:text-gray-400">Pilih satu atau lebih worker yang akan ditugaskan ke tiket ini.</p>

        <!-- Search -->
        <input
          v-model="search"
          type="text"
          placeholder="Cari worker..."
          class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50"
        />

        <!-- Worker List -->
        <div class="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
          <div
            v-for="worker in filteredWorkers"
            :key="worker.id"
            @click="toggleWorker(worker.id)"
            class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            :class="selected.includes(worker.id)
              ? 'bg-[#e6f1f8] dark:bg-[#026bb1]/20 border border-[#026bb1]/30'
              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'"
          >
            <div class="w-8 h-8 rounded-full bg-[#026bb1] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              {{ worker.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ worker.name }}</p>
              <p class="text-[10px] text-gray-500 truncate">{{ worker.department }}</p>
            </div>
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selected.includes(worker.id)
                ? 'bg-[#026bb1] border-[#026bb1]'
                : 'border-gray-300 dark:border-slate-600'">
              <Check v-if="selected.includes(worker.id)" class="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="$emit('close')" class="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors">
            Batal
          </button>
          <button
            @click="$emit('confirm', [...selected])"
            class="flex-1 px-4 py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Simpan ({{ selected.length }} worker)
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Check } from 'lucide-vue-next';
import type { AppUser } from '~/types';

const props = defineProps<{
  show: boolean;
  users: AppUser[];
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', userIds: string[]): void;
}>();

const search = ref('');
const selected = ref<string[]>([]);

const filteredWorkers = computed(() => {
  if (!search.value) return props.users.filter(u => u.role === 'IT_WORKER');
  const q = search.value.toLowerCase();
  return props.users.filter(u =>
    u.role === 'IT_WORKER' && (
      u.name.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  );
});

const toggleWorker = (userId: string) => {
  const idx = selected.value.indexOf(userId);
  if (idx >= 0) {
    selected.value.splice(idx, 1);
  } else {
    selected.value.push(userId);
  }
};
</script>
