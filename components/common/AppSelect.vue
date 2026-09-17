<template>
  <div class="relative" ref="dropdownRef">
    <label v-if="label" class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{{ label }}</label>
    
    <!-- Trigger Button -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium flex items-center justify-between shadow-xs"
    >
      <span class="truncate">{{ selectedLabel || placeholder || 'Pilih opsi...' }}</span>
      <ChevronDown :class="['w-4 h-4 text-gray-500 transition-transform duration-200', isOpen ? 'rotate-180' : '']" />
    </button>

    <!-- Dropdown Menu / Popover -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="isOpen" class="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar p-1">
        <div
          v-for="option in normalizedOptions"
          :key="option.value"
          @click="selectOption(option.value)"
          :class="[
            'px-3.5 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between',
            modelValue === option.value
              ? 'bg-[#026bb1]/10 text-[#026bb1] dark:bg-[#52b5f2]/15 dark:text-[#52b5f2] font-bold'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
          ]"
        >
          <span class="truncate">{{ option.label }}</span>
          <Check v-if="modelValue === option.value" class="w-3.5 h-3.5 text-[#026bb1] dark:text-[#52b5f2]" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  options: (string | { value: string; label: string })[];
  label?: string;
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const normalizedOptions = computed(() => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    } else {
      return option;
    }
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
