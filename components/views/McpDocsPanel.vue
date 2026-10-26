<template>
  <div class="p-5 space-y-5">
    <div class="space-y-1">
      <h2 class="text-sm font-bold text-foreground">Menghubungkan klien AI ke IT-Ticketing</h2>
      <p class="text-xs text-muted-foreground">
        Server MCP memakai transport HTTP dan autentikasi Bearer token. Semua aksi tercatat atas nama pemilik token.
      </p>
    </div>

    <ol class="list-decimal pl-5 space-y-1 text-xs text-foreground">
      <li>Buat token di tab <b>Token</b>, lalu salin.</li>
      <li>Pasang konfigurasi sesuai klien di bawah. Ganti <code class="font-mono">&lt;TOKEN&gt;</code> bila belum terisi.</li>
      <li>Mulai ulang klien, lalu cek bahwa server <code class="font-mono">it-ticketing</code> berstatus terhubung.</li>
    </ol>

    <div class="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border w-fit">
      <button
        v-for="c in clients"
        :key="c.id"
        type="button"
        :class="[
          'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
          client === c.id ? 'bg-surface shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
        ]"
        @click="client = c.id"
      >{{ c.label }}</button>
    </div>

    <div v-if="client === 'claude'" class="space-y-4">
      <section class="space-y-1.5">
        <h3 class="text-xs font-bold text-foreground">Perintah</h3>
        <pre class="px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all select-all">{{ claudeCmd }}</pre>
        <p class="text-[11px] text-muted-foreground">Tambahkan <code class="font-mono">--scope user</code> agar berlaku di semua proyek. Default hanya proyek aktif.</p>
      </section>
      <section class="space-y-1.5">
        <h3 class="text-xs font-bold text-foreground">Verifikasi</h3>
        <pre class="px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all select-all">claude mcp list</pre>
        <p class="text-[11px] text-muted-foreground">Di dalam Claude Code, ketik <code class="font-mono">/mcp</code> untuk melihat status dan daftar tool.</p>
      </section>
      <section class="space-y-1.5">
        <h3 class="text-xs font-bold text-foreground">Hapus</h3>
        <pre class="px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all select-all">claude mcp remove it-ticketing</pre>
      </section>
    </div>

    <div v-else class="space-y-4">
      <section class="space-y-1.5">
        <h3 class="text-xs font-bold text-foreground">Konfigurasi</h3>
        <p class="text-[11px] text-muted-foreground">
          Tambahkan ke <code class="font-mono">~/.config/opencode/opencode.json</code> (semua proyek) atau
          <code class="font-mono">opencode.json</code> di akar proyek. Jangan commit file yang berisi token.
        </p>
        <pre class="px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all select-all">{{ opencodeJson }}</pre>
      </section>
      <section class="space-y-1.5">
        <h3 class="text-xs font-bold text-foreground">Verifikasi</h3>
        <pre class="px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all select-all">opencode mcp list</pre>
        <p class="text-[11px] text-muted-foreground">Status <code class="font-mono">it-ticketing</code> harus terhubung, bukan <code class="font-mono">pending</code> atau <code class="font-mono">failed</code>.</p>
      </section>
    </div>

    <section class="space-y-2">
      <h3 class="text-xs font-bold text-foreground">Tool yang tersedia</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-xs">
          <tbody>
            <tr v-for="g in toolGroups" :key="g.label" class="border-t border-border first:border-t-0 align-top">
              <td class="px-3 py-2 font-semibold text-foreground whitespace-nowrap">{{ g.label }}</td>
              <td class="px-3 py-2 text-muted-foreground font-mono text-[11px] leading-relaxed">{{ g.tools }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-1.5">
      <h3 class="text-xs font-bold text-foreground">Aturan penting</h3>
      <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
        <li>Hanya <code class="font-mono">IT_WORKER</code> dan <code class="font-mono">SYSTEM_ADMIN</code> yang dapat menulis. Pencatat selalu akun pemilik token.</li>
        <li>Aktivitas baru selalu menjadi catatan baru dan tidak mengubah status tiket.</li>
        <li>Perubahan status mengikuti alur yang sama dengan aplikasi. Transisi tidak valid ditolak beserta daftar yang diizinkan.</li>
        <li>Worker hanya dapat mengambil tiket untuk dirinya. Tiket <code class="font-mono">SELESAI</code> mengunci penugasan dan member.</li>
        <li>Klien AI diminta konfirmasi dulu sebelum mengubah status, membuka ulang, menugaskan, atau menambah member.</li>
        <li>Token yang bocor: nonaktifkan di tab Token, lalu buat yang baru.</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ endpoint: string; token?: string }>();

const clients = [
  { id: 'claude' as const, label: 'Claude Code' },
  { id: 'opencode' as const, label: 'OpenCode' },
];
const client = ref<'claude' | 'opencode'>('claude');

const tok = computed(() => props.token || '<TOKEN>');

const claudeCmd = computed(() =>
  `claude mcp add --transport http it-ticketing ${props.endpoint} \\\n  --header "Authorization: Bearer ${tok.value}"`);

const opencodeJson = computed(() => JSON.stringify({
  mcp: {
    'it-ticketing': {
      type: 'remote',
      url: props.endpoint,
      enabled: true,
      headers: { Authorization: `Bearer ${tok.value}` },
    },
  },
}, null, 2));

const toolGroups = [
  { label: 'Cari & baca', tools: 'search_tickets, list_my_tickets, get_ticket, list_ticket_activities, list_ticket_comments, list_internal_notes, get_ticket_history, list_ticket_attachments' },
  { label: 'Tulis', tools: 'add_ticket_activity, log_work_time, add_comment, add_internal_note, add_attachment' },
  { label: 'Alur kerja', tools: 'transition_ticket_status, reopen_ticket, assign_ticket, add_ticket_members' },
  { label: 'Bantuan', tools: 'get_allowed_actions, list_workers, list_vendors' },
];
</script>
