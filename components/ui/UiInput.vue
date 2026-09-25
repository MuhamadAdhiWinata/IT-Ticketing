<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="block text-xs font-semibold text-foreground">
      {{ label }}
      <span v-if="required" class="text-destructive ml-0.5">*</span>
    </label>
    <div class="relative">
      <div v-if="$slots.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <slot name="prefix" />
      </div>
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'w-full bg-surface text-foreground border border-input rounded-lg text-xs font-medium',
          'placeholder:text-muted-foreground/60',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          $slots.prefix ? 'pl-9' : 'pl-3',
          $slots.suffix ? 'pr-9' : 'pr-3',
          size === 'sm' ? 'py-1.5' : 'py-2.5',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="hint" class="text-[11px] text-muted-foreground">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    label?: string;
    placeholder?: string;
    type?: string;
    size?: 'sm' | 'md';
    disabled?: boolean;
    required?: boolean;
    hint?: string;
  }>(),
  {
    type: 'text',
    size: 'md',
  }
);

defineEmits<{
  'update:modelValue': [value: string];
}>();

const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 9)}`);
</script>
