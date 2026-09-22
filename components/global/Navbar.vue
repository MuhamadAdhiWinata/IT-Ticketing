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
    <div class="flex items-center gap-2">
      <!-- Refresh Button (visible on all sizes) -->
      <RefreshButton mode="all" />

      <!-- Create Ticket -->
      <button
        @click="store.openCreateTicket()"
        class="px-3 py-1.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
      >
        <PlusCircle class="w-4 h-4" />
        <span class="hidden sm:inline">Buat Tiket</span>
      </button>

      <!-- Dark Mode Toggle -->
      <button
        @click="store.toggleDarkMode"
        class="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        title="Toggle Tema Gelap/Terang"
      >
        <Sun v-if="store.darkMode" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>

      <!-- Profile Dropdown -->
      <div class="relative" ref="profileDropdownRef">
        <button
          @click="isProfileOpen = !isProfileOpen"
          class="flex items-center gap-1.5 px-1.5 py-1 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          <img
            v-if="authStore.user?.avatarUrl"
            :src="authStore.user.avatarUrl"
            :alt="authStore.user.name"
            class="w-7 h-7 rounded-full object-cover ring-1 ring-[#026bb1]"
            referrerpolicy="no-referrer"
          />
          <div v-else class="w-7 h-7 rounded-full bg-[#026bb1] text-white flex items-center justify-center font-bold text-[10px]">
            {{ authStore.user?.name.charAt(0) }}
          </div>
          <span class="hidden sm:inline text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[80px] truncate">
            {{ authStore.user?.name.split(' ')[0] }}
          </span>
          <ChevronDown class="w-3 h-3 text-gray-400" :class="{ 'rotate-180': isProfileOpen }" />
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl py-2 z-50">
            <!-- User Info -->
            <div class="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
              <p class="text-xs font-bold text-gray-900 dark:text-white">{{ authStore.user?.name }}</p>
              <p class="text-[10px] text-gray-400">{{ authStore.user?.role.replace('_', ' ') }}</p>
            </div>

            <!-- Logout -->
            <button
              @click="handleLogout"
              class="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors"
            >
              <LogOut class="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PlusCircle, Sun, Moon, Menu, LogOut, ChevronDown } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { useAuthStore } from '~/stores/auth';
import { useConfirmModal } from '~/composables/useConfirmModal';

const store = useAppStore();
const authStore = useAuthStore();
const { confirm } = useConfirmModal();

const isProfileOpen = ref(false);
const profileDropdownRef = ref<HTMLElement | null>(null);

const handleLogout = async () => {
  isProfileOpen.value = false;
  const ok = await confirm('Keluar', 'Yakin ingin keluar dari sistem?');
  if (ok) {
    await authStore.logout();
    store.isLoaded = false;
    await navigateTo('/login');
  }
};

const toggleSidebarAction = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    store.toggleMobileSidebar();
  } else {
    store.toggleSidebar();
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target as Node)) {
    isProfileOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
