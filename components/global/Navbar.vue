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
      <!-- Quick Role Switcher Dropdown -->
      <div class="relative">
        <button
          @click="isUserMenuOpen = !isUserMenuOpen"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
          title="Ganti Persona Pengguna / Role"
        >
          <img
            v-if="store.currentUser?.avatarUrl"
            :src="store.currentUser.avatarUrl"
            :alt="store.currentUser.name"
            class="w-6 h-6 rounded-full object-cover ring-1 ring-[#026bb1]"
            referrerpolicy="no-referrer"
          />
          <div v-else class="w-6 h-6 rounded-full bg-[#026bb1] text-white flex items-center justify-center font-bold text-[10px]">
            {{ store.currentUser?.name.charAt(0) }}
          </div>
          <div class="hidden sm:block text-left">
            <span class="text-xs font-bold text-gray-800 dark:text-gray-200 block leading-tight">
              {{ store.currentUser?.name.split(' ')[0] }}
            </span>
            <span class="text-[9px] font-mono uppercase text-gray-400 block leading-none">
              {{ store.currentUser?.role.replace('_', ' ') }}
            </span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl py-2 z-50 space-y-1"
        >
          <div class="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Simulasi Akun Pengguna:</span>
            <p class="text-[11px] text-gray-500">Pilih persona untuk menguji hak akses role:</p>
          </div>

          <div class="max-h-60 overflow-y-auto custom-scrollbar p-1">
            <button
              v-for="user in store.allUsers"
              :key="user.id"
              @click="selectUser(user.id)"
              class="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors"
              :class="store.currentUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-950/40 text-[#026bb1] font-bold' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'"
            >
              <div class="min-w-0 pr-2">
                <span class="block font-semibold truncate">{{ user.name }}</span>
                <span class="block text-[10px] text-gray-400 truncate">{{ user.department }}</span>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 font-mono" :class="user.role === 'IT_LEAD' ? 'bg-purple-100 text-purple-700' : user.role === 'IT_WORKER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'">
                {{ user.role.split('_')[0] }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <button
        @click="store.setCreateModalOpen(true)"
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
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PlusCircle, Sun, Moon, Menu, ChevronDown } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';

const store = useAppStore();
const isUserMenuOpen = ref(false);

const selectUser = (userId: string) => {
  store.switchUser(userId);
  isUserMenuOpen.value = false;
};

const toggleSidebarAction = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    store.toggleMobileSidebar();
  } else {
    store.toggleSidebar();
  }
};
</script>
