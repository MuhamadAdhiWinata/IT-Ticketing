<template>
  <header class="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
    <!-- Left: Menu & Sidebar Toggle & Title -->
    <div class="flex items-center gap-3">
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
    <div class="flex items-center gap-2.5">
      <!-- User Info Badge -->
      <div class="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800">
        <img
          v-if="authStore.user?.avatarUrl"
          :src="authStore.user.avatarUrl"
          :alt="authStore.user.name"
          class="w-6 h-6 rounded-full object-cover ring-1 ring-[#026bb1]"
          referrerpolicy="no-referrer"
        />
        <div v-else class="w-6 h-6 rounded-full bg-[#026bb1] text-white flex items-center justify-center font-bold text-[10px]">
          {{ authStore.user?.name.charAt(0) }}
        </div>
        <div class="text-left">
          <span class="text-xs font-bold text-gray-800 dark:text-gray-200 block leading-tight">
            {{ authStore.user?.name.split(' ')[0] }}
          </span>
          <span class="text-[9px] font-mono uppercase text-gray-400 block leading-none">
            {{ authStore.user?.role.replace('_', ' ') }}
          </span>
        </div>
      </div>

      <!-- Refresh Button -->
      <RefreshButton />

      <button
        @click="store.openCreateTicket()"
        class="px-3 py-1.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
      >
        <PlusCircle class="w-4 h-4" />
        <span class="hidden sm:inline">Buat Tiket</span>
      </button>

      <button
        @click="store.toggleDarkMode"
        class="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        title="Toggle Tema Gelap/Terang"
      >
        <Sun v-if="store.darkMode" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>

      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors"
        title="Keluar"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { PlusCircle, Sun, Moon, Menu, LogOut } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { useAuthStore } from '~/stores/auth';

const store = useAppStore();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  store.isLoaded = false;
  await navigateTo('/login');
};

const toggleSidebarAction = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    store.toggleMobileSidebar();
  } else {
    store.toggleSidebar();
  }
};
</script>
