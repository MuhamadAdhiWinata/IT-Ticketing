<template>
  <div class="space-y-5">
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-1">
      <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
        <ShieldCheck class="w-3.5 h-3.5" />
        <span>Pengaturan</span>
      </div>
      <h1 class="text-xl font-bold text-foreground">Hak Akses</h1>
      <p class="text-xs text-muted-foreground">
        Atur peran, klaim (izin), dan menu sidebar. Perubahan berlaku untuk semua pengguna maksimal beberapa detik setelah disimpan. SYSTEM_ADMIN selalu memiliki semua klaim.
      </p>
    </div>

    <div v-if="loading" class="text-xs text-muted-foreground italic">Memuat...</div>

    <template v-else-if="data">
      <!-- Peran & klaim -->
      <section class="bg-surface rounded-lg border border-border shadow-xs p-4 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 class="text-xs font-bold text-foreground uppercase tracking-wider">Peran dan Klaim</h2>
          <form class="flex flex-wrap items-center gap-2" @submit.prevent="createRole">
            <input v-model="newRole.id" aria-label="ID peran baru" placeholder="ID_PERAN" class="w-36 px-2 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono uppercase" />
            <input v-model="newRole.name" aria-label="Nama peran baru" placeholder="Nama peran" class="w-40 px-2 py-1.5 rounded-lg border border-border bg-surface text-xs" />
            <button type="submit" :disabled="busy || !newRole.id || !newRole.name" class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> Tambah Peran
            </button>
          </form>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-xs border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left p-2 font-bold text-muted-foreground sticky left-0 bg-surface min-w-[260px]">Klaim</th>
                <th v-for="r in data.roles" :key="r.id" class="p-2 text-center align-bottom min-w-[96px]">
                  <div class="font-bold text-foreground">{{ r.name }}</div>
                  <div class="text-[10px] font-mono text-muted-foreground">{{ r.id }}</div>
                  <button
                    v-if="!r.isSystem"
                    type="button"
                    class="mt-1 text-[10px] text-red-600 hover:underline inline-flex items-center gap-0.5"
                    @click="removeRole(r.id)"
                  ><Trash2 class="w-3 h-3" /> Hapus</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in groups" :key="g.name">
                <tr class="bg-muted/40"><td :colspan="data.roles.length + 1" class="p-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{{ g.name }}</td></tr>
                <tr v-for="p in g.items" :key="p.key" class="border-b border-border/60 hover:bg-muted/20">
                  <td class="p-2 sticky left-0 bg-surface">
                    <div class="text-foreground">{{ p.label }}</div>
                    <div class="text-[10px] font-mono text-muted-foreground">{{ p.key }}</div>
                  </td>
                  <td v-for="r in data.roles" :key="r.id" class="p-2 text-center">
                    <input
                      type="checkbox"
                      :aria-label="`${r.name}: ${p.key}`"
                      :checked="r.id === ADMIN_ROLE || draft[r.id]?.has(p.key)"
                      :disabled="r.id === ADMIN_ROLE"
                      class="w-4 h-4 accent-primary"
                      @change="toggle(r.id, p.key)"
                    />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-end gap-2">
          <span v-if="dirtyRoles.length" class="text-[11px] text-amber-700">{{ dirtyRoles.length }} peran belum disimpan</span>
          <button type="button" :disabled="busy || !dirtyRoles.length" class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50" @click="saveRoles">Simpan Klaim</button>
        </div>
      </section>

      <!-- Menu -->
      <section class="bg-surface rounded-lg border border-border shadow-xs p-4 space-y-3">
        <h2 class="text-xs font-bold text-foreground uppercase tracking-wider">Menu Sidebar</h2>
        <p class="text-[11px] text-muted-foreground">Menu tampil bagi peran yang memiliki klaim <span class="font-mono">menu.&lt;id&gt;</span>. Menu Hak Akses khusus SYSTEM_ADMIN.</p>
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border text-left text-muted-foreground">
                <th class="p-2">ID</th><th class="p-2">Label</th><th class="p-2">Ikon</th><th class="p-2">Seksi</th><th class="p-2">Urutan</th><th class="p-2 text-center">Aktif</th><th class="p-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in menuDraft" :key="m.id" class="border-b border-border/60">
                <td class="p-2 font-mono text-[11px]">{{ m.id }}</td>
                <td class="p-2"><input v-model="m.label" :aria-label="`Label ${m.id}`" class="w-36 px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2">
                  <select v-model="m.icon" :aria-label="`Ikon ${m.id}`" class="px-2 py-1 rounded border border-border bg-surface">
                    <option v-for="i in ICON_NAMES" :key="i" :value="i">{{ i }}</option>
                  </select>
                </td>
                <td class="p-2"><input v-model="m.section" :aria-label="`Seksi ${m.id}`" class="w-32 px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2"><input v-model.number="m.sortOrder" type="number" min="0" :aria-label="`Urutan ${m.id}`" class="w-16 px-2 py-1 rounded border border-border bg-surface" /></td>
                <td class="p-2 text-center"><input v-model="m.isActive" type="checkbox" :disabled="m.id === ACCESS_MENU" :aria-label="`Aktif ${m.id}`" class="w-4 h-4 accent-primary" /></td>
                <td class="p-2 text-right"><button type="button" :disabled="busy" class="px-3 py-1 rounded-lg border border-border text-[11px] font-bold disabled:opacity-50" @click="saveMenu(m)">Simpan</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Plus, ShieldCheck, Trash2 } from 'lucide-vue-next';
import { apiFetch } from '~/services/api';
import { useAppStore } from '~/stores/app';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import { ACCESS_MENU, ADMIN_ROLE } from '~/utils/permissions';

interface RoleRow { id: string; name: string; description: string; isSystem: boolean; claims: string[] }
interface MenuRow { id: string; label: string; icon: string; section: string; sortOrder: number; isActive: boolean }
interface Data { roles: RoleRow[]; permissions: { key: string; label: string; group: string }[]; menus: MenuRow[] }

// Harus sama dengan ICONS di components/global/Sidebar.vue.
const ICON_NAMES = ['Search', 'Kanban', 'Briefcase', 'CalendarDays', 'FileSpreadsheet', 'Settings', 'SlidersHorizontal', 'ClipboardList', 'KeyRound', 'ShieldCheck'];

const store = useAppStore();
const { showError } = useModal();
const { toast } = useToast();
const loading = ref(true);
const busy = ref(false);
const data = ref<Data | null>(null);
const draft = reactive<Record<string, Set<string>>>({});
const menuDraft = ref<MenuRow[]>([]);
const newRole = reactive({ id: '', name: '' });

const groups = computed(() => {
  const out: { name: string; items: Data['permissions'] }[] = [];
  for (const p of data.value?.permissions ?? []) {
    let g = out.find(x => x.name === p.group);
    if (!g) out.push(g = { name: p.group, items: [] });
    g.items.push(p);
  }
  return out;
});

const dirtyRoles = computed(() => (data.value?.roles ?? []).filter((r) => {
  if (r.id === ADMIN_ROLE) return false;
  const d = draft[r.id];
  return !!d && (d.size !== r.claims.length || r.claims.some(c => !d.has(c)));
}));

const errMsg = (e: any) => e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.';

async function load() {
  loading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: Data }>('/api/rbac');
    data.value = res.data;
    for (const r of res.data.roles) draft[r.id] = new Set(r.claims);
    menuDraft.value = res.data.menus.map(m => ({ ...m }));
  } catch (e) {
    showError('Gagal Memuat', errMsg(e));
  } finally {
    loading.value = false;
  }
}

function toggle(roleId: string, key: string) {
  const s = draft[roleId];
  if (!s) return;
  if (!s.delete(key)) s.add(key);
}

// Menyegarkan sidebar/klaim admin sendiri setelah perubahan.
const refreshSelf = () => store.loadRbac();

async function saveRoles() {
  busy.value = true;
  try {
    for (const r of dirtyRoles.value) {
      await apiFetch(`/api/rbac/roles/${r.id}`, { method: 'PUT', body: { claims: [...draft[r.id]!] } });
    }
    await load();
    await refreshSelf();
    toast('Klaim tersimpan.', 'success');
  } catch (e) {
    showError('Gagal Menyimpan', errMsg(e));
  } finally {
    busy.value = false;
  }
}

async function createRole() {
  busy.value = true;
  try {
    await apiFetch('/api/rbac/roles', { method: 'POST', body: { id: newRole.id.trim().toUpperCase(), name: newRole.name } });
    newRole.id = '';
    newRole.name = '';
    await load();
    await refreshSelf();
    toast('Peran ditambahkan. Centang klaimnya lalu simpan.', 'success');
  } catch (e) {
    showError('Gagal Menambah Peran', errMsg(e));
  } finally {
    busy.value = false;
  }
}

async function removeRole(id: string) {
  if (!window.confirm(`Hapus peran ${id}?`)) return;
  busy.value = true;
  try {
    await apiFetch(`/api/rbac/roles/${id}`, { method: 'DELETE' });
    await load();
    await refreshSelf();
    toast('Peran dihapus.', 'success');
  } catch (e) {
    showError('Gagal Menghapus', errMsg(e));
  } finally {
    busy.value = false;
  }
}

async function saveMenu(m: MenuRow) {
  busy.value = true;
  try {
    await apiFetch(`/api/rbac/menus/${m.id}`, {
      method: 'PUT',
      body: { label: m.label, icon: m.icon, section: m.section, sortOrder: m.sortOrder, isActive: m.isActive },
    });
    await refreshSelf();
    toast('Menu tersimpan.', 'success');
  } catch (e) {
    showError('Gagal Menyimpan Menu', errMsg(e));
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>
