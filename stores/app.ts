import { defineStore } from 'pinia';
import type { AppUser, Ticket, CategoryItem, SubcategoryItem, SubmoduleItem, PendingAttachment } from '~/types';
import { useAuthStore } from '~/stores/auth';

function apiFetch<T>(url: string, opts?: any): Promise<T> {
  return $fetch<T>(url, { ...opts, credentials: 'include' });
}

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoaded: false,
    darkMode: false,
    activeTab: 'tracking',
    activeView: 'main' as 'main' | 'create-ticket' | 'ticket-detail',
    selectedTicketId: null as string | null,
    currentUser: null as AppUser | null,
    tickets: [] as Ticket[],
    myTickets: [] as Ticket[],
    myTicketsLoading: false,
    categories: [] as CategoryItem[],
    subcategories: [] as SubcategoryItem[],
    submodules: [] as SubmoduleItem[],
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

    async initApp() {
      const authStore = useAuthStore();
      this.currentUser = authStore.user;

      const [usersRes, ticketsRes, catsRes, subcatsRes, submodsRes, prefsRes] = await Promise.all([
        apiFetch<{ success: boolean; data: AppUser[] }>('/api/users').catch(() => null),
        apiFetch<{ success: boolean; data: Ticket[] }>('/api/tickets').catch(() => null),
        apiFetch<{ success: boolean; data: CategoryItem[] }>('/api/categories').catch(() => null),
        apiFetch<{ success: boolean; data: SubcategoryItem[] }>('/api/subcategories').catch(() => null),
        apiFetch<{ success: boolean; data: SubmoduleItem[] }>('/api/submodules').catch(() => null),
        apiFetch<{ success: boolean; data: { darkMode: boolean } }>('/api/user/preferences').catch(() => null),
      ]);

      if (usersRes) this.allUsers = usersRes.data;
      if (ticketsRes) this.tickets = ticketsRes.data;
      if (catsRes) this.categories = catsRes.data;
      if (subcatsRes) this.subcategories = subcatsRes.data;
      if (submodsRes) this.submodules = submodsRes.data;
      if (prefsRes) {
        this.darkMode = prefsRes.data.darkMode;
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', this.darkMode);
        }
      }

      this.loadStateFromUrl();
      this.isLoaded = true;
    },

    async refetchTickets() {
      try {
        const res = await apiFetch<{ success: boolean; data: Ticket[] }>('/api/tickets');
        this.tickets = res.data;
      } catch (e) {
        console.error('Failed to refetch tickets:', e);
      }
    },

    async fetchMyTickets() {
      this.myTicketsLoading = true;
      try {
        const res = await apiFetch<{ success: boolean; data: Ticket[] }>('/api/tickets/mine');
        this.myTickets = res.data;
      } catch (e) {
        console.error('Failed to fetch my tickets:', e);
      } finally {
        this.myTicketsLoading = false;
      }
    },

    async refetchMasterData() {
      try {
        const [catsRes, subcatsRes, submodsRes, allUsersRes] = await Promise.all([
          apiFetch<{ success: boolean; data: CategoryItem[] }>('/api/categories'),
          apiFetch<{ success: boolean; data: SubcategoryItem[] }>('/api/subcategories'),
          apiFetch<{ success: boolean; data: SubmoduleItem[] }>('/api/submodules'),
          apiFetch<{ success: boolean; data: AppUser[] }>('/api/users'),
        ]);
        this.categories = catsRes.data;
        this.subcategories = subcatsRes.data;
        this.submodules = submodsRes.data;
        this.allUsers = allUsersRes.data;
      } catch (e) {
        console.error('Failed to refetch master data:', e);
      }
    },

    async refetchAll() {
      await Promise.all([this.refetchTickets(), this.refetchMasterData()]);
    },

    async toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', this.darkMode ? '1' : '0');
      }
      try {
        await apiFetch('/api/user/preferences', {
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
        const res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}`);
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
        // Only add query params if not default state
        const isDefault = this.activeTab === 'tracking' && this.activeView === 'main' && !this.selectedTicketId;

        if (isDefault) {
          url.search = '';
        } else {
          url.searchParams.set('tab', this.activeTab);
          url.searchParams.set('view', this.activeView);
          if (this.selectedTicketId) {
            url.searchParams.set('ticketId', this.selectedTicketId);
          }
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

    async addTicket(ticketPayload: Partial<Ticket>, shouldIssue: boolean, behalfUserId?: string | null, attachmentCount?: number): Promise<Ticket | null> {
      if (!this.currentUser) return null;

      try {
        const res = await apiFetch<{ success: boolean; data: Ticket }>('/api/tickets', {
          method: 'POST',
          body: {
            title: ticketPayload.title,
            category: ticketPayload.category,
            aplikasiProject: ticketPayload.aplikasiProject,
            submodule: ticketPayload.submodule,
            location: ticketPayload.location,
            priority: ticketPayload.priority,
            description: ticketPayload.description,
            shouldIssue,
            behalfUserId,
            attachmentCount: attachmentCount ?? 0,
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
        await apiFetch(`/api/tickets/${updatedTicket.id}`, {
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
        await apiFetch(`/api/tickets/${ticketId}/status`, {
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
        await apiFetch(`/api/tickets/${ticketId}/assignee`, {
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

    async saveWorklogNote(ticketId: string, stageKey: string, notes: string, pendingFiles?: PendingAttachment[]) {
      if (!this.currentUser) return;
      try {
        let res: { success: boolean; data: Ticket };

        if (pendingFiles && pendingFiles.length > 0) {
          const fd = new FormData();
          fd.append('stageKey', stageKey);
          fd.append('description', notes);
          for (const pf of pendingFiles) {
            fd.append('files', pf.file);
          }
          res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/worklogs`, {
            method: 'POST',
            body: fd,
          });
        } else {
          res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/worklogs`, {
            method: 'POST',
            body: { stageKey, description: notes },
          });
        }

        this.tickets = this.tickets.map(t => t.id === res.data.id ? res.data : t);
        if (this.selectedTicket?.id === res.data.id) {
          this.selectedTicket = res.data;
        }
      } catch (e) {
        console.error('Failed to save worklog note:', e);
      }
    },

    async completeStage(ticketId: string, stageKey: string, notes?: string, pendingFiles?: PendingAttachment[], targetStatus?: Ticket['status'], delegation?: any) {
      if (!this.currentUser) return;

      try {
        let res: { success: boolean; data: Ticket };

        if (pendingFiles && pendingFiles.length > 0) {
          const fd = new FormData();
          fd.append('stageKey', stageKey);
          if (notes) fd.append('notes', notes);
          if (targetStatus) fd.append('targetStatus', targetStatus);
          if (delegation) fd.append('delegation', JSON.stringify(delegation));
          for (const pf of pendingFiles) {
            fd.append('files', pf.file);
          }
          res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/stages/complete`, {
            method: 'POST',
            body: fd,
          });
        } else {
          res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/stages/complete`, {
            method: 'POST',
            body: { stageKey, notes, targetStatus, delegation },
          });
        }

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
        const res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}/worklogs/custom`, {
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
        const res = await apiFetch<{ success: boolean; data: CategoryItem }>('/api/categories', {
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
        const res = await apiFetch<{ success: boolean; data: CategoryItem }>(`/api/categories/${cat.id}`, { method: 'PUT', body: cat });
        this.categories = this.categories.map(c => c.id === cat.id ? res.data : c);
      } catch (e) {
        console.error('Failed to update category:', e);
      }
    },

    async deleteCategory(catId: string) {
      try {
        await apiFetch(`/api/categories/${catId}`, { method: 'DELETE' });
        this.categories = this.categories.filter(c => c.id !== catId);
        const removedSubIds = this.subcategories.filter(s => s.category_id === catId).map(s => s.id);
        this.subcategories = this.subcategories.filter(s => s.category_id !== catId);
        this.submodules = this.submodules.filter(m => !removedSubIds.includes(m.subcategory_id));
      } catch (e) {
        console.error('Failed to delete category:', e);
      }
    },

    async addSubcategory(sub: SubcategoryItem) {
      try {
        const res = await apiFetch<{ success: boolean; data: SubcategoryItem }>('/api/subcategories', { method: 'POST', body: sub });
        this.subcategories = [...this.subcategories, res.data];
      } catch (e) {
        console.error('Failed to add subcategory:', e);
      }
    },

    async updateSubcategory(sub: SubcategoryItem) {
      try {
        const res = await apiFetch<{ success: boolean; data: SubcategoryItem }>(`/api/subcategories/${sub.id}`, { method: 'PUT', body: sub });
        this.subcategories = this.subcategories.map(s => s.id === sub.id ? res.data : s);
      } catch (e) {
        console.error('Failed to update subcategory:', e);
      }
    },

    async deleteSubcategory(subId: string) {
      try {
        await apiFetch(`/api/subcategories/${subId}`, { method: 'DELETE' });
        this.subcategories = this.subcategories.filter(s => s.id !== subId);
        this.submodules = this.submodules.filter(m => m.subcategory_id !== subId);
      } catch (e) {
        console.error('Failed to delete subcategory:', e);
      }
    },

    async addSubmodule(mod: SubmoduleItem) {
      try {
        const res = await apiFetch<{ success: boolean; data: SubmoduleItem }>('/api/submodules', { method: 'POST', body: mod });
        this.submodules = [...this.submodules, res.data];
      } catch (e) {
        console.error('Failed to add submodule:', e);
      }
    },

    async updateSubmodule(mod: SubmoduleItem) {
      try {
        const res = await apiFetch<{ success: boolean; data: SubmoduleItem }>(`/api/submodules/${mod.id}`, { method: 'PUT', body: mod });
        this.submodules = this.submodules.map(m => m.id === mod.id ? res.data : m);
      } catch (e) {
        console.error('Failed to update submodule:', e);
      }
    },

    async deleteSubmodule(modId: string) {
      try {
        await apiFetch(`/api/submodules/${modId}`, { method: 'DELETE' });
        this.submodules = this.submodules.filter(m => m.id !== modId);
      } catch (e) {
        console.error('Failed to delete submodule:', e);
      }
    },

    async addUser(user: AppUser) {
      try {
        const res = await apiFetch<{ success: boolean; data: AppUser }>('/api/users', { method: 'POST', body: user });
        this.allUsers = [...this.allUsers, res.data];
      } catch (e) {
        console.error('Failed to add user:', e);
      }
    },

    async refreshTicket(ticketId: string) {
      try {
        const res = await apiFetch<{ success: boolean; data: Ticket }>(`/api/tickets/${ticketId}`);
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
