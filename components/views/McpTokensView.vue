<template>
  <div class="space-y-5">
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
      <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
        <KeyRound class="w-3.5 h-3.5" />
        <span>Pengaturan</span>
      </div>
      <h1 class="text-xl font-bold text-foreground">Token MCP</h1>
      <p class="text-xs text-muted-foreground">
        Token untuk menghubungkan klien AI (Claude Code, OpenCode) ke akun Anda. Aksi lewat token tercatat atas nama Anda.
      </p>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden">
      <div class="flex border-b border-border bg-muted/30 p-1 gap-1">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          :class="[
            'px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2',
            tab === t.id ? 'bg-surface shadow-xs text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="tab = t.id"
        >
          <component :is="t.icon" class="w-4 h-4" />
          {{ t.label }}
        </button>
      </div>

      <template v-if="tab === 'token'">
        <div v-if="shown" class="p-4 border-b border-border space-y-3 bg-muted/10">
          <div class="flex items-start justify-between gap-3">
            <p class="text-xs font-bold text-foreground">
              {{ shown.isNew ? `Token "${shown.name}" dibuat.` : `Token "${shown.name}"` }}
              <span class="font-normal text-muted-foreground">Anda dapat melihatnya lagi kapan saja dari daftar di bawah.</span>
            </p>
            <UiButton size="xs" variant="ghost" @click="shown = null">Tutup</UiButton>
          </div>
          <div class="flex items-center gap-2">
            <code class="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-[11px] font-mono text-foreground break-all select-all">{{ shown.token }}</code>
            <UiButton size="sm" variant="secondary" @click="copy(shown.token)">
              <Copy class="w-3.5 h-3.5" /> Salin
            </UiButton>
          </div>
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-muted-foreground uppercase">Endpoint</p>
            <code class="block px-3 py-2 rounded-lg border border-border bg-surface text-[11px] font-mono text-foreground select-all">{{ endpoint }}</code>
          </div>
          <button type="button" class="text-xs font-semibold text-primary hover:underline" @click="tab = 'docs'">
            Lihat panduan koneksi Claude Code dan OpenCode
          </button>
        </div>

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
                  <span :class="t.revoked_at ? 'text-muted-foreground' : 'text-success font-semibold'">{{ t.revoked_at ? 'Non-aktif' : 'Aktif' }}</span>
                </td>
                <td class="px-4 py-2 text-right whitespace-nowrap space-x-1.5">
                  <UiButton
                    v-if="!t.revoked_at && t.can_reveal"
                    size="xs"
                    variant="secondary"
                    :loading="revealingId === t.id"
                    @click="reveal(t)"
                  >Lihat</UiButton>
                  <span v-else-if="!t.revoked_at" class="text-[11px] text-muted-foreground" title="Dibuat sebelum fitur lihat token. Buat token baru bila perlu.">Tidak dapat dilihat</span>
                  <UiButton v-if="!t.revoked_at" size="xs" variant="danger" :loading="revokingId === t.id" @click="revoke(t)">Nonaktifkan</UiButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">Maksimal 5 token aktif.</p>
      </template>

      <McpDocsPanel v-else :endpoint="endpoint" :token="shown?.token" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { KeyRound, Copy, BookOpen } from 'lucide-vue-next';
import { apiFetch } from '~/services/api';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import McpDocsPanel from '~/components/views/McpDocsPanel.vue';
import type { McpTokenItem } from '~/types';

const { showError } = useModal();
const { toast } = useToast();

const tabs = [
  { id: 'token' as const, label: 'Token', icon: KeyRound },
  { id: 'docs' as const, label: 'Panduan', icon: BookOpen },
];
const tab = ref<'token' | 'docs'>('token');

const tokens = ref<McpTokenItem[]>([]);
const loading = ref(true);
const creating = ref(false);
const revokingId = ref('');
const revealingId = ref('');
const name = ref('');
const shown = ref<{ id: string; name: string; token: string; isNew: boolean } | null>(null);

const endpoint = computed(() => `${typeof window !== 'undefined' ? window.location.origin : ''}/mcp`);

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
    const res = await apiFetch<{ data: { id: string; token: string } }>('/api/mcp-tokens', { method: 'POST', body: { name: label } });
    shown.value = { id: res.data.id, name: label, token: res.data.token, isNew: true };
    name.value = '';
    await load();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal membuat token.'));
  } finally {
    creating.value = false;
  }
}

async function reveal(t: McpTokenItem) {
  revealingId.value = t.id;
  try {
    const res = await apiFetch<{ data: { token: string } }>(`/api/mcp-tokens/${t.id}`);
    shown.value = { id: t.id, name: t.name, token: res.data.token, isNew: false };
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal menampilkan token.'));
  } finally {
    revealingId.value = '';
  }
}

async function revoke(t: McpTokenItem) {
  if (!window.confirm(`Nonaktifkan token "${t.name}"? Klien yang memakainya akan langsung ditolak.`)) return;
  revokingId.value = t.id;
  try {
    await apiFetch(`/api/mcp-tokens/${t.id}`, { method: 'DELETE' });
    if (shown.value?.id === t.id) shown.value = null;
    await load();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal menonaktifkan token.'));
  } finally {
    revokingId.value = '';
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Token disalin ke clipboard.', 'success');
  } catch {
    toast('Gagal menyalin. Blok teks token lalu salin manual.', 'error');
  }
}

onMounted(load);
</script>
