<template>
  <div class="min-h-screen bg-background text-foreground flex theme-transition">
    <Sidebar />

    <div
      :class="[
        'flex-1 flex flex-col min-w-0 transition-all duration-300',
        store.isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64',
        'pl-0'
      ]"
    >
      <Navbar />

      <main class="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        <slot />
      </main>

      <footer class="py-4 text-center text-[10px] text-muted-foreground font-medium">
        &copy; 2026 IT HO - All Rights Reserved.
      </footer>
    </div>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '~/components/global/Sidebar.vue';
import Navbar from '~/components/global/Navbar.vue';
import ToastContainer from '~/components/common/ToastContainer.vue';
import { useAppStore } from '~/stores/app';

const store = useAppStore();
</script>
