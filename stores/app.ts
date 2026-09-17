import { defineStore } from 'pinia';
import type { AppUser, Ticket, CategoryItem, VendorItem, TechnicianItem } from '~/types';
import { StorageService } from '~/services/storage';

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
    vendors: [] as VendorItem[],
    technicians: [] as TechnicianItem[],
    allUsers: [] as AppUser[],
    isCreateModalOpen: false,
    selectedTicket: null as Ticket | null,
    isSidebarCollapsed: false,
    isMobileSidebarOpen: false,
  }),

  actions: {
    initApp() {
      this.darkMode = StorageService.getDarkMode();
      this.tickets = StorageService.getTickets();
      this.categories = StorageService.getCategories();
      this.vendors = StorageService.getVendors();
      this.technicians = StorageService.getTechnicians();
      this.allUsers = StorageService.getUsers();
      this.currentUser = this.allUsers[1] || this.allUsers[0] || null;
      this.loadStateFromUrl();
      this.isLoaded = true;
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.documentElement.classList.toggle('dark', this.darkMode);
      StorageService.setDarkMode(this.darkMode);
    },

    setActiveTab(tab: string) {
      this.activeTab = tab;
      this.activeView = 'main';
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

    addTicket(ticketPayload: Partial<Ticket>, shouldIssue: boolean) {
      if (!this.currentUser) return;
      const prefix = ticketPayload.category === 'Support IT' ? 'TIKSP' : 'TIKPG';
      const newTicket: Ticket = {
        id: `TCK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this.tickets.length + 1).padStart(3, '0')}`,
        ticket_number: ticketPayload.ticket_number || `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
        title: ticketPayload.title || '',
        category: ticketPayload.category || 'Hardware',
        subcategory: ticketPayload.subcategory || 'General',
        location: ticketPayload.location || 'Lantai 1',
        priority: ticketPayload.priority || 'MEDIUM',
        description: ticketPayload.description || '',
        status: shouldIssue ? 'PROCESS' : 'DRAFT',
        created_at: new Date().toISOString(),
        requestedBy: this.currentUser.id,
        requestedByName: this.currentUser.name,
        requestedByDept: this.currentUser.department,
        created_by_name: this.currentUser.name,
        attachments: ticketPayload.attachments || [],
        worklogs: [],
        comments: [],
        internal_notes: [],
        audit_logs: [
          {
            action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
            performed_at: new Date().toISOString(),
            performed_by: this.currentUser.id,
            performed_by_name: this.currentUser.name,
          }
        ]
      };

      this.tickets = [newTicket, ...this.tickets];
      StorageService.saveTickets(this.tickets);
    },

    updateTicket(updatedTicket: Ticket) {
      this.tickets = this.tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
      if (this.selectedTicket?.id === updatedTicket.id) {
        this.selectedTicket = updatedTicket;
      }
      StorageService.saveTickets(this.tickets);
    },

    updateTicketStatus(ticketId: string, status: Ticket['status']) {
      this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, status } : t);
      StorageService.saveTickets(this.tickets);
    },

    updateTicketAssignee(ticketId: string, userId: string) {
      const user = this.allUsers.find(u => u.id === userId);
      this.tickets = this.tickets.map(t => t.id === ticketId ? { ...t, assignedTo: userId, assignedToName: user?.name } : t);
      StorageService.saveTickets(this.tickets);
    },

    saveWorklogNote(ticketId: string, stageKey: string, notes: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }) {
      if (!this.currentUser) return;
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const now = new Date().toISOString();
      const newWorklogs = [...(ticket.worklogs || []), { id: `wl-${Date.now()}`, stageKey, description: notes, created_at: now, worker_id: this.currentUser.id, worker_name: this.currentUser.name, date: new Date().toISOString().split('T')[0], start_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), finish_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }), duration_minutes: 0 }];
      const newAttachments = filePayload ? [...(ticket.attachments || []), { id: `att-${Date.now()}`, ...filePayload, uploaded_by: this.currentUser.id, uploaded_by_name: this.currentUser.name, uploaded_at: now }] : (ticket.attachments || []);

      const updated: Ticket = {
        ...ticket,
        attachments: newAttachments,
        worklogs: newWorklogs,
      };

      this.updateTicket(updated);
    },

    completeStage(ticketId: string, stageKey: string, notes?: string, filePayload?: { file_name: string; file_size: string; stage: string; visibility: string }, targetStatus?: Ticket['status']) {
      if (!this.currentUser) return;
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const now = new Date().toISOString();
      let newStatus = targetStatus || ticket.status; // Use targetStatus if provided, otherwise keep current
      let completedAt = ticket.completed_at;
      let assignedTo = ticket.assignedTo;
      let assignedToName = ticket.assignedToName;

      if (stageKey === 'ASSIGN') {
        newStatus = targetStatus || 'PROCESS';
        // Auto-assign to current user if unassigned when completing assign stage
        if (!assignedTo && this.currentUser.role !== 'USER_NON_IT') {
          assignedTo = this.currentUser.id;
          assignedToName = this.currentUser.name;
        }
      } else if (stageKey === 'IN_PROGRESS') {
        newStatus = targetStatus || 'SELESAI'; // Submitting IN_PROGRESS moves to SELESAI
        completedAt = now; // Mark as completed when IN_PROGRESS is done
      } else if (stageKey === 'COMPLETION') {
        // This stage is already 'SELESAI'. If a targetStatus is provided (e.g., DELEGASI), use it.
        newStatus = targetStatus || 'SELESAI';
        if (targetStatus === 'SELESAI') completedAt = now; // Only set completedAt if specifically marking as SELESAI
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
    }
  }
});
