<template>
  <div class="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center min-h-screen m-0 p-0 antialiased overflow-hidden">
    <div class="flex flex-col items-center gap-4">
      <span class="text-xs font-medium text-gray-400 uppercase tracking-[0.25em] animate-text-fade" style="font-family: 'Plus Jakarta Sans', sans-serif;">
        Memuat...
      </span>
      <div class="w-24 h-[2px] bg-gray-100 overflow-hidden relative rounded-full">
        <div class="absolute top-0 left-0 h-full w-full bg-gray-800 rounded-full animate-progress" />
      </div>
    </div>
  </div>
</template>

<style scoped>
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
