<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-foreground/40 backdrop-blur-sm" @click="close" />
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            :class="[
              'relative bg-surface border border-border rounded-lg shadow-lg w-full',
              size === 'sm' ? 'max-w-sm' : size === 'md' ? 'max-w-md' : size === 'lg' ? 'max-w-lg' : 'max-w-xl',
            ]"
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="px-5 py-4 border-b border-border">
              <slot name="header">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-foreground">{{ title }}</h3>
                  <button
                    v-if="closable"
                    @click="close"
                    class="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </slot>
            </div>

            <!-- Body -->
            <div class="px-5 py-4">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-5 py-3 border-t border-border bg-muted/30">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closable?: boolean;
  }>(),
  {
    size: 'md',
    closable: true,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const close = () => {
  emit('update:modelValue', false);
};
</script>
