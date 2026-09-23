<template>
  <div>
    <!-- Mobile Backdrop Overlay -->
    <div
      v-if="store.isMobileSidebarOpen"
      @click="store.closeMobileSidebar()"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
    />

    <!-- Sidebar Container -->
    <aside
      :class="[
        'bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-screen fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out',
        // Desktop / Tablet width
        store.isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
        // Mobile drawer transform & width
        store.isMobileSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Brand Header -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-3 overflow-hidden">
          <img src="~/assets/image/IO.png" alt="Logo" class="w-9 h-9 object-contain shrink-0" />
          <div v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="min-w-0">
            <span class="font-extrabold text-sm text-gray-900 dark:text-white block truncate">
              Percetakan Integral Offset
            </span>
            <span class="text-[10px] text-gray-500 dark:text-gray-400 block -mt-0.5 truncate">
              Monitoring & Ticketing
            </span>
          </div>
        </div>

        <!-- Mobile Close Button (Hanya di Layar Mobile) -->
        <button
          @click="store.closeMobileSidebar()"
          class="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- User Profile Card -->
      <div
        v-if="store.currentUser"
        :class="[
          'm-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 transition-all shrink-0',
          store.isSidebarCollapsed && !store.isMobileSidebarOpen ? 'p-2 flex justify-center' : 'p-3'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-[#026bb1]/10 text-[#026bb1] dark:text-[#52b5f2] flex items-center justify-center font-bold text-xs shrink-0">
            {{ store.currentUser.name.charAt(0) }}
          </div>
          <div v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="min-w-0 flex-1">
            <p class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ store.currentUser.name }}</p>
            <span class="text-[9px] font-semibold text-[#026bb1] dark:text-[#52b5f2] block truncate">{{ store.currentUser.role }}</span>
          </div>
        </div>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar py-2">
        <button
          v-for="item in filteredNav"
          :key="item.id"
          @click="store.setActiveTab(item.id)"
          :title="store.isSidebarCollapsed && !store.isMobileSidebarOpen ? item.label : ''"
          :class="[
            'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3',
            store.isSidebarCollapsed && !store.isMobileSidebarOpen ? 'px-0 justify-center' : 'px-3.5',
            store.activeTab === item.id
              ? 'bg-[#026bb1] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="truncate">{{ item.label }}</span>
        </button>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Search, Kanban, Briefcase, CalendarDays, FileSpreadsheet, Settings, X } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';

const store = useAppStore();

const navItems = [
  { id: 'tracking', label: 'Tracking', icon: Search, roles: ['USER_NON_IT', 'IT_WORKER', 'SYSTEM_ADMIN'] },
  { id: 'dashboard', label: 'IT Dashboard', icon: Kanban, roles: ['IT_WORKER', 'SYSTEM_ADMIN'] },
  { id: 'my-work', label: 'My Work', icon: Briefcase, roles: ['IT_WORKER', 'SYSTEM_ADMIN'] },
  { id: 'daily-work', label: 'Daily Work', icon: CalendarDays, roles: ['IT_WORKER', 'SYSTEM_ADMIN'] },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet, roles: ['SYSTEM_ADMIN'] },
  { id: 'admin', label: 'Master Data', icon: Settings, roles: ['SYSTEM_ADMIN'] },
];

const filteredNav = computed(() => {
  if (!store.currentUser) return [];
  return navItems.filter(item => item.roles.includes(store.currentUser!.role));
});
</script>
