<template>
  <header class="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
    <!-- Left: Menu & Sidebar Toggle & Title -->
    <div class="flex items-center gap-3">
      <!-- Toggle Button: di Desktop/Tablet mengontrol Collapse (icon-only), di Mobile mengontrol Drawer -->
      <button
        @click="toggleSidebarAction"
        class="p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        title="Buka/Tutup Sidebar"
      >
        <Menu class="w-5 h-5" />
      </button>

      <h1 class="text-sm font-bold text-gray-800 dark:text-white capitalize">
        {{ store.activeTab.replace('-', ' ') }}
      </h1>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <button
        @click="store.setCreateModalOpen(true)"
        class="px-3 py-1.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Buat Tiket</span>
      </button>

      <button
        @click="store.toggleDarkMode"
        class="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
      >
        <Sun v-if="store.darkMode" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { PlusCircle, Sun, Moon, Menu } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';

const store = useAppStore();

const toggleSidebarAction = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    store.toggleMobileSidebar();
  } else {
    store.toggleSidebar();
  }
};
</script>
