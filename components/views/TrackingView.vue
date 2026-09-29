<template>
  <div class="mx-auto space-y-6 px-2 sm:px-0">
    <!-- Header Banner -->
    <div class="bg-primary text-primary-foreground rounded-lg p-5 sm:p-8 relative overflow-hidden">
      <div class="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div class="relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 text-[11px] sm:text-xs font-semibold border border-white/15">
            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <img :src="settings.logoUrl || '/images/IO.png'" alt="Logo" class="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            </div>
            <span class="truncate">Tracking Tiket IT {{ settings.companyName }}</span>
          </div>
          <UiButton
            v-if="onCreateTicketClick"
            variant="secondary"
            size="sm"
            class="sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
            @click="onCreateTicketClick"
          >
            <PlusCircle class="w-4 h-4" /> Buat Tiket Baru
          </UiButton>
        </div>

        <div class="space-y-1">
          <h1 class="text-lg sm:text-2xl font-bold tracking-tight">Cek Status & Progress Pengerjaan Tiket</h1>
          <p class="text-xs sm:text-sm text-primary-foreground/70 max-w-2xl">
            Ketik kode tiket, judul, atau nama pembuat untuk melihat status terkini secara real-time.
          </p>
        </div>

        <!-- Search Autocomplete -->
        <div class="pt-2">
          <div class="relative max-w-xl" ref="searchContainerRef">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Cari kode, judul, atau nama pembuat..."
              class="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-foreground placeholder-muted-foreground font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/40 shadow-md"
              @focus="onFocus"
              @keydown="onKeydown"
              autocomplete="off"
              role="combobox"
              :aria-expanded="showDropdown"
              aria-autocomplete="list"
            />
            <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="w-4 h-4" />
            </button>

            <!-- Dropdown (Teleport to body to escape overflow-hidden banner) -->
            <Teleport to="body">
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95 translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 translate-y-1"
              >
                <div
                  v-if="showDropdown && dropdownPos"
                  class="fixed z-[9999] bg-surface rounded-lg shadow-lg border border-border max-h-80 overflow-y-auto"
                  :style="{ top: dropdownPos.top + 'px', left: dropdownPos.left + 'px', width: dropdownPos.width + 'px' }"
                  role="listbox"
                >
                  <!-- Loading -->
                  <div v-if="isSearching" class="px-4 py-3 text-xs text-muted-foreground text-center font-medium flex items-center justify-center gap-2">
                    <Loader2 class="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari tiket...</span>
                  </div>

                  <!-- Results -->
                  <template v-else-if="suggestions.length > 0">
                    <button
                      v-for="(s, idx) in suggestions"
                      :key="s.id"
                      :ref="(el: any) => { if (el) suggestionRefs[idx] = el as HTMLElement }"
                      @click="selectSuggestion(s)"
                      @mouseenter="highlightedIndex = idx"
                      :class="[
                        'w-full px-4 py-3 text-left border-b border-border last:border-0 transition-colors',
                        highlightedIndex === idx ? 'bg-primary/5' : 'hover:bg-muted/50'
                      ]"
                      role="option"
                      :aria-selected="highlightedIndex === idx"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-mono text-xs font-bold text-primary">{{ s.id }}</span>
                        <UiStatusBadge :priority="s.priority" size="xs" />
                      </div>
                      <p class="text-xs font-semibold text-foreground mt-1 line-clamp-1">{{ s.title }}</p>
                      <div class="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span class="flex items-center gap-1">
                          <User class="w-3 h-3" />
                          {{ s.requestedByName }}
                        </span>
                        <span>•</span>
                        <UiStatusBadge :status="s.status" size="xs" />
                      </div>
                    </button>
                  </template>

                  <!-- Empty -->
                  <div v-else class="px-4 py-5 text-center space-y-1">
                    <p class="text-xs text-muted-foreground font-medium">Tidak ditemukan tiket yang cocok.</p>
                    <p class="text-[11px] text-muted-foreground/70">Coba cari berdasarkan kode tiket, judul, atau nama pembuat.</p>
                  </div>
                </div>
              </Transition>
            </Teleport>
          </div>
        </div>
      </div>
    </div>

    <!-- Incoming Log (shown when no ticket active) -->
    <TicketIncomingLog v-if="!activeTicket" @selectTicket="handleIncomingSelect" />

    <!-- Found Ticket (direct navigation or selected from autocomplete) -->
    <div v-if="activeTicket" class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div class="min-w-0 space-y-1.5">
          <button
            @click="backToTracking"
            class="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold mb-1"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            Kembali ke Tracking
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
              {{ activeTicket.id }}
            </span>
            <UiStatusBadge :status="activeTicket.status" />
          </div>
          <h2 class="text-base sm:text-lg font-bold text-foreground break-words">{{ activeTicket.title }}</h2>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><MapPin class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.location }}</span>
            <span class="flex items-center gap-1"><User class="w-3.5 h-3.5 shrink-0" /> {{ activeTicket.requestedByName }} ({{ activeTicket.requestedByDept }})</span>
            <span v-if="activeTicket.created_by_admin_name && activeTicket.created_by_admin_id !== activeTicket.requestedBy" class="flex items-center gap-1 text-warning">
              <Shield class="w-3.5 h-3.5 shrink-0" />
              Dibuat oleh Admin: {{ activeTicket.created_by_admin_name }}
            </span>
          </div>
        </div>

        <UiButton size="sm" class="shrink-0 sm:w-auto w-full" @click="onSelectTicket(activeTicket)">
          <span>Detail Lengkap</span>
          <ExternalLink class="w-4 h-4" />
        </UiButton>
      </div>

      <!-- Description -->
      <div class="bg-muted/50 p-3 rounded-lg border border-border text-xs text-foreground/80">
        <strong class="text-foreground block mb-1">Deskripsi Permasalahan:</strong>
        {{ activeTicket.description }}
      </div>

      <!-- Timeline -->
      <div class="space-y-3">
        <h3 class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Riwayat Status Pelacakan</h3>

        <div class="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          <div v-for="(log, idx) in activeTicket.audit_logs" :key="idx" class="relative">
            <div class="absolute -left-6 top-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <div class="bg-muted/30 p-3 rounded-lg border border-border">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-foreground">{{ log.action }}</span>
                <span class="text-[10px] text-muted-foreground">{{ new Date(log.performed_at).toLocaleString() }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">Oleh: {{ log.performed_by_name }}</p>
              <p v-if="log.notes" class="text-xs text-muted-foreground italic mt-0.5">"{{ log.notes }}"</p>
              <p v-for="wl in matchingWorklogs(log.action)" :key="wl.id" class="text-xs text-muted-foreground italic mt-0.5">"{{ wl.description }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found (only when query entered but no match from direct URL) -->
    <div v-else-if="searchQuery.trim() && !isSearching && !showDropdown && directSearchFailed" class="bg-surface rounded-lg border border-border p-8 text-center space-y-3">
      <div class="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertTriangle class="w-6 h-6" />
      </div>
      <h3 class="text-sm font-bold text-foreground">Tiket "{{ searchQuery }}" Tidak Ditemukan</h3>
      <p class="text-xs text-muted-foreground max-w-md mx-auto">
        Periksa kembali kode tiket atau coba cari berdasarkan judul / nama pembuat.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  Search, ExternalLink, MapPin, User,
  PlusCircle, AlertTriangle, Shield, X, Loader2, ArrowLeft
} from 'lucide-vue-next';
import type { AppUser, Ticket } from '~/types';
import { useCompany } from '~/composables/useCompany';
import { debounce } from '~/utils/debounce';
import TicketIncomingLog from '~/components/common/TicketIncomingLog.vue';

const { settings } = useCompany();

const props = defineProps<{
  tickets: Ticket[];
  currentUser?: AppUser;
  onSelectTicket: (ticket: Ticket) => void;
  onQuickTrackId?: string | null;
  onCreateTicketClick?: () => void;
}>();

const searchQuery = ref(props.onQuickTrackId || '');
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchContainerRef = ref<HTMLElement | null>(null);
const showDropdown = ref(false);
const isSearching = ref(false);
const suggestions = ref<any[]>([]);
const highlightedIndex = ref(-1);
const suggestionRefs = ref<HTMLElement[]>([]);
const directSearchFailed = ref(false);
const dropdownPos = ref<{ top: number; left: number; width: number } | null>(null);
let abortController: AbortController | null = null;

// Direct URL ticket lookup
const activeTicket = computed(() => {
  if (props.onQuickTrackId && !searchQuery.value) return null;
  return props.tickets.find(t => t.id.toLowerCase() === searchQuery.value.trim().toLowerCase());
});

const updateDropdownPos = () => {
  if (searchInputRef.value) {
    const rect = searchInputRef.value.getBoundingClientRect();
    dropdownPos.value = {
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    };
  }
};

const fetchSuggestions = debounce(async (q: string) => {
  if (abortController) abortController.abort();
  abortController = new AbortController();

  updateDropdownPos();
  isSearching.value = true;
  showDropdown.value = true;
  highlightedIndex.value = -1;

  try {
    const params = new URLSearchParams({ q, limit: '8' });
    const res = await $fetch<{ success: boolean; data: any[] }>(`/api/tickets/search?${params}`, {
      credentials: 'include',
      signal: abortController.signal,
    });
    suggestions.value = res.success ? res.data : [];
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      suggestions.value = [];
    }
  } finally {
    isSearching.value = false;
  }
}, 250);

watch(searchQuery, (val) => {
  directSearchFailed.value = false;
  if (!val.trim()) {
    suggestions.value = [];
    showDropdown.value = false;
    isSearching.value = false;
    return;
  }
  fetchSuggestions(val.trim());
});

const onFocus = () => {
  if (searchQuery.value.trim()) {
    updateDropdownPos();
    showDropdown.value = true;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if (!showDropdown.value) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1);
    scrollToHighlighted();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
    scrollToHighlighted();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
      selectSuggestion(suggestions.value[highlightedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    showDropdown.value = false;
    highlightedIndex.value = -1;
  }
};

const scrollToHighlighted = () => {
  nextTick(() => {
    const el = suggestionRefs.value[highlightedIndex.value];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
};

const selectSuggestion = (s: any) => {
  searchQuery.value = s.id;
  showDropdown.value = false;
  highlightedIndex.value = -1;
};

const clearSearch = () => {
  searchQuery.value = '';
  showDropdown.value = false;
  suggestions.value = [];
  highlightedIndex.value = -1;
  directSearchFailed.value = false;
};

const backToTracking = () => {
  clearSearch();
};

const handleIncomingSelect = (ticketId: string) => {
  searchQuery.value = ticketId;
};

const handleClickOutside = (e: MouseEvent) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', updateDropdownPos, true);
  window.addEventListener('resize', updateDropdownPos);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updateDropdownPos, true);
  window.removeEventListener('resize', updateDropdownPos);
  if (abortController) abortController.abort();
});

const stageMap: Record<string, string> = {
  TAHAP_ASSIGN_SELESAI: 'ASSIGN',
  TAHAP_IN_PROGRESS_SELESAI: 'IN_PROGRESS',
  TAHAP_COMPLETION_SELESAI: 'COMPLETION',
};

const matchingWorklogs = (action: string) => {
  if (!activeTicket.value?.worklogs) return [];
  const stageKey = stageMap[action];
  if (!stageKey) return [];
  return activeTicket.value.worklogs.filter(wl => wl.stageKey === stageKey);
};
</script>
