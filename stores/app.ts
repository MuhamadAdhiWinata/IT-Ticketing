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

    async initApp() {
      try {
        const [usersRes, prefsRes] = await Promise.all([
          $fetch<{ success: boolean; data: AppUser[] }>('/api/users'),
          $fetch<{ success: boolean; data: { darkMode: boolean } }>('/api/user/preferences', {
            headers: { 'X-User-Id': 'USR-001' },
          }).catch(() => null),
        ]);

        this.allUsers = usersRes.data;
        this.currentUser = this.allUsers[1] || this.allUsers[0] || null;

        if (prefsRes) {
          this.darkMode = prefsRes.data.darkMode;
        }

        const [ticketsRes, catsRes, subcatsRes] = await Promise.all([
          $fetch<{ success: boolean; data: Ticket[] }>('/api/tickets').catch(() => null),
          $fetch<{ success: boolean; data: CategoryItem[] }>('/api/categories').catch(() => null),
          $fetch<{ success: boolean; data: SubcategoryItem[] }>('/api/subcategories').catch(() => null),
        ]);

        if (ticketsRes) this.tickets = ticketsRes.data;
        if (catsRes) this.categories = catsRes.data;
        if (subcatsRes) this.subcategories = subcatsRes.data;
      } catch {
        // Use empty state on failure
      }

      this.loadStateFromUrl();
      this.isLoaded = true;
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      $fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'X-User-Id': this.currentUser?.id || '' },
        body: { darkMode: this.darkMode },
      }).catch(() => {});
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

    openTicketDetail(ticketId: string) {
      this.selectedTicketId = ticketId;
      const found = this.tickets.find(t => t.id === ticketId);
      if (found) this.selectedTicket = found;
      this.activeView = 'ticket-detail';
      this.pushHistoryState();
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
          this.selectedTicket = this.tickets.find(t => t.id === ticketId) || null;
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
          headers: { 'X-User-Id': this.currentUser.id },
          body: {
            title: ticketPayload.title,
            category: ticketPayload.category,
            subcategory: ticketPayload.subcategory,
            location: ticketPayload.location,
            priority: ticketPayload.priority,
            description: ticketPayload.description,
            shouldIssue,
            behalfUserId,
            requestedByName: ticketPayload.requestedByName,
            requestedByDept: ticketPayload.requestedByDept,
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
          headers: { 'X-User-Id': this.currentUser?.id || '' },
          body: updatedTicket,
        });
      } catch (e) {
        console.error('Failed to update ticket:', e);
      }
    },

    async updateTicketStatus(ticketId: string, status: Ticket['status']) {
      this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, status } : t);
      try {
        await $fetch(`/api/tickets/${ticketId}/status`, {
          method: 'PATCH',
          headers: { 'X-User-Id': this.currentUser?.id || '' },
          body: { status },
        });
      } catch (e) {
        console.error('Failed to update status:', e);
      }
    },

    async updateTicketAssignee(ticketId: string, userId: string) {
      const user = this.allUsers.find(u => u.id === userId);
      this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, assignedTo: userId, assignedToName: user?.name } : t);
      try {
        await $fetch(`/api/tickets/${ticketId}/assignee`, {
          method: 'PATCH',
          headers: { 'X-User-Id': this.currentUser?.id || '' },
          body: { userId },
        });
      } catch (e) {
        console.error('Failed to update assignee:', e);
      }
    },

    switchUser(userId: string) {
      const user = this.allUsers.find(u => u.id === userId);
      if (user) {
        this.currentUser = user;
        const roleTabs: Record<string, string[]> = {
          'USER_NON_IT': ['tracking'],
          'IT_WORKER': ['tracking', 'dashboard', 'my-work', 'daily-work'],
          'SYSTEM_ADMIN': ['tracking', 'dashboard', 'my-work', 'daily-work', 'reports', 'admin'],
        };
        const allowed = roleTabs[user.role] || ['tracking'];
        if (!allowed.includes(this.activeTab)) {
          this.setActiveTab(allowed[0]);
        }
      }
    },

    async saveWorklogNote(ticketId: string, stageKey: string, notes: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }) {
      if (!this.currentUser) return;

      const now = new Date().toISOString();
      const newWorklogs = [...(this.selectedTicket?.worklogs || []), { id: `wl-${Date.now()}`, stageKey, description: notes, created_at: now, worker_id: this.currentUser.id, worker_name: this.currentUser.name, date: new Date().toISOString().split('T')[0], start_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), finish_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), duration_minutes: 0 }];
      const newAttachments = filePayload ? [...(this.selectedTicket?.attachments || []), { id: `att-${Date.now()}`, ...filePayload, uploaded_by: this.currentUser.id, uploaded_by_name: this.currentUser.name, uploaded_at: now }] : (this.selectedTicket?.attachments || []);

      if (this.selectedTicket) {
        const updated: Ticket = {
          ...this.selectedTicket,
          attachments: newAttachments,
          worklogs: newWorklogs,
        };
        this.updateTicket(updated);
      }
    },

    async completeStage(ticketId: string, stageKey: string, notes?: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }, targetStatus?: Ticket['status']) {
      if (!this.currentUser) return;
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const now = new Date().toISOString();
      let newStatus = targetStatus || ticket.status;
      let completedAt = ticket.completed_at;
      let assignedTo = ticket.assignedTo;
      let assignedToName = ticket.assignedToName;

      if (stageKey === 'ASSIGN') {
        newStatus = targetStatus || 'PROCESS';
        if (!assignedTo && this.currentUser.role !== 'USER_NON_IT') {
          assignedTo = this.currentUser.id;
          assignedToName = this.currentUser.name;
        }
      } else if (stageKey === 'IN_PROGRESS') {
        newStatus = targetStatus || 'SELESAI';
        completedAt = now;
      } else if (stageKey === 'COMPLETION') {
        newStatus = targetStatus || 'SELESAI';
        if (targetStatus === 'SELESAI') completedAt = now;
      } else if (stageKey === 'DELEGATION') {
        newStatus = targetStatus || 'DELEGASI';
      }

      const newAttachments = filePayload ? [...(ticket.attachments || []), { id: `att-${Date.now()}`, ...filePayload, uploaded_by_name: this.currentUser.name }] : (ticket.attachments || []);
      const newWorklogs = notes ? [...(ticket.worklogs || []), { id: `wl-${Date.now()}`, stageKey, description: notes, created_at: now, worker_id: this.currentUser.id, worker_name: this.currentUser.name, date: new Date().toISOString().split('T')[0], start_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), finish_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), duration_minutes: 0 }] : (ticket.worklogs || []);
      const newAuditLogs = [...(ticket.audit_logs || []), { id: `aud-${Date.now()}`, action: `TAHAP_${stageKey}_SELESAI`, performed_at: now, performed_by: this.currentUser.id, performed_by_name: this.currentUser.name, notes: notes }];

      const updated: Ticket = {
        ...ticket,
        status: newStatus as Ticket['status'],
        assignedTo,
        assignedToName,
        completed_at: completedAt,
        attachments: newAttachments,
        worklogs: newWorklogs,
        audit_logs: newAuditLogs,
      };

      this.updateTicket(updated);

      try {
        await $fetch(`/api/tickets/${ticketId}/stages/complete`, {
          method: 'POST',
          headers: { 'X-User-Id': this.currentUser.id },
          body: { stageKey, notes, targetStatus, attachment: filePayload ? { stage: filePayload.stage, visibility: filePayload.visibility, file_name: filePayload.file_name, file_size: filePayload.file_size } : undefined },
        });
      } catch (e) {
        console.error('Failed to complete stage:', e);
      }
    },

    async addCustomWorklog(ticketId: string, wlData: { date: string; start_at: string; finish_at: string; duration_minutes: number; description: string; stageKey: string; worker_id?: string; worker_name?: string }) {
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const newWl = {
        id: `wl-${Date.now()}`,
        stageKey: wlData.stageKey,
        worker_id: wlData.worker_id || this.currentUser?.id || '',
        worker_name: wlData.worker_name || this.currentUser?.name || '',
        date: wlData.date,
        start_at: wlData.start_at,
        finish_at: wlData.finish_at,
        duration_minutes: wlData.duration_minutes,
        description: wlData.description,
        created_at: new Date().toISOString(),
      };

      const updated: Ticket = {
        ...ticket,
        worklogs: [...(ticket.worklogs || []), newWl],
      };

      this.updateTicket(updated);
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
      this.categories = this.categories.map(c => c.id === cat.id ? cat : c);
      try {
        await $fetch(`/api/categories/${cat.id}`, { method: 'PUT', body: cat });
      } catch (e) {
        console.error('Failed to update category:', e);
      }
    },

    async deleteCategory(catId: string) {
      this.categories = this.categories.filter(c => c.id !== catId);
      this.subcategories = this.subcategories.filter(s => s.category_id !== catId);
      try {
        await $fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete category:', e);
      }
    },

    async addSubcategory(sub: SubcategoryItem) {
      this.subcategories = [...this.subcategories, sub];
      try {
        await $fetch('/api/subcategories', { method: 'POST', body: sub });
      } catch (e) {
        console.error('Failed to add subcategory:', e);
      }
    },

    async updateSubcategory(sub: SubcategoryItem) {
      this.subcategories = this.subcategories.map(s => s.id === sub.id ? sub : s);
      try {
        await $fetch(`/api/subcategories/${sub.id}`, { method: 'PUT', body: sub });
      } catch (e) {
        console.error('Failed to update subcategory:', e);
      }
    },

    async deleteSubcategory(subId: string) {
      this.subcategories = this.subcategories.filter(s => s.id !== subId);
      try {
        await $fetch(`/api/subcategories/${subId}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete subcategory:', e);
      }
    },

    async addUser(user: AppUser) {
      this.allUsers = [...this.allUsers, user];
      try {
        await $fetch('/api/users', { method: 'POST', body: user });
      } catch (e) {
        console.error('Failed to add user:', e);
      }
    },
  }
});
