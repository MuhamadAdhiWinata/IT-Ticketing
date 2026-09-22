import { defineStore } from 'pinia';
import type { AppUser } from '~/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AppUser | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    isSystemAdmin: (state) => state.user?.role === 'SYSTEM_ADMIN',
    isITWorker: (state) => state.user?.role === 'IT_WORKER',
    isUserNonIT: (state) => state.user?.role === 'USER_NON_IT',
    canManageUsers: (state) => state.user?.role === 'SYSTEM_ADMIN',
    canAssignTickets: (state) => state.user?.role === 'SYSTEM_ADMIN' || state.user?.role === 'IT_WORKER',
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const res = await $fetch<{ success: boolean; data: AppUser }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });

        this.user = res.data;
        this.isAuthenticated = true;
        return true;
      } catch (e: any) {
        this.error = e?.data?.statusMessage || e?.message || 'Login failed';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore errors on logout
      }
      this.user = null;
      this.isAuthenticated = false;
      this.error = null;
    },

    async restoreSession() {
      try {
        const res = await $fetch<{ success: boolean; data: AppUser }>('/api/auth/me');
        this.user = res.data;
        this.isAuthenticated = true;
      } catch {
        this.user = null;
        this.isAuthenticated = false;
      }
    },
  },
});
