<template>
  <div class="relative" ref="dropdownRef">
    <label v-if="label" class="block text-xs font-semibold text-foreground mb-1.5">{{ label }}</label>

    <button
      type="button"
      @click="toggleOpen"
      :class="[
        'w-full rounded-lg border border-input bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all flex items-center justify-between',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2.5 text-xs',
      ]"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      :disabled="disabled"
    >
      <span class="truncate font-medium">{{ displayLabel || placeholder || 'Pilih opsi...' }}</span>
      <ChevronDown :class="['text-muted-foreground transition-transform duration-150 shrink-0 ml-1.5', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', isOpen ? 'rotate-180' : '']" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="absolute z-dropdown mt-1.5 w-full min-w-[160px] bg-surface rounded-lg shadow-lg border border-border max-h-60 overflow-hidden flex flex-col" role="listbox">
        <!-- Search input -->
        <div v-if="searchable" class="p-1.5 border-b border-border">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full px-2.5 py-1.5 rounded-md border border-input bg-surface text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            @input="onSearchInput"
          />
        </div>

        <!-- Options list -->
        <div class="overflow-y-auto custom-scrollbar max-h-48 p-1">
          <div v-if="loading" class="px-3 py-2.5 text-[11px] text-muted-foreground text-center font-medium">
            Memuat...
          </div>
          <div v-else-if="displayOptions.length === 0" class="px-3 py-2.5 text-[11px] text-muted-foreground text-center font-medium">
            Tidak ada data tersedia
          </div>
          <button
            v-for="option in displayOptions"
            :key="option.value"
            @click="selectOption(option.value)"
            :class="[
              'w-full rounded-md cursor-pointer transition-colors flex items-center justify-between text-left',
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs',
              modelValue === option.value
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-muted font-medium'
            ]"
            role="option"
            :aria-selected="modelValue === option.value"
          >
            <span class="truncate">{{ option.label }}</span>
            <Check v-if="modelValue === option.value" class="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options?: (string | { value: string; label: string })[];
    label?: string;
    placeholder?: string;
    size?: 'sm' | 'md';
    disabled?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    remote?: boolean;
    searchUrl?: string;
    searchParams?: Record<string, string>;
    formatResult?: (item: any) => { value: string; label: string };
  }>(),
  {
    size: 'md',
    options: () => [],
    searchPlaceholder: 'Cari...',
  }
);

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const remoteOptions = ref<{ value: string; label: string }[]>([]);
const loading = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const normalizedOptions = computed(() => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });
});

const displayOptions = computed(() => {
  if (props.remote) {
    if (searchQuery.value.trim()) {
      return remoteOptions.value;
    }
    return normalizedOptions.value;
  }
  if (!searchQuery.value.trim()) return normalizedOptions.value;
  const q = searchQuery.value.toLowerCase();
  return normalizedOptions.value.filter(o =>
    o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  );
});

const displayLabel = computed(() => {
  const all = [...normalizedOptions.value, ...remoteOptions.value];
  const found = all.find(o => o.value === props.modelValue);
  return found ? found.label : '';
});

const toggleOpen = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value && props.searchable) {
    nextTick(() => searchInputRef.value?.focus());
  }
};

const selectOption = (val: string) => {
  emit('update:modelValue', val);
  isOpen.value = false;
  searchQuery.value = '';
};

const fetchRemote = async (search: string) => {
  if (!props.searchUrl) return;
  loading.value = true;
  try {
    const params = new URLSearchParams(props.searchParams || {});
    if (search.trim()) params.set('search', search.trim());
    params.set('limit', '30');

    const res = await $fetch<{ success: boolean; data: any[] }>(`${props.searchUrl}?${params}`, {
      credentials: 'include',
    });

    if (res.success && Array.isArray(res.data)) {
      remoteOptions.value = props.formatResult
        ? res.data.map(props.formatResult)
        : res.data.map((item: any) => ({
            value: item.id || item.value || String(item),
            label: item.name || item.label || item.title || String(item),
          }));
    }
  } catch (e) {
    console.error('Search select fetch error:', e);
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (props.remote) {
      fetchRemote(searchQuery.value);
    }
  }, 300);
};

watch(isOpen, (open) => {
  if (open && props.remote && !searchQuery.value.trim()) {
    fetchRemote('');
  }
});

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>
