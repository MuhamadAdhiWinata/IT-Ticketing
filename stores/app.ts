import { defineStore } from 'pinia';
import type { AppUser, Ticket, CategoryItem, SubcategoryItem, VendorItem, TechnicianItem } from '~/types';

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoaded: false,
    darkMode: false,
    activeTab: 'tracking',
    activeView: 'main' as 'main' | 'create-ticket' | 'ticket-detail',
    selectedTicketId: null as string | null,
    currentUser: null as AppUser | null,
    tickets: [] as Ticket[],
    categories: [] as CategoryItem[],
    subcategories: [] as SubcategoryItem[],
    vendors: [] as VendorItem[],
    technicians: [] as TechnicianItem[],
    allUsers: [] as AppUser[],
    isCreateModalOpen: false,
    selectedTicket: null as Ticket | null,
    isSidebarCollapsed: false,
    isMobileSidebarOpen: false,
    successNotification: null as string | null,
  }),

  actions: {
    setSuccessNotification(msg: string | null) {
      this.successNotification = msg;
      if (msg) {
        setTimeout(() => {
          if (this.successNotification === msg) {
            this.successNotification = null;
          }
        }, 8000);
      }
    },

    async initApp(user: AppUser) {
      this.currentUser = user;

      const [usersRes, ticketsRes, catsRes, subcatsRes, vendorsRes, techsRes, prefsRes] = await Promise.all([
        $fetch<{ success: boolean; data: AppUser[] }>('/api/users').catch(() => null),
        $fetch<{ success: boolean; data: Ticket[] }>('/api/tickets').catch(() => null),
        $fetch<{ success: boolean; data: CategoryItem[] }>('/api/categories').catch(() => null),
        $fetch<{ success: boolean; data: SubcategoryItem[] }>('/api/subcategories').catch(() => null),
        $fetch<{ success: boolean; data: VendorItem[] }>('/api/vendors').catch(() => null),
        $fetch<{ success: boolean; data: TechnicianItem[] }>('/api/technicians').catch(() => null),
        $fetch<{ success: boolean; data: { darkMode: boolean } }>('/api/user/preferences').catch(() => null),
      ]);

      if (usersRes) this.allUsers = usersRes.data;
      if (ticketsRes) this.tickets = ticketsRes.data;
      if (catsRes) this.categories = catsRes.data;
      if (subcatsRes) this.subcategories = subcatsRes.data;
      if (vendorsRes) this.vendors = vendorsRes.data;
      if (techsRes) this.technicians = techsRes.data;
      if (prefsRes) this.darkMode = prefsRes.data.darkMode;

      this.loadStateFromUrl();
      this.isLoaded = true;
    },

    async toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      try {
        await $fetch('/api/user/preferences', {
          method: 'PUT',
          body: { darkMode: this.darkMode },
        });
      } catch (e) {
        console.error('Failed to update dark mode preference:', e);
      }
    },

    setActiveTab(tab: string) {
      this.activeTab = tab;
      this.activeView = 'main';
      this.selectedTicketId = null;
      this.selectedTicket = null;
      this.isMobileSidebarOpen = false;
      this.pushHistoryState();
    },

    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },

    toggleMobileSidebar() {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    },

    closeMobileSidebar() {
      this.isMobileSidebarOpen = false;
    },

    openCreateTicket() {
      this.activeView = 'create-ticket';
      this.pushHistoryState();
    },

    async openTicketDetail(ticketId: string) {
      this.selectedTicketId = ticketId;
      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}`);
        this.selectedTicket = res.data;
        this.activeView = 'ticket-detail';
        this.pushHistoryState();
      } catch (e) {
        console.error(`Failed to fetch ticket ${ticketId}:`, e);
        this.selectedTicket = null;
        this.backToMainView();
      }
    },

    backToMainView() {
      this.activeView = 'main';
      this.selectedTicketId = null;
      this.selectedTicket = null;
      this.pushHistoryState();
    },

    pushHistoryState() {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', this.activeTab);
        url.searchParams.set('view', this.activeView);
        if (this.selectedTicketId) {
          url.searchParams.set('ticketId', this.selectedTicketId);
        } else {
          url.searchParams.delete('ticketId');
        }
        window.history.pushState({ view: this.activeView, tab: this.activeTab, ticketId: this.selectedTicketId }, '', url.toString());
      }
    },

    loadStateFromUrl() {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        const view = urlParams.get('view');
        const ticketId = urlParams.get('ticketId');

        if (tab) this.activeTab = tab;
        if (view) this.activeView = view as 'main' | 'create-ticket' | 'ticket-detail';
        if (ticketId) {
          this.selectedTicketId = ticketId;
        }
      }
    },

    setCreateModalOpen(isOpen: boolean) {
      this.isCreateModalOpen = isOpen;
    },

    setSelectedTicket(ticket: Ticket | null) {
      this.selectedTicket = ticket;
    },

    async addTicket(ticketPayload: Partial<Ticket>, shouldIssue: boolean, behalfUserId?: string | null): Promise<Ticket | null> {
      if (!this.currentUser) return null;

      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>('/api/tickets', {
          method: 'POST',
          body: {
            title: ticketPayload.title,
            category: ticketPayload.category,
            subcategory: ticketPayload.subcategory,
            location: ticketPayload.location,
            priority: ticketPayload.priority,
            description: ticketPayload.description,
            shouldIssue,
            behalfUserId,
          },
        });

        const newTicket = res.data;
        this.tickets = [newTicket, ...this.tickets];
        return newTicket;
      } catch (e) {
        console.error('Failed to create ticket:', e);
        return null;
      }
    },

    async updateTicket(updatedTicket: Ticket) {
      try {
        await $fetch(`/api/tickets/${updatedTicket.id}`, {
          method: 'PUT',
          body: updatedTicket,
        });
        this.tickets = this.tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
        if (this.selectedTicket?.id === updatedTicket.id) {
          this.selectedTicket = updatedTicket;
        }
      } catch (e) {
        console.error('Failed to update ticket:', e);
      }
    },

    async updateTicketStatus(ticketId: string, status: Ticket['status']) {
      try {
        await $fetch(`/api/tickets/${ticketId}/status`, {
          method: 'PATCH',
          body: { status },
        });
        this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, status } : t);
        if (this.selectedTicket?.id === ticketId) {
          this.selectedTicket = { ...this.selectedTicket, status };
        }
      } catch (e) {
        console.error('Failed to update status:', e);
      }
    },

    async updateTicketAssignee(ticketId: string, userId: string) {
      const user = this.allUsers.find(u => u.id === userId);
      try {
        await $fetch(`/api/tickets/${ticketId}/assignee`, {
          method: 'PATCH',
          body: { userId, userName: user?.name },
        });
        this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, assignedTo: userId, assignedToName: user?.name } : t);
        if (this.selectedTicket?.id === ticketId) {
          this.selectedTicket = { ...this.selectedTicket, assignedTo: userId, assignedToName: user?.name };
        }
      } catch (e) {
        console.error('Failed to update assignee:', e);
      }
    },

    async saveWorklogNote(ticketId: string, stageKey: string, notes: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }) {
      if (!this.currentUser) return;
      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/worklogs`, {
          method: 'POST',
          body: { stageKey, description: notes, attachment: filePayload },
        });
        this.tickets = this.tickets.map(t => t.id === res.data.id ? res.data : t);
        if (this.selectedTicket?.id === res.data.id) {
          this.selectedTicket = res.data;
        }
      } catch (e) {
        console.error('Failed to save worklog note:', e);
      }
    },

    async completeStage(ticketId: string, stageKey: string, notes?: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }, targetStatus?: Ticket['status']) {
      if (!this.currentUser) return;

      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/stages/complete`, {
          method: 'POST',
          body: { stageKey, notes, targetStatus, attachment: filePayload },
        });
        this.tickets = this.tickets.map(t => t.id === res.data.id ? res.data : t);
        if (this.selectedTicket?.id === res.data.id) {
          this.selectedTicket = res.data;
        }
      } catch (e) {
        console.error('Failed to complete stage:', e);
      }
    },

    async addCustomWorklog(ticketId: string, wlData: { date: string; start_at: string; finish_at: string; duration_minutes: number; description: string; stageKey: string; worker_id?: string; worker_name?: string }) {
      if (!this.currentUser) return;
      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/worklogs/custom`, {
          method: 'POST',
          body: wlData,
        });
        this.tickets = this.tickets.map(t => t.id === res.data.id ? res.data : t);
        if (this.selectedTicket?.id === res.data.id) {
          this.selectedTicket = res.data;
        }
      } catch (e) {
        console.error('Failed to add custom worklog:', e);
      }
    },

    async addCategory(cat: CategoryItem) {
      try {
        const res = await $fetch<{ success: boolean; data: CategoryItem }>('/api/categories', {
          method: 'POST',
          body: cat,
        });
        this.categories = [...this.categories, res.data];
      } catch (e) {
        console.error('Failed to add category:', e);
      }
    },

    async updateCategory(cat: CategoryItem) {
      try {
        const res = await $fetch<{ success: boolean; data: CategoryItem }>(`/api/categories/${cat.id}`, { method: 'PUT', body: cat });
        this.categories = this.categories.map(c => c.id === cat.id ? res.data : c);
      } catch (e) {
        console.error('Failed to update category:', e);
      }
    },

    async deleteCategory(catId: string) {
      try {
        await $fetch(`/api/categories/${catId}`, { method: 'DELETE' });
        this.categories = this.categories.filter(c => c.id !== catId);
        this.subcategories = this.subcategories.filter(s => s.category_id !== catId);
      } catch (e) {
        console.error('Failed to delete category:', e);
      }
    },

    async addSubcategory(sub: SubcategoryItem) {
      try {
        const res = await $fetch<{ success: boolean; data: SubcategoryItem }>('/api/subcategories', { method: 'POST', body: sub });
        this.subcategories = [...this.subcategories, res.data];
      } catch (e) {
        console.error('Failed to add subcategory:', e);
      }
    },

    async updateSubcategory(sub: SubcategoryItem) {
      try {
        const res = await $fetch<{ success: boolean; data: SubcategoryItem }>(`/api/subcategories/${sub.id}`, { method: 'PUT', body: sub });
        this.subcategories = this.subcategories.map(s => s.id === sub.id ? res.data : s);
      } catch (e) {
        console.error('Failed to update subcategory:', e);
      }
    },

    async deleteSubcategory(subId: string) {
      try {
        await $fetch(`/api/subcategories/${subId}`, { method: 'DELETE' });
        this.subcategories = this.subcategories.filter(s => s.id !== subId);
      } catch (e) {
        console.error('Failed to delete subcategory:', e);
      }
    },

    async addUser(user: AppUser) {
      try {
        const res = await $fetch<{ success: boolean; data: AppUser }>('/api/users', { method: 'POST', body: user });
        this.allUsers = [...this.allUsers, res.data];
      } catch (e) {
        console.error('Failed to add user:', e);
      }
    },

    async refreshTicket(ticketId: string) {
      try {
        const res = await $fetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}`);
        this.tickets = this.tickets.map(t => t.id === res.data.id ? res.data : t);
        if (this.selectedTicket?.id === res.data.id) {
          this.selectedTicket = res.data;
        }
      } catch (e) {
        console.error(`Failed to refresh ticket ${ticketId}:`, e);
      }
    }
  }
});
