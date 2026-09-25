<template>
  <div class="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center min-h-screen m-0 p-4 antialiased overflow-hidden">
    <!-- Logo -->
    <div v-if="loaded" class="animate-subtle-pulse">
      <img
        v-if="settings.logoUrl && !logoError"
        :src="settings.logoUrl"
        :alt="settings.companyName"
        class="w-44 md:w-56 h-auto object-contain mb-12 pointer-events-none select-none"
        @error="logoError = true"
      />
      <img
        v-else
        src="/images/IO.png"
        :alt="settings.companyName"
        class="w-44 md:w-56 h-auto object-contain mb-12 pointer-events-none select-none"
      />
    </div>
    <div v-else class="w-44 md:w-56 h-32" />

    <!-- Loading indicator -->
    <div class="flex flex-col items-center gap-4 w-full">
      <span class="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-[0.25em] animate-text-fade">
        Memuat...
      </span>
      <div class="w-32 h-[2px] bg-gray-100 overflow-hidden relative rounded-full">
        <div class="absolute top-0 left-0 h-full w-full bg-gray-800 rounded-full animate-progress" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCompany } from '~/composables/useCompany';

const { settings, loaded } = useCompany();
const logoError = ref(false);
</script>

<style scoped>
@keyframes subtle-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.04); opacity: 1; }
}
.animate-subtle-pulse {
  animation: subtle-pulse 3s ease-in-out infinite;
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-progress {
  animation: progress-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes text-fade {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.animate-text-fade {
  animation: text-fade 2s ease-in-out infinite;
}
</style>
