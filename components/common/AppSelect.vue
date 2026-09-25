<template>
  <div class="relative" ref="dropdownRef">
    <label v-if="label" class="block text-xs font-semibold text-foreground mb-1.5">{{ label }}</label>

    <button
      type="button"
      @click="isOpen = !isOpen"
      :class="[
        'w-full rounded-lg border border-input bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all flex items-center justify-between',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2.5 text-xs',
      ]"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <span class="truncate font-medium">{{ selectedLabel || placeholder || 'Pilih opsi...' }}</span>
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
      <div v-if="isOpen" class="absolute z-dropdown mt-1.5 w-full min-w-[140px] bg-surface rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto custom-scrollbar p-1" role="listbox">
        <div v-if="normalizedOptions.length === 0" class="px-3 py-2.5 text-[11px] text-muted-foreground text-center font-medium">
          Tidak ada data tersedia
        </div>
        <button
          v-for="option in normalizedOptions"
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
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: (string | { value: string; label: string })[];
    label?: string;
    placeholder?: string;
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'md',
  }
);

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const normalizedOptions = computed(() => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    return option;
  });
});

const selectedLabel = computed(() => {
  const found = normalizedOptions.value.find(o => o.value === props.modelValue);
  return found ? found.label : '';
});

const selectOption = (val: string) => {
  emit('update:modelValue', val);
  isOpen.value = false;
};

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
});
</script>
