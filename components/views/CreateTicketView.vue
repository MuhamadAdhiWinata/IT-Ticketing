<template>
  <div v-if="isOpen" class="mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="store.backToMainView()" class="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Buat Tiket Baru</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Isi formulir berikut untuk melaporkan kendala IT</p>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-6 shadow-xs">
      <!-- Service View Selector -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Layanan IT</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            @click="serviceView = 'SUPPORT_IT'"
            :class="[
              'p-4 rounded-xl border text-left transition-all flex items-center gap-3',
              serviceView === 'SUPPORT_IT'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#026bb1] ring-2 ring-[#026bb1]/20 text-[#026bb1] dark:text-[#52b5f2] font-bold'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-lg">
              🖥️
            </div>
            <div>
              <p class="text-sm font-bold">Support IT</p>
              <p class="text-xs text-gray-400">Hardware, Jaringan, Printer, Akun</p>
            </div>
          </button>

          <button
            type="button"
            @click="serviceView = 'IT_PROGRAMMER'"
            :class="[
              'p-4 rounded-xl border text-left transition-all flex items-center gap-3',
              serviceView === 'IT_PROGRAMMER'
                ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-600/20 text-purple-700 dark:text-purple-300 font-bold'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 text-lg">
              💻
            </div>
            <div>
              <p class="text-sm font-bold">IT Programmer</p>
              <p class="text-xs text-gray-400">Aplikasi, ERP SAP, Bug, Fitur Baru</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Auto ID Info -->
      <div class="p-3.5 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Pelapor:</span>
          <strong class="text-gray-800 dark:text-gray-200 ml-1">{{ store.currentUser?.name || 'User' }}</strong>
          <span class="text-gray-400 mx-1.5">•</span>
          <span class="text-gray-500 dark:text-gray-400">Dept:</span>
          <span class="text-gray-700 dark:text-gray-300 ml-1">{{ store.currentUser?.department || 'General' }}</span>
        </div>
        <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-[#026bb1] dark:text-[#52b5f2] rounded-lg font-mono font-bold text-xs">
          {{ ticketPrefix }}-{{ Math.floor(100000 + Math.random() * 900000) }}
        </span>
      </div>

      <!-- Title -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Judul Kendala / Permintaan <span class="text-red-500">*</span>
        </label>
        <input 
          v-model="title"
          type="text" 
          placeholder="Cth: Printer lantai 2 macet tidak bisa cetak warna"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium"
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
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Lokasi / Ruangan Anda</label>
          <input 
            v-model="location"
            type="text" 
            placeholder="Cth: Lantai 3, Ruang Finance"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Prioritas Kendala</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in priorities"
              :key="p.id"
              type="button"
              @click="priority = p.id"
              :class="[
                'py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center',
                priority === p.id 
                  ? p.activeClass 
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
              ]"
            >
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Deskripsi Detail Permasalahan <span class="text-red-500">*</span>
        </label>
        <textarea 
          v-model="description"
          rows="5"
          placeholder="Jelaskan kendala secara rinci..."
          class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 transition-all font-medium resize-none"
        ></textarea>
      </div>

      <!-- File Upload -->
      <div>
        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Lampiran Foto / Dokumen (Opsional)</label>
        <div class="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-5 text-center bg-gray-50/50 dark:bg-slate-800/30 relative">
          <input 
            type="file" 
            @change="handleFileDrop"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div v-if="fileName" class="flex items-center justify-center gap-2 text-sm text-[#026bb1] dark:text-[#52b5f2] font-semibold">
            <Check class="w-4 h-4" />
            <span>{{ fileName }}</span>
            <span class="text-xs text-gray-400 font-normal">({{ fileSize }})</span>
          </div>
          <div v-else class="flex flex-col items-center justify-center space-y-1">
            <Upload class="w-6 h-6 text-gray-400" />
            <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">Klik atau seret file ke sini untuk unggah</p>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
        <button
          type="button"
          @click="handleSubmit(false)"
          class="px-5 py-3 rounded-xl border border-[#026bb1]/30 bg-white dark:bg-slate-800 text-[#026bb1] dark:text-[#52b5f2] text-xs font-bold hover:bg-blue-50 transition-colors"
        >
          Simpan sebagai Draft
        </button>
        <button
          type="button"
          @click="handleSubmit(true)"
          class="px-6 py-3 rounded-xl bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold transition-colors shadow-md flex items-center gap-2"
        >
          <Check class="w-4 h-4" />
          <span>Kirim Tiket Sekarang</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ArrowLeft, Upload, Check } from 'lucide-vue-next';
import { useAppStore } from '~/stores/app';
import { TicketPriority, Ticket } from '~/types';
import AppSelect from '~/components/common/AppSelect.vue';

const store = useAppStore();
const isOpen = computed(() => store.activeView === 'create-ticket');

const serviceView = ref<'SUPPORT_IT' | 'IT_PROGRAMMER'>('SUPPORT_IT');
const ticketPrefix = computed(() => serviceView.value === 'SUPPORT_IT' ? 'TIKSP' : 'TIKPG');

const title = ref('');
const subcategory = ref('Printer');
const location = ref('Lantai 2');
const priority = ref<TicketPriority>('MEDIUM');
const description = ref('');
const fileName = ref('');
const fileSize = ref('');

const currentSubcategories = computed(() => {
  if (serviceView.value === 'SUPPORT_IT') {
    return ['Printer', 'Scanner', 'Laptop & PC', 'Wifi Kantor', 'Kabel LAN', 'Reset Password', 'Email & O365'];
  } else {
    return [
      'Development Sistem Baru',
      'Pengelolaan Database dan Backup Sistem ERP',
      'Maintenance ERP Desktop',
      'Penanganan Bug ERP Desktop',
      'Permintaan Penambahan Fitur Baru ERP Desktop',
      'Perubahan Fitur Sistem (Modifikasi) ERP Desktop',
      'Release, Deployment, dan Distribusi ERP Desktop Dev Trial',
      'Release, Deployment, dan Distribusi ERP Desktop Production',
      'Maintenance ERP Web',
      'Penanganan Bug ERP Web',
      'Permintaan Penambahan Fitur Baru ERP Web',
      'Perubahan Fitur Sistem (Modifikasi) ERP Web',
      'Release dan Pengujian Lingkungan Dev Trial',
      'Release dan Deployment ERP Web Production'
    ];
  }
});

const priorities = [
  { id: 'LOW', label: 'Low', activeClass: 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-700 dark:text-slate-300' },
  { id: 'MEDIUM', label: 'Med', activeClass: 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-[#026bb1] dark:text-[#52b5f2]' },
  { id: 'HIGH', label: 'High', activeClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300' },
  { id: 'URGENT', label: 'Urgent', activeClass: 'bg-red-50 dark:bg-red-950/60 border-red-400 text-red-700 dark:text-red-300' },
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
  const file = target.files?.[0];
  if (file) {
    fileName.value = file.name;
    fileSize.value = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  }
};

const handleSubmit = (shouldIssue: boolean) => {
  if (!title.value.trim() || !description.value.trim()) {
    alert('Mohon isi Judul Tiket dan Deskripsi Masalah.');
    return;
  }

  const attachments = fileName.value
    ? [
        {
          id: `ATT-${Date.now()}`,
          stage: 'REQUEST' as const,
          visibility: 'USER_VISIBLE' as const,
          file_name: fileName.value,
          file_size: fileSize.value || '1.2 MB',
          uploaded_by: store.currentUser?.id || 'USR-001',
          uploaded_by_name: store.currentUser?.name || 'Karyawan',
          uploaded_at: new Date().toISOString(),
        },
      ]
    : [];

  const ticketPayload: Partial<Ticket> = {
    title: title.value.trim(),
    category: serviceView.value === 'SUPPORT_IT' ? 'Support IT' : 'IT Programmer',
    subcategory: subcategory.value,
    location: location.value.trim(),
    priority: priority.value,
    description: description.value.trim(),
    attachments,
    ticket_number: `${ticketPrefix.value}-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  store.addTicket(ticketPayload, shouldIssue);
  store.backToMainView();
};
</script>
