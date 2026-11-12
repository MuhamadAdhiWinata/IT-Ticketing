import { defineStore } from 'pinia';
import { useAppStore } from '~/stores/app';
import { ONE_DAY_MS } from '~/utils/utcTime';

// Batas setTimeout JS adalah 2^31-1 ms; jadwal yang lebih dari 24 jam tidak dipasang timer (dihitung ulang saat refetch berikutnya).
const BOUNDARY_SLACK_MS = 1000;
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

export const useDutyStore = defineStore('duty', {
  state: () => ({
    isActive: false,
    endAt: null as string | null, // ISO UTC
    nextStartAt: null as string | null, // ISO UTC
  }),

  actions: {
    apply(d: { is_duty_active: boolean; current_duty_end_at: string | null; next_duty_start_at: string | null }) {
      this.isActive = d.is_duty_active;
      this.endAt = d.current_duty_end_at;
      this.nextStartAt = d.next_duty_start_at;
      this.schedule();
    },

    // Ambil ulang izin dari backend (klaim, menu, status duty), lalu pasang timer berikutnya.
    async refresh() {
      await useAppStore().loadRbac();
    },

    // Timer tunggal ke batas terdekat: akhir shift saat aktif, awal shift berikutnya saat tidak.
    schedule() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (typeof window === 'undefined') return;
      const boundary = this.isActive ? this.endAt : this.nextStartAt;
      if (!boundary) return;
      const delta = Date.parse(boundary) - Date.now() + BOUNDARY_SLACK_MS;
      if (delta >= ONE_DAY_MS) return;
      timer = setTimeout(() => this.refresh(), Math.max(delta, BOUNDARY_SLACK_MS));
    },

    // Tab yang lama tidur/idle: timer bisa tertahan browser, jadi validasi ulang saat tab terlihat lagi.
    listen() {
      if (typeof document === 'undefined' || listening) return;
      listening = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.refresh();
      });
    },

    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      this.$reset();
    },
  },
});
