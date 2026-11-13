<template>
  <div class="space-y-5">
    <div class="bg-surface rounded-lg border border-border p-4 shadow-xs flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
          <CalendarClock class="w-3.5 h-3.5" />
          <span>Menu Utama</span>
        </div>
        <h1 class="text-xl font-bold text-foreground">Jadwal Duty Engineer</h1>
        <p class="text-xs text-muted-foreground">
          Selama shift berjalan, petugas otomatis mendapat hak akses Duty Engineer. Akses dicabut sendiri saat shift berakhir.
          Waktu tampil dalam zona {{ zone }}; server menyimpan UTC.
        </p>
      </div>
      <UiButton v-if="canManage" size="md" @click="openCreate">
        <Plus class="w-4 h-4" /> Tambah Jadwal
      </UiButton>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-xs overflow-hidden">
      <div class="p-3 border-b border-border flex flex-wrap items-center gap-3 bg-muted/30">
        <label class="flex items-center gap-2 text-xs font-semibold text-foreground">
          Dari
          <input v-model="from" type="date" class="px-2 py-1.5 rounded-lg border border-border bg-surface text-xs" @change="load" />
        </label>
        <label class="flex items-center gap-2 text-xs font-semibold text-foreground">
          Sampai
          <input v-model="to" type="date" class="px-2 py-1.5 rounded-lg border border-border bg-surface text-xs" @change="load" />
        </label>
        <label class="flex items-center gap-2 text-xs text-muted-foreground">
          <input v-model="showCancelled" type="checkbox" class="w-4 h-4 accent-primary" @change="load" />
          Tampilkan yang dibatalkan
        </label>
      </div>

      <div v-if="loading" class="p-6 text-xs text-muted-foreground">Memuat...</div>
      <div v-else-if="!rows.length" class="p-6 text-xs text-muted-foreground">Belum ada jadwal pada rentang ini.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-muted/30 text-muted-foreground">
            <tr>
              <th class="text-left font-semibold px-4 py-2">Petugas</th>
              <th class="text-left font-semibold px-4 py-2">Mulai</th>
              <th class="text-left font-semibold px-4 py-2">Selesai</th>
              <th class="text-left font-semibold px-4 py-2">Status</th>
              <th class="text-left font-semibold px-4 py-2">Catatan</th>
              <th v-if="canManage" class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="border-t border-border align-top">
              <td class="px-4 py-2 font-semibold text-foreground">{{ r.user_name }}</td>
              <td class="px-4 py-2 text-muted-foreground whitespace-nowrap">{{ fmtLocal(r.start_at) }}</td>
              <td class="px-4 py-2 text-muted-foreground whitespace-nowrap">{{ fmtLocal(r.end_at) }}</td>
              <td class="px-4 py-2">
                <span :class="['px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase', STATUS_CLASS[r.status]]">{{ STATUS_LABEL[r.status] }}</span>
              </td>
              <td class="px-4 py-2 text-muted-foreground max-w-xs whitespace-pre-line">{{ r.notes || '-' }}</td>
              <td v-if="canManage" class="px-4 py-2 text-right whitespace-nowrap space-x-1.5">
                <UiButton v-if="r.status === 'ACTIVE'" size="xs" variant="secondary" @click="openSwap(r)">Ganti Petugas</UiButton>
                <UiButton v-if="r.status === 'SCHEDULED' || r.status === 'ACTIVE'" size="xs" variant="secondary" @click="openEdit(r)">Ubah</UiButton>
                <UiButton v-if="r.status === 'SCHEDULED' || r.status === 'ACTIVE'" size="xs" variant="danger" :loading="busyId === r.id" @click="cancel(r)">Batalkan</UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiModal v-model="formOpen" :title="editing ? 'Ubah Jadwal Shift' : 'Tambah Jadwal Shift'">
      <form id="duty-form" class="space-y-3" @submit.prevent="save">
        <label class="block space-y-1.5">
          <span class="text-xs font-semibold text-foreground">Petugas</span>
          <select v-model="form.user_id" required class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="" disabled>Pilih petugas IT</option>
            <option v-for="u in workers" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block space-y-1.5">
            <span class="text-xs font-semibold text-foreground">Mulai</span>
            <input v-model="form.start" type="datetime-local" required class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <label class="block space-y-1.5">
            <span class="text-xs font-semibold text-foreground">Selesai</span>
            <input v-model="form.end" type="datetime-local" required class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
          </label>
        </div>
        <label class="block space-y-1.5">
          <span class="text-xs font-semibold text-foreground">Catatan</span>
          <textarea v-model="form.notes" rows="2" maxlength="2000" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
        </label>
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton size="sm" variant="ghost" @click="formOpen = false">Batal</UiButton>
          <UiButton size="sm" type="submit" form="duty-form" :loading="saving">Simpan</UiButton>
        </div>
      </template>
    </UiModal>

    <UiModal v-model="swapOpen" title="Ganti Petugas">
      <form id="swap-form" class="space-y-3" @submit.prevent="doSwap">
        <p class="text-xs text-muted-foreground">
          Shift {{ swapTarget?.user_name }} berakhir sekarang. Petugas pengganti bertugas mulai sekarang sampai {{ fmtLocal(swapTarget?.end_at) }}.
        </p>
        <label class="block space-y-1.5">
          <span class="text-xs font-semibold text-foreground">Petugas pengganti</span>
          <select v-model="swapForm.user_id" required class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="" disabled>Pilih petugas IT</option>
            <option v-for="u in workers.filter(w => w.id !== swapTarget?.user_id)" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </label>
        <label class="block space-y-1.5">
          <span class="text-xs font-semibold text-foreground">Catatan serah terima</span>
          <textarea v-model="swapForm.notes" rows="2" maxlength="2000" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
        </label>
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton size="sm" variant="ghost" @click="swapOpen = false">Batal</UiButton>
          <UiButton size="sm" type="submit" form="swap-form" :loading="saving">Ganti Sekarang</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CalendarClock, Plus } from 'lucide-vue-next';
import { apiFetch } from '~/services/api';
import { useAppStore } from '~/stores/app';
import { useDutyStore } from '~/stores/duty';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import { CLAIM } from '~/utils/permissions';
import { isITRole } from '~/utils/roles';
import { fmtLocal, isoToLocalInput, localInputToIso } from '~/utils/utcTime';

interface DutyRow {
  id: string; user_id: string; user_name: string; start_at: string; end_at: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'; notes: string | null;
}

const STATUS_LABEL = { SCHEDULED: 'Terjadwal', ACTIVE: 'Aktif', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' };
const STATUS_CLASS = {
  SCHEDULED: 'bg-primary/5 text-primary border-primary/20',
  ACTIVE: 'bg-success/10 text-success border-success/30',
  COMPLETED: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-muted text-muted-foreground border-border line-through',
};

const store = useAppStore();
const duty = useDutyStore();
const { showError } = useModal();
const { toast } = useToast();

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const canManage = computed(() => store.claims.includes(CLAIM.MANAGE_DUTY));
const workers = computed(() => store.allUsers.filter(u => isITRole(u.role) && u.role !== 'SYSTEM_ADMIN'));

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoToLocalInput(d.toISOString()).slice(0, 10);
};
const from = ref(day(-1));
const to = ref(day(14));
const showCancelled = ref(false);
const rows = ref<DutyRow[]>([]);
const loading = ref(true);
const saving = ref(false);
const busyId = ref('');

const errMsg = (e: any, fallback: string) => e?.data?.statusMessage || e?.statusMessage || fallback;

async function load() {
  try {
    const q = new URLSearchParams({ include_cancelled: showCancelled.value ? '1' : '0' });
    // Batas tanggal lokal dikirim sebagai ISO UTC.
    if (from.value) q.set('from', localInputToIso(`${from.value}T00:00`));
    if (to.value) q.set('to', localInputToIso(`${to.value}T23:59`));
    rows.value = (await apiFetch<{ data: DutyRow[] }>(`/api/duty-schedules?${q}`)).data;
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal memuat jadwal.'));
  } finally {
    loading.value = false;
  }
}

// Perubahan jadwal bisa mengubah status duty pengguna ini sendiri: ambil ulang izin agar badge/menu langsung benar.
const afterWrite = async () => { await load(); await duty.refresh(); };

const formOpen = ref(false);
const editing = ref<DutyRow | null>(null);
const form = ref({ user_id: '', start: '', end: '', notes: '' });

function openCreate() {
  editing.value = null;
  form.value = { user_id: '', start: '', end: '', notes: '' };
  formOpen.value = true;
}

function openEdit(r: DutyRow) {
  editing.value = r;
  form.value = { user_id: r.user_id, start: isoToLocalInput(r.start_at), end: isoToLocalInput(r.end_at), notes: r.notes ?? '' };
  formOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    const body = {
      user_id: form.value.user_id,
      start_at: localInputToIso(form.value.start),
      end_at: localInputToIso(form.value.end),
      notes: form.value.notes || null,
    };
    await apiFetch(editing.value ? `/api/duty-schedules/${editing.value.id}` : '/api/duty-schedules', {
      method: editing.value ? 'PUT' : 'POST',
      body,
    });
    formOpen.value = false;
    toast('Jadwal disimpan.', 'success');
    await afterWrite();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal menyimpan jadwal.'));
  } finally {
    saving.value = false;
  }
}

async function cancel(r: DutyRow) {
  if (!window.confirm(`Batalkan jadwal ${r.user_name}? Akses Duty Engineer langsung dicabut bila shift sedang berjalan.`)) return;
  busyId.value = r.id;
  try {
    await apiFetch(`/api/duty-schedules/${r.id}`, { method: 'DELETE' });
    toast('Jadwal dibatalkan.', 'success');
    await afterWrite();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal membatalkan jadwal.'));
  } finally {
    busyId.value = '';
  }
}

const swapOpen = ref(false);
const swapTarget = ref<DutyRow | null>(null);
const swapForm = ref({ user_id: '', notes: '' });

function openSwap(r: DutyRow) {
  swapTarget.value = r;
  swapForm.value = { user_id: '', notes: '' };
  swapOpen.value = true;
}

async function doSwap() {
  if (!swapTarget.value) return;
  saving.value = true;
  try {
    await apiFetch('/api/duty-schedules/swap', {
      method: 'POST',
      body: { schedule_id: swapTarget.value.id, new_user_id: swapForm.value.user_id, notes: swapForm.value.notes || null },
    });
    swapOpen.value = false;
    toast('Petugas diganti.', 'success');
    await afterWrite();
  } catch (e) {
    showError('Gagal', errMsg(e, 'Gagal mengganti petugas.'));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
