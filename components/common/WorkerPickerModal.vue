<template>
  <UiModal :model-value="show" title="Pilih Worker IT" size="md" @update:model-value="(v) => !v && $emit('close')">
    <p class="text-[11px] text-muted-foreground mb-3">Pilih satu atau lebih worker yang akan ditugaskan ke tiket ini.</p>

    <input
      v-model="search"
      type="text"
      placeholder="Cari worker..."
      class="w-full px-3 py-2 rounded-lg border border-input bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
    />

    <div class="max-h-60 overflow-y-auto space-y-1 custom-scrollbar mt-3">
      <button
        v-for="worker in filteredWorkers"
        :key="worker.id"
        @click="toggleWorker(worker.id)"
        :class="[
          'w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors text-left',
          selected.includes(worker.id)
            ? 'bg-primary/5 border border-primary/20'
            : 'border border-border hover:bg-muted'
        ]"
      >
        <div class="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">
          {{ worker.name.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-foreground truncate">{{ worker.name }}</p>
          <p class="text-[10px] text-muted-foreground truncate">{{ worker.department }}</p>
        </div>
        <div
          :class="[
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            selected.includes(worker.id) ? 'bg-primary border-primary' : 'border-border-strong'
          ]"
        >
          <Check v-if="selected.includes(worker.id)" class="w-3 h-3 text-primary-foreground" />
        </div>
      </button>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UiButton variant="secondary" class="flex-1" @click="$emit('close')">
          Batal
        </UiButton>
        <UiButton class="flex-1" @click="$emit('confirm', [...selected])">
          Simpan ({{ selected.length }} worker)
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Check } from 'lucide-vue-next';
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
