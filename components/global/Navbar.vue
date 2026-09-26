<template>
  <header class="bg-surface border-b border-border h-16 sticky top-0 z-sticky flex items-center justify-between px-4 sm:px-6">
    <!-- Left -->
    <div class="flex items-center gap-3">
      <button
        @click="toggleSidebarAction"
        class="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Buka/Tutup Sidebar"
      >
        <Menu class="w-5 h-5" />
      </button>

      <h1 class="text-sm font-bold text-foreground capitalize">
        {{ store.activeTab.replace('-', ' ') }}
      </h1>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-2">
      <RefreshButton mode="all" />

      <UiButton size="sm" @click="store.openCreateTicket()">
        <PlusCircle class="w-4 h-4" />
        <span class="hidden sm:inline">Buat Tiket</span>
      </UiButton>

      <!-- Profile -->
      <div class="relative" ref="profileDropdownRef">
        <button
          @click="isProfileOpen = !isProfileOpen"
          class="flex items-center gap-1.5 px-1.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
          aria-haspopup="true"
          :aria-expanded="isProfileOpen"
        >
          <img
            v-if="authStore.user?.avatarUrl"
            :src="authStore.user.avatarUrl"
            :alt="authStore.user.name"
            class="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20"
            referrerpolicy="no-referrer"
          />
          <div v-else class="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
            {{ authStore.user?.name.charAt(0) }}
          </div>
          <span class="hidden sm:inline text-xs font-semibold text-foreground max-w-[80px] truncate">
            {{ authStore.user?.name.split(' ')[0] }}
          </span>
          <ChevronDown class="w-3 h-3 text-muted-foreground transition-transform duration-150" :class="{ 'rotate-180': isProfileOpen }" />
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="isProfileOpen" class="absolute right-0 mt-2 w-52 bg-surface rounded-lg border border-border shadow-lg py-1 z-dropdown" role="menu">
            <div class="px-3 py-2 border-b border-border">
              <p class="text-xs font-bold text-foreground">{{ authStore.user?.name }}</p>
              <p class="text-[10px] text-muted-foreground">{{ authStore.user?.role.replace('_', ' ') }}</p>
            </div>
            <button
              @click="store.toggleDarkMode"
              class="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
              role="menuitem"
            >
              <Sun v-if="store.darkMode" class="w-4 h-4 text-warning" />
              <Moon v-else class="w-4 h-4" />
              <span>{{ store.darkMode ? 'Mode Terang' : 'Mode Gelap' }}</span>
            </button>
            <button
              @click="handleLogout"
              class="w-full text-left px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 flex items-center gap-2 transition-colors"
              role="menuitem"
            >
              <LogOut class="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </Transition>
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
  const ok = await confirm('Keluar', 'Yakin ingin keluar dari sistem?', 'Keluar');
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
