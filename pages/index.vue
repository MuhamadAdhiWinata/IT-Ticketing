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
    </template>
  </div>

  <div v-else class="py-12 text-center text-xs font-semibold text-muted-foreground">
    <p v-if="!authStore.isAuthenticated">Mengalihkan ke halaman login...</p>
    <p v-else>Memuat data aplikasi...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
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

const store = useAppStore();
const authStore = useAuthStore();

// Check authentication on mount
onMounted(async () => {
  await authStore.restoreSession();

  if (!authStore.isAuthenticated) {
    navigateTo('/login');
    return;
  }

  await store.initApp();
  window.addEventListener('popstate', handlePopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});

const handlePopState = (event: PopStateEvent) => {
  if (event.state) {
    if (event.state.view) store.activeView = event.state.view;
    if (event.state.tab) store.activeTab = event.state.tab;
    if (event.state.ticketId) {
      store.selectedTicketId = event.state.ticketId;
      store.selectedTicket = store.tickets.find(t => t.id === event.state.ticketId) || null;
    }
  } else {
    store.activeView = 'main';
  }
};
</script>
