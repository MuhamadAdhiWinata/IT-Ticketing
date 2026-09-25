<template>
  <div>
    <!-- Mobile Backdrop -->
    <div
      v-if="store.isMobileSidebarOpen"
      @click="store.closeMobileSidebar()"
      class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 md:hidden"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-surface border-r border-border flex flex-col h-screen fixed inset-y-0 left-0 z-50 transition-all duration-300',
        store.isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
        store.isMobileSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Brand -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
        <div class="flex items-center gap-3 overflow-hidden">
          <img src="~/assets/image/IO.png" alt="Logo" class="w-8 h-8 object-contain shrink-0" />
          <div v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="min-w-0">
            <span class="font-bold text-sm text-foreground block truncate">
              Percetakan Integral Offset
            </span>
            <span class="text-[10px] text-muted-foreground block -mt-0.5 truncate">
              Monitoring & Ticketing
            </span>
          </div>
        </div>

        <button
          @click="store.closeMobileSidebar()"
          class="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Tutup sidebar"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- User Card -->
      <div
        v-if="store.currentUser"
        :class="[
          'm-3 rounded-lg border border-border transition-all shrink-0',
          store.isSidebarCollapsed && !store.isMobileSidebarOpen ? 'p-2 flex justify-center' : 'p-3 bg-muted/50'
        ]"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {{ store.currentUser.name.charAt(0) }}
          </div>
          <div v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="min-w-0 flex-1">
            <p class="text-xs font-bold text-foreground truncate">{{ store.currentUser.name }}</p>
            <span class="text-[10px] font-medium text-primary block truncate">{{ store.currentUser.role }}</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar py-2" role="navigation" aria-label="Menu utama">
        <button
          v-for="item in filteredNav"
          :key="item.id"
          @click="store.setActiveTab(item.id)"
          :title="store.isSidebarCollapsed && !store.isMobileSidebarOpen ? item.label : ''"
          :aria-current="store.activeTab === item.id ? 'page' : undefined"
          :class="[
            'w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-3',
            store.isSidebarCollapsed && !store.isMobileSidebarOpen ? 'px-0 justify-center' : 'px-3',
            store.activeTab === item.id
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
