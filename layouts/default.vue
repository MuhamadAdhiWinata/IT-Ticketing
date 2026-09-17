<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex">
    <!-- Global Sidebar Component -->
    <Sidebar />

    <!-- Right Side Layout with Navbar & Main Page Content -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '~/components/global/Sidebar.vue';
import Navbar from '~/components/global/Navbar.vue';
import { useAppStore } from '~/stores/app';

const store = useAppStore();
</script>
