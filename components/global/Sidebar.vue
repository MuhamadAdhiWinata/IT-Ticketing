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
          <div v-if="loaded && settings.logoUrl && !logoError" class="w-8 h-8 shrink-0">
            <img :src="settings.logoUrl" :alt="settings.companyName" class="w-8 h-8 object-contain" @error="logoError = true" />
          </div>
          <div v-else class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <!-- Ikut dikunci pada loaded seperti nama di sebelahnya: cache localStorage klien
                 beda dengan default server, dan membacanya saat hydration memicu mismatch. -->
            <span class="text-primary-foreground font-bold text-xs">{{ loaded ? settings.companyName.charAt(0) : '' }}</span>
          </div>
          <div v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="min-w-0">
            <span class="font-bold text-sm text-foreground block truncate">
              {{ loaded ? settings.companyName : '' }}
            </span>
            <span class="text-[10px] text-muted-foreground block -mt-0.5 truncate">
              Monitoring & Ticketing
            </span>
          </div>
        </div>

        <button
          @click="store.closeMobileSidebar()"
          class="md:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
            <span
              v-if="profileOrgLabel"
              class="text-[10px] text-muted-foreground block truncate"
              :title="profileOrgLabel"
            >{{ profileOrgLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 overflow-y-auto custom-scrollbar py-2 space-y-4" role="navigation" aria-label="Menu utama">
        <template v-for="group in navGroups" :key="group.label">
          <!-- Group header (only when expanded) -->
          <p v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 pt-1">
            {{ group.label }}
          </p>

          <!-- Group items -->
          <div class="space-y-0.5">
            <button
              v-for="item in group.items"
              :key="item.id"
              @click="store.setActiveTab(item.id)"
              :title="store.isSidebarCollapsed && !store.isMobileSidebarOpen ? item.label : ''"
              :aria-current="store.activeTab === item.id ? 'page' : undefined"
              :class="[
                'w-full min-h-11 md:min-h-0 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-3',
                store.isSidebarCollapsed && !store.isMobileSidebarOpen ? 'px-0 justify-center' : 'px-3',
                store.activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span v-if="!store.isSidebarCollapsed || store.isMobileSidebarOpen" class="truncate">{{ item.label }}</span>
            </button>
          </div>
        </template>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Kanban, Briefcase, CalendarDays, FileSpreadsheet, Settings, SlidersHorizontal, ClipboardList, KeyRound, ShieldCheck, CalendarClock, X } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { useCompany } from '~/composables/useCompany';
import { formatOrgLabel } from '~/utils/identity';

const store = useAppStore();
const { settings, loaded } = useCompany();
const logoError = ref(false);

const profileOrgLabel = computed(() => formatOrgLabel(store.currentUser ?? {}));

// Ikon dipetakan dari nama yang tersimpan di DB; nama tak dikenal memakai ikon bawaan.
const ICONS: Record<string, any> = { Search, Kanban, Briefcase, CalendarDays, FileSpreadsheet, Settings, SlidersHorizontal, ClipboardList, KeyRound, ShieldCheck, CalendarClock };

const navGroups = computed(() => {
  const groups: { label: string; items: { id: string; label: string; icon: any }[] }[] = [];
  for (const m of store.navMenus) {
    let g = groups.find(x => x.label === m.section);
    if (!g) groups.push(g = { label: m.section, items: [] });
    g.items.push({ id: m.id, label: m.label, icon: ICONS[m.icon] ?? Settings });
  }
  return groups;
});
</script>
