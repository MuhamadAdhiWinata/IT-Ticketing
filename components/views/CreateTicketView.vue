<template>
  <div v-if="isOpen" class="mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between bg-surface p-6 rounded-lg border border-border shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="store.backToMainView()" class="p-2 rounded-lg bg-muted hover:bg-gray-200 text-gray-600 dark:text-gray-300">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-foreground">Buat Tiket Baru</h1>
          <p class="text-xs text-muted-foreground">Isi formulir berikut untuk melaporkan kendala IT</p>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="bg-surface rounded-lg border border-border p-6 space-y-6 shadow-xs">
      <!-- Service View Selector -->
      <div>
        <label class="block text-xs font-semibold text-foreground mb-2">Pilih Jenis Layanan IT</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            @click="serviceView = 'SUPPORT_IT'"
            :class="[
              'p-4 rounded-lg border text-left transition-all flex items-center gap-3',
              serviceView === 'SUPPORT_IT'
                ? 'bg-primary/5 border-primary ring-2 ring-primary/20 text-primary font-bold'
                : 'bg-surface border-input text-foreground'
            ]"
          >
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-lg">
              🖥️
            </div>
            <div>
              <p class="text-sm font-bold">Support IT</p>
              <p class="text-xs text-muted-foreground">Hardware, Jaringan, Printer, Akun</p>
            </div>
          </button>

          <button
            type="button"
            @click="serviceView = 'IT_PROGRAMMER'"
            :class="[
              'p-4 rounded-lg border text-left transition-all flex items-center gap-3',
              serviceView === 'IT_PROGRAMMER'
                ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-600/20 text-purple-700 dark:text-purple-300 font-bold'
                : 'bg-surface border-input text-foreground'
            ]"
          >
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 text-lg">
              💻
            </div>
            <div>
              <p class="text-sm font-bold">IT Programmer</p>
              <p class="text-xs text-muted-foreground">Aplikasi, ERP SAP, Bug, Fitur Baru</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Auto ID Info -->
      <div class="p-3.5 bg-muted/50 rounded-lg border border-border flex items-center justify-between text-xs">
        <div>
          <span class="text-muted-foreground">Pelapor:</span>
          <strong class="text-foreground ml-1">{{ displayPelaporName }}</strong>
          <span class="text-muted-foreground mx-1.5">•</span>
          <span class="text-muted-foreground">Dept:</span>
          <span class="text-foreground ml-1">{{ displayPelaporDept }}</span>
        </div>
        <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-primary rounded-lg font-mono font-bold text-xs">
          {{ ticketPrefix }}-{{ ticketNumber }}
        </span>
      </div>

      <!-- Buat Atas Nama (Hanya untuk SYSTEM_ADMIN) -->
      <div v-if="store.currentUser?.role === 'SYSTEM_ADMIN'" class="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40 space-y-2">
        <div class="flex items-center gap-2">
          <Shield class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span class="text-xs font-bold text-amber-700 dark:text-amber-300">Buat Atas Nama (Opsional)</span>
        </div>
        <p class="text-[11px] text-amber-600/70 dark:text-amber-400/60">Pilih user lain sebagai pelapor tiket. Jika tidak dipilih, tiket dibuat atas nama Anda sendiri.</p>
        <AppSelect
          :modelValue="behalfUserId ?? ''"
          @update:modelValue="val => behalfUserId = val || null"
          :options="behalfUserOptions"
          label="Pilih Pelapor Tiket"
          placeholder="-- Buat untuk diri sendiri --"
          size="sm"
        />
      </div>

      <!-- Title -->
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1.5">
          Judul Kendala / Permintaan <span class="text-red-500">*</span>
        </label>
        <input 
          v-model="title"
          type="text" 
          placeholder="Cth: Printer lantai 2 macet tidak bisa cetak warna"
          class="w-full px-4 py-3 rounded-lg border border-input bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
        />
      </div>

      <!-- Subcategory Row -->
      <div>
        <AppSelect
          v-model="subcategory"
          :options="currentSubcategories"
          label="Spesifik Kendala / Sub-Kategori"
        />
      </div>

      <!-- Location & Priority Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-foreground mb-1.5">Lokasi / Ruangan Anda</label>
          <input 
            v-model="location"
            type="text" 
            placeholder="Cth: Lantai 3, Ruang Finance"
            class="w-full px-4 py-3 rounded-lg border border-input bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-foreground mb-1.5">Prioritas Kendala</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in priorities"
              :key="p.id"
              type="button"
              @click="priority = p.id"
              :class="[
                'py-2.5 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center',
                priority === p.id 
                  ? p.activeClass 
                  : 'bg-surface border-input text-gray-600 dark:text-muted-foreground hover:bg-gray-50'
              ]"
            >
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1.5">
          Deskripsi Detail Permasalahan <span class="text-red-500">*</span>
        </label>
        <textarea 
          v-model="description"
          rows="5"
          placeholder="Jelaskan kendala secara rinci..."
          class="w-full px-4 py-3 rounded-lg border border-input bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium resize-none"
        ></textarea>
      </div>

      <!-- File Upload -->
      <div>
        <label class="block text-xs font-semibold text-foreground mb-1.5">Lampiran Foto / Dokumen (Opsional)</label>
        <div class="border-2 border-dashed border-input rounded-lg p-5 text-center bg-muted/30 relative">
          <input 
            type="file" 
            multiple
            @change="handleFileDrop"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div v-if="pendingFiles.length > 0" class="space-y-2">
            <div v-for="(pf, i) in pendingFiles" :key="i" class="flex items-center justify-center gap-2 text-sm text-primary font-semibold">
              <Check class="w-4 h-4 shrink-0" />
              <span>{{ pf.file.name }}</span>
              <span class="text-xs text-muted-foreground font-normal">({{ (pf.file.size / 1024).toFixed(1) }} KB)</span>
              <button @click.stop="removePendingFile(i)" class="text-red-400 hover:text-red-600 ml-1">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground">Klik area ini untuk menambah file lain</p>
          </div>
          <div v-else class="flex flex-col items-center justify-center space-y-1">
            <Upload class="w-6 h-6 text-muted-foreground" />
            <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">Klik atau seret file ke sini untuk unggah</p>
            <p class="text-[10px] text-muted-foreground">Bisa pilih beberapa file sekaligus</p>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="pt-4 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          @click="handleSubmit(true)"
          class="px-5 py-3 rounded-lg border border-primary/15 bg-surface text-primary text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1.5"
        >
          <Check class="w-4 h-4" />
          <span>Simpan & Assign</span>
        </button>
        <button
          type="button"
          @click="handleSubmit(false)"
          class="px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-md"
        >
          Simpan
        </button>
      </div>
    </div>

    <!-- Worker Picker Modal -->
    <WorkerPickerModal
      :show="showWorkerPicker"
      :users="store.allUsers"
      @close="showWorkerPicker = false"
      @confirm="handleWorkerConfirm"
    />

    <!-- Modal Dialog Sukses Buat Tiket (Android / Mobile Responsive - Teleport to Body) -->
    <Teleport to="body">
      <div v-if="createdTicketSuccess" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-sm w-full shadow-lg space-y-4 text-center relative">
          <button
            @click="closeSuccessModalAndGoMain"
            class="absolute top-4 right-4 p-1 text-muted-foreground hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Tutup"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Success Icon -->
          <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto pt-0.5">
            <CheckCircle2 class="w-7 h-7" />
          </div>

          <div class="space-y-1.5">
            <h3 class="text-base font-bold text-foreground">Tiket Berhasil Dibuat!</h3>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Tiket dengan kode <span class="font-mono font-bold text-primary bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-primary/15 inline-block my-0.5">{{ createdTicketSuccess.id }}</span> telah berhasil dibuat.
            </p>
          </div>

          <!-- Action Buttons (Stacked on Mobile) -->
          <div class="pt-2 flex flex-col gap-2">
            <button
              type="button"
              @click="goToTicketDetail"
              class="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye class="w-4 h-4" />
              <span>Klik untuk Melihat Detail</span>
            </button>

            <button
              type="button"
              @click="closeSuccessModalAndGoMain"
              class="w-full py-2.5 bg-muted hover:bg-muted text-foreground text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ArrowLeft, Upload, Check, CheckCircle2, Eye, X, Shield } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { useModal } from '~/composables/useModal';
import type { TicketPriority, Ticket, PendingAttachment } from '~/types';
import AppSelect from '~/components/common/AppSelect.vue';
import WorkerPickerModal from '~/components/common/WorkerPickerModal.vue';

const store = useAppStore();
const { showError, showSuccess } = useModal();
const isOpen = computed(() => store.activeView === 'create-ticket');

const serviceView = ref<'SUPPORT_IT' | 'IT_PROGRAMMER'>('SUPPORT_IT');
const ticketPrefix = computed(() => serviceView.value === 'SUPPORT_IT' ? 'TIKSP' : 'TIKPG');
const ticketNumber = ref(Math.floor(100000 + Math.random() * 900000));
const behalfUserId = ref<string | null>(null);
const showWorkerPicker = ref(false);
const selectedWorkers = ref<string[]>([]);
const isSaving = ref(false);

const behalfUserOptions = computed(() => [
  { value: '', label: '-- Buat untuk diri sendiri --' },
  ...store.allUsers
    .filter(u => u.id !== store.currentUser?.id)
    .map(u => ({ value: u.id, label: `${u.name} (${u.department})` }))
]);

const displayPelaporName = computed(() => {
  if (behalfUserId.value) {
    const user = store.allUsers.find(u => u.id === behalfUserId.value);
    if (user) return user.name;
  }
  return store.currentUser?.name || 'User';
});

const displayPelaporDept = computed(() => {
  if (behalfUserId.value) {
    const user = store.allUsers.find(u => u.id === behalfUserId.value);
    if (user) return user.department;
  }
  return store.currentUser?.department || 'General';
});

const title = ref('');
const subcategory = ref('Printer');
const location = ref('Lantai 2');
const priority = ref<TicketPriority>('MEDIUM');
const description = ref('');
const pendingFiles = ref<PendingAttachment[]>([]);
const createdTicketSuccess = ref<Ticket | null>(null);

const currentSubcategories = computed(() => {
  const targetCatName = serviceView.value === 'SUPPORT_IT' ? 'Support IT' : 'IT Programmer';
  const targetCategory = store.categories.find(c => c.name.toLowerCase() === targetCatName.toLowerCase());
  
  if (!targetCategory) return [];

  const storeSubs = store.subcategories
    .filter(s => s.category_id === targetCategory.id)
    .map(s => s.name);

  return storeSubs;
});

const priorities: { id: TicketPriority; label: string; activeClass: string }[] = [
  { id: 'LOW', label: 'Low', activeClass: 'bg-muted border-border text-muted-foreground' },
  { id: 'MEDIUM', label: 'Med', activeClass: 'bg-primary/5 border-primary text-primary' },
  { id: 'HIGH', label: 'High', activeClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300' },
  { id: 'CRITICAL', label: 'Critical', activeClass: 'bg-red-50 dark:bg-red-950/60 border-red-400 text-red-700 dark:text-red-300' },
];

watch(serviceView, (newView) => {
  if (newView === 'SUPPORT_IT') {
    subcategory.value = 'Printer';
  } else {
    subcategory.value = 'Development Sistem Baru';
  }
}, { immediate: true });

const handleFileDrop = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    for (const file of Array.from(target.files)) {
      pendingFiles.value.push({ file });
    }
  }
  target.value = '';
};

const removePendingFile = (index: number) => {
  pendingFiles.value.splice(index, 1);
};

const handleSubmit = async (shouldAssign: boolean) => {
  if (!title.value.trim() || !description.value.trim()) {
    showError('Formulir Tidak Lengkap', 'Mohon isi Judul Tiket dan Deskripsi Masalah.');
    return;
  }
  if (shouldAssign) {
    showWorkerPicker.value = true;
    return;
  }
  await createTicket(false);
};

const handleWorkerConfirm = async (userIds: string[]) => {
  showWorkerPicker.value = false;
  selectedWorkers.value = userIds;
  await createTicket(true);
};

const createTicket = async (shouldIssue: boolean = false) => {
  isSaving.value = true;
  try {
    const ticketPayload: Partial<Ticket> = {
      title: title.value.trim(),
      category: serviceView.value === 'SUPPORT_IT' ? 'Support IT' : 'IT Programmer',
      subcategory: subcategory.value,
      location: location.value.trim(),
      priority: priority.value,
      description: description.value.trim(),
    };
    const newTicket = await store.addTicket(ticketPayload, shouldIssue, behalfUserId.value || null);
    if (newTicket) {
      if (selectedWorkers.value.length > 0) {
        await $fetch(`/api/tickets/${newTicket.id}/members`, {
          method: 'POST',
          body: { userIds: selectedWorkers.value },
        });
      }
      if (pendingFiles.value.length > 0) {
        const fd = new FormData();
        fd.append('ticketId', newTicket.id);
        fd.append('stage', 'REQUEST');
        fd.append('visibility', 'USER_VISIBLE');
        for (const pf of pendingFiles.value) {
          fd.append('files', pf.file);
        }
        await $fetch('/api/upload', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        await store.refreshTicket(newTicket.id);
      }
      createdTicketSuccess.value = newTicket;
    } else {
      showError('Gagal Membuat Tiket', 'Terjadi kesalahan saat membuat tiket.');
    }
  } catch (e: any) {
    showError('Gagal', e?.message || 'Terjadi kesalahan.');
  } finally {
    isSaving.value = false;
  }
};

const goToTicketDetail = () => {
  if (createdTicketSuccess.value) {
    const id = createdTicketSuccess.value.id;
    createdTicketSuccess.value = null;
    resetForm();
    store.openTicketDetail(id);
  }
};

const closeSuccessModalAndGoMain = () => {
  createdTicketSuccess.value = null;
  resetForm();
  store.backToMainView();
};

const resetForm = () => {
  title.value = '';
  description.value = '';
  pendingFiles.value = [];
  behalfUserId.value = null;
  selectedWorkers.value = [];
};
</script>
