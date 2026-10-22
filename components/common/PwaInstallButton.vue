<template>
  <div v-if="!isInstalled" class="login-anim-fade" style="animation-delay: 0.5s">
    <!-- Divider -->
    <div class="flex items-center gap-3 my-4">
      <div class="flex-1 h-px bg-border"></div>
      <span class="text-[11px] font-medium text-muted-foreground">atau</span>
      <div class="flex-1 h-px bg-border"></div>
    </div>

    <!-- Chrome/Edge: native install -->
    <button
      v-if="canInstall"
      type="button"
      @click="install"
      class="w-full py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
    >
      <Download class="w-4 h-4" />
      <span>Install Aplikasi</span>
    </button>

    <!-- iOS Safari: instructions -->
    <button
      v-else-if="isIOS"
      type="button"
      @click="openIOSInstructions"
      class="w-full py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
    >
      <Download class="w-4 h-4" />
      <span>Cara Install Aplikasi</span>
    </button>

    <!-- iOS Instructions Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showIOSInstructions"
          class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          @click="closeIOSInstructions"
        >
          <div
            class="bg-surface rounded-xl border border-border p-6 max-w-sm w-full shadow-lg space-y-4"
            @click.stop
          >
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-foreground">Install Aplikasi</h3>
              <button @click="closeIOSInstructions" class="p-1 text-muted-foreground hover:text-foreground">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div class="flex items-start gap-3">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                <p>Tekan tombol <strong class="text-foreground">Share</strong> di Safari (kotak dengan panah ke atas).</p>
              </div>
              <div class="flex items-start gap-3">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                <p>Pilih <strong class="text-foreground">"Add to Home Screen"</strong>.</p>
              </div>
              <div class="flex items-start gap-3">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
                <p>Tekan <strong class="text-foreground">"Add"</strong>.</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Aplikasi akan muncul di Home Screen perangkat Anda.
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Download, X } from 'lucide-vue-next';
import { usePwaInstall } from '~/composables/usePwaInstall';

const { canInstall, isInstalled, isIOS, showIOSInstructions, install, openIOSInstructions, closeIOSInstructions } = usePwaInstall();
</script>
