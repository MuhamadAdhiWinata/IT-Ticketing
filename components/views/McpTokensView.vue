<template>
  <div class="space-y-5">
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
      <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
        <KeyRound class="w-3.5 h-3.5" />
        <span>Pengaturan</span>
      </div>
      <h1 class="text-xl font-bold text-foreground">Token MCP</h1>
      <p class="text-xs text-muted-foreground">
        Token untuk menghubungkan klien AI (OpenCode, Claude Code) ke akun Anda. Aksi lewat token tercatat atas nama Anda.
      </p>
    </div>

    <!-- Token baru: tampil sekali -->
    <div v-if="created" class="bg-surface rounded-lg border border-warning/40 p-4 shadow-xs space-y-3">
      <p class="text-xs font-bold text-foreground">Token "{{ created.name }}" dibuat. Salin sekarang, tidak akan ditampilkan lagi.</p>
      <div class="flex items-center gap-2">
        <code class="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground break-all select-all">{{ created.token }}</code>
        <UiButton size="sm" variant="secondary" @click="copy(created.token)">
          <Copy class="w-3.5 h-3.5" /> Salin
        </UiButton>
      </div>
      <div class="space-y-1">
        <p class="text-[10px] font-bold text-muted-foreground uppercase">Perintah Claude Code</p>
        <code class="block px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground break-all select-all">{{ claudeCmd }}</code>
      </div>
      <UiButton size="xs" variant="ghost" @click="created = null">Tutup</UiButton>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden">
      <form class="p-4 flex flex-col sm:flex-row gap-3 sm:items-end border-b border-border" @submit.prevent="generate">
        <div class="flex-1 space-y-1.5">
          <label class="block text-xs font-semibold text-foreground">Nama token</label>
          <input
            v-model="name"
            type="text"
            maxlength="100"
            placeholder="mis. Laptop kantor"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <UiButton size="md" type="submit" :loading="creating" :disabled="!name.trim()">Generate Token Baru</UiButton>
      </form>

      <div v-if="loading" class="p-6 text-xs text-muted-foreground">Memuat...</div>
      <div v-else-if="!tokens.length" class="p-6 text-xs text-muted-foreground">Belum ada token.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-muted/30 text-muted-foreground">
            <tr>
              <th class="text-left font-semibold px-4 py-2">Nama</th>
              <th class="text-left font-semibold px-4 py-2">Dibuat</th>
              <th class="text-left font-semibold px-4 py-2">Terakhir dipakai</th>
              <th class="text-left font-semibold px-4 py-2">Status</th>
              <th class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tokens" :key="t.id" class="border-t border-border">
              <td class="px-4 py-2 font-semibold text-foreground">{{ t.name }}</td>
              <td class="px-4 py-2 text-muted-foreground whitespace-nowrap">{{ t.created_at }}</td>
              <td class="px-4 py-2 text-muted-foreground whitespace-nowrap">{{ t.last_used_at || 'Belum pernah' }}</td>
              <td class="px-4 py-2">
                <span :class="t.revoked_at ? 'text-muted-foreground' : 'text-success font-semibold'">{{ t.revoked_at ? 'Dicabut' : 'Aktif' }}</span>
              </td>
              <td class="px-4 py-2 text-right">
                <UiButton v-if="!t.revoked_at" size="xs" variant="danger" :loading="revokingId === t.id" @click="revoke(t)">Cabut</UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-2">
      <p class="text-xs font-bold text-foreground">Endpoint</p>
      <code class="block px-3 py-2 rounded-lg border border-border bg-muted/30 text-[11px] font-mono text-foreground select-all">{{ endpoint }}</code>
      <p class="text-[11px] text-muted-foreground">Kirim sebagai header <code class="font-mono">Authorization: Bearer &lt;token&gt;</code>. Maksimal 5 token aktif.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { KeyRound, Copy } from 'lucide-vue-next';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import type { McpTokenItem } from '~/types';

const { showError, showSuccess } = useModal();

const tokens = ref<McpTokenItem[]>([]);
const loading = ref(true);
const creating = ref(false);
const revokingId = ref('');
const name = ref('');
const created = ref<{ name: string; token: string } | null>(null);

const endpoint = computed(() => `${typeof window !== 'undefined' ? window.location.origin : ''}/mcp`);
const claudeCmd = computed(() =>
  `claude mcp add --transport http it-ticketing ${endpoint.value} --header "Authorization: Bearer ${created.value?.token ?? ''}"`);

const errMsg = (e: any, fallback: string) => e?.data?.statusMessage || e?.statusMessage || fallback;

async function load() {
  try {
    tokens.value = (await apiFetch<{ data: McpTokenItem[] }>('/api/mcp-tokens')).data;
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal memuat token.'));
  } finally {
    loading.value = false;
  }
}

async function generate() {
  creating.value = true;
  try {
    const label = name.value.trim();
    const res = await apiFetch<{ data: { token: string } }>('/api/mcp-tokens', { method: 'POST', body: { name: label } });
    created.value = { name: label, token: res.data.token };
    name.value = '';
    await load();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal membuat token.'));
  } finally {
    creating.value = false;
  }
}

async function revoke(t: McpTokenItem) {
  if (!window.confirm(`Cabut token "${t.name}"? Klien yang memakainya akan langsung ditolak.`)) return;
  revokingId.value = t.id;
  try {
    await apiFetch(`/api/mcp-tokens/${t.id}`, { method: 'DELETE' });
    await load();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal mencabut token.'));
  } finally {
    revokingId.value = '';
  }
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  showSuccess('Tersalin', 'Token disalin ke clipboard.');
}

onMounted(load);
</script>
