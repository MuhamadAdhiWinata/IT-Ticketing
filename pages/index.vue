<template>
  <div v-if="store.isLoaded && store.currentUser" class="space-y-6">
    <!-- Active Views: State/View Based -->
    <CreateTicketView v-if="store.activeView === 'create-ticket'" />
    <TicketDetailView v-else-if="store.activeView === 'ticket-detail'" />

    <!-- Main Navigation Views -->
    <template v-else>
      <TrackingView
        v-if="store.activeTab === 'tracking'"
        :tickets="store.tickets"
        :currentUser="store.currentUser"
        :onSelectTicket="(ticket) => store.openTicketDetail(ticket.id)"
        :onCreateTicketClick="() => store.openCreateTicket()"
      />

      <ITDashboard
        v-else-if="store.activeTab === 'dashboard'"
        :tickets="store.tickets"
        :currentUser="store.currentUser"
        :onSelectTicket="(ticket) => store.openTicketDetail(ticket.id)"
        :onTakeTicket="(ticket) => store.updateTicketAssignee(ticket.id, store.currentUser!.id)"
        :onMoveStatus="store.updateTicketStatus"
      />

      <MyWorkView
        v-else-if="store.activeTab === 'my-work'"
        :tickets="store.tickets"
        :currentUser="store.currentUser"
        :onSelectTicket="(ticket) => store.openTicketDetail(ticket.id)"
      />

      <DailyWorkView v-else-if="store.activeTab === 'daily-work'" />

      <ReportsView
        v-else-if="store.activeTab === 'reports'"
        :tickets="store.tickets"
      />

      <AdminMasterView
        v-else-if="store.activeTab === 'admin'"
        :allUsers="store.allUsers"
      />

      <SettingsView v-else-if="store.activeTab === 'settings'" />
    </template>
  </div>

  <!-- Loading: tampil sebelum initApp selesai -->
  <div v-else class="fixed inset-0 bg-white flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
      <p class="text-xs text-gray-500">Memuat data aplikasi...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAppStore } from '~/stores/app';
import { useAuthStore } from '~/stores/auth';
import TrackingView from '~/components/views/TrackingView.vue';
import ITDashboard from '~/components/dashboard/ITDashboard.vue';
import MyWorkView from '~/components/dashboard/MyWorkView.vue';
import DailyWorkView from '~/components/dashboard/DailyWorkView.vue';
import ReportsView from '~/components/views/ReportsView.vue';
import AdminMasterView from '~/components/views/AdminMasterView.vue';
import CreateTicketView from '~/components/views/CreateTicketView.vue';
import TicketDetailView from '~/components/views/TicketDetailView.vue';
import SettingsView from '~/components/views/SettingsView.vue';

const store = useAppStore();
const authStore = useAuthStore();

// Company settings sudah di-load di app.vue SEBELUM page ini render
// Hanya perlu check auth + init app data
onMounted(async () => {
  await authStore.restoreSession();

  if (!authStore.isAuthenticated) {
    navigateTo('/login');
    return;
  }

  await store.initApp();

  // Deep-link: if URL has ticketId, fetch ticket detail from API
  if (store.activeView === 'ticket-detail' && store.selectedTicketId && !store.selectedTicket) {
    await store.openTicketDetail(store.selectedTicketId);
  }

  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});

const handlePopState = async (event: PopStateEvent) => {
  if (event.state) {
    if (event.state.view) store.activeView = event.state.view;
    if (event.state.tab) store.activeTab = event.state.tab;
    if (event.state.ticketId) {
      store.selectedTicketId = event.state.ticketId;
      if (!store.selectedTicket || store.selectedTicket.id !== event.state.ticketId) {
        await store.openTicketDetail(event.state.ticketId);
      }
    }
  } else {
    store.activeView = 'main';
  }
};
</script>
