<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isSlowConnection = ref(false)

onMounted(() => {
  // Graceful degradation: Jika loading > 4 detik
  setTimeout(() => {
    isSlowConnection.value = true
  }, 4000)
})
</script>

<template>
  <!-- 
    Menggunakan token: var(--color-background), var(--font-sans), dan var(--z-modal)
    Ini memastikan font dan warna latar otomatis menyesuaikan light/dark mode.
  -->
  <div 
    class="fixed inset-0 flex flex-col items-center justify-center min-h-screen m-0 p-0 antialiased selection:bg-transparent"
    style="background-color: var(--color-background); z-index: var(--z-modal); font-family: var(--font-sans);"
  >
    <div class="flex flex-col items-center gap-5">
      
      <!-- Progress Bar Elastis -->
      <div 
        class="w-40 h-[3px] overflow-hidden relative rounded-full" 
        style="background-color: var(--color-border);"
      >
        <div 
          class="absolute top-0 left-0 h-full w-full rounded-full progress-shimmer will-change-transform" 
          style="background-color: var(--color-primary);"
        />
      </div>

      <!-- Typography Area -->
      <div class="h-5 flex items-center justify-center overflow-hidden">
        <Transition name="slide-up" mode="out-in">
          <span 
            v-if="!isSlowConnection" 
            class="text-[11px] font-bold uppercase tracking-[0.25em]"
            style="color: var(--color-muted-foreground);"
          >
            Menyiapkan Workspace
          </span>
          <span 
            v-else 
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            style="color: var(--color-foreground);"
          >
            Memuat aset tambahan...
          </span>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 
  Animasi progress bar elastis (Premium Feel).
  Menggunakan transform translateX dan scaleX yang ringan di GPU (60fps).
*/
.progress-shimmer {
  transform-origin: left;
  animation: shimmer 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) scaleX(0.2);
  }
  50% {
    transform: translateX(0) scaleX(0.5);
  }
  100% {
    transform: translateX(100%) scaleX(0.2);
  }
}

/* Transisi Vue untuk pergantian teks yang mulus (Anti-Slop Layout Shift) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>