import { defineStore } from 'pinia';
import type { AppUser } from '~/types';
import { apiFetch } from '~/services/api';
import { isITRole, canTriageRole, isDutyRole, isIntakeRole } from '~/utils/roles';
import { ADMIN_ROLE, CLAIM, roleHas } from '~/utils/permissions';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AppUser | null,
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    isSystemAdmin: (state) => state.user?.role === ADMIN_ROLE,
    isITWorker: (state) => isITRole(state.user?.role),
    isUserNonIT: (state) => !isITRole(state.user?.role),
    canManageUsers: (state) => roleHas(state.user?.role, CLAIM.MANAGE_MASTER),
    canAssignTickets: (state) => isITRole(state.user?.role),
    canTriage: (state) => canTriageRole(state.user?.role),
    isDuty: (state) => isDutyRole(state.user?.role),
    isIntake: (state) => isIntakeRole(state.user?.role),
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const res = await apiFetch<{ success: boolean; data: AppUser }>('/api/auth/login', {
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
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore errors on logout
      }
      this.user = null;
      this.isAuthenticated = false;
      this.error = null;
    },

    async restoreSession() {
      try {
        const res = await apiFetch<{ success: boolean; data: AppUser }>('/api/auth/me');
        this.user = res.data;
        this.isAuthenticated = true;
      } catch {
        this.user = null;
        this.isAuthenticated = false;
      }
    },
  },
});
