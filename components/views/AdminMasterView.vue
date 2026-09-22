<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#026bb1] dark:text-[#52b5f2] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/60">
          <Settings class="w-3.5 h-3.5" />
          <span>Master Data Governance & System Configuration</span>
        </div>
        <h1 class="text-xl font-extrabold text-gray-900 dark:text-white">
          Manajemen Master Data
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Kelola master kategori & subkategori layanan IT terpisah, prioritas tiket, serta akun pengguna sistem.
        </p>
      </div>

      <!-- Current Active User Info -->
      <div class="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
        <div class="w-8 h-8 rounded-full bg-[#026bb1] text-white flex items-center justify-center font-bold text-xs">
          {{ store.currentUser?.name.charAt(0) }}
        </div>
        <div class="text-xs">
          <span class="text-[10px] text-gray-400 block font-semibold uppercase">User Aktif Saat Ini:</span>
          <span class="font-bold text-gray-900 dark:text-white">{{ store.currentUser?.name }} ({{ store.currentUser?.role }})</span>
        </div>
      </div>
    </div>

    <!-- Master Tabs -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div class="flex flex-wrap border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 p-2 gap-2">
        <button
          @click="activeTab = 'CATEGORIES'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'CATEGORIES' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800'"
        >
          <FolderTree class="w-4 h-4" />
          <span>Kategori & Subkategori ({{ store.categories.length }} Kategori, {{ store.subcategories.length }} Subkategori)</span>
        </button>

        <button
          @click="activeTab = 'PRIORITIES'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'PRIORITIES' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800'"
        >
          <AlertCircle class="w-4 h-4" />
          <span>Prioritas Tiket</span>
        </button>

        <button
          @click="activeTab = 'USERS'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'USERS' ? 'bg-white dark:bg-slate-900 text-[#026bb1] shadow-xs' : 'text-gray-500 hover:text-gray-800'"
        >
          <Users class="w-4 h-4" />
          <span>Master Account & Simulasi Role ({{ store.allUsers.length }})</span>
        </button>
      </div>

      <!-- TAB 1: KATEGORI & SUBKATEGORI (RELASIONAL TERPISAH) -->
      <div v-if="activeTab === 'CATEGORIES'" class="p-5 sm:p-6 space-y-8">
        
        <!-- SECTION 1: MASTER KATEGORI INDUK -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderTree class="w-4 h-4 text-[#026bb1]" />
                <span>Tabel Master Kategori Induk</span>
              </h3>
              <p class="text-[11px] text-gray-500">Tabel entitas utama kategori layanan (misal: Support IT & IT Programmer)</p>
            </div>
            <button
              @click="openAddCategoryModal"
              class="px-3.5 py-1.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="cat in store.categories"
              :key="cat.id"
              class="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 space-y-3 shadow-xs"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#026bb1] dark:text-[#52b5f2] border border-blue-200 dark:border-blue-900">
                    {{ cat.id }}
                  </span>
                  <span class="font-extrabold text-sm text-gray-900 dark:text-white">{{ cat.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="editCategory(cat)"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteCategory(cat.id)"
                    class="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-slate-700/60">
                <span>Total Subkategori Terhubung:</span>
                <span class="font-mono font-bold text-gray-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
                  {{ getSubcategoriesCount(cat.id) }} Subkategori
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-gray-200 dark:border-slate-800" />

        <!-- SECTION 2: MASTER SUBKATEGORI INDIVIDU (RELASIONAL FK) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Tag class="w-4 h-4 text-emerald-600" />
                <span>Tabel Master Subkategori (Relational DB Records)</span>
              </h3>
              <p class="text-[11px] text-gray-500">
                Setiap baris adalah record subkategori terpisah yang terhubung via Foreign Key <code class="font-mono text-[#026bb1]">category_id</code>
              </p>
            </div>
            <button
              @click="openAddSubcategoryModal"
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Subkategori Baru</span>
            </button>
          </div>

          <!-- Filter Kategori Induk -->
          <div class="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
            <span class="font-bold text-gray-600 dark:text-gray-400 shrink-0">Filter Kategori Induk:</span>
            <div class="min-w-[200px]">
              <AppSelect
                v-model="selectedCategoryFilter"
                :options="categoryFilterOptions"
                size="sm"
              />
            </div>
          </div>

          <!-- Subcategories Table -->
          <div class="overflow-x-auto custom-scrollbar border border-gray-200 dark:border-slate-800 rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                  <th class="p-3">ID Subkategori</th>
                  <th class="p-3">Kategori Induk (FK: category_id)</th>
                  <th class="p-3">Nama Subkategori</th>
                  <th class="p-3 text-right">Aksi Record</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
                <tr
                  v-for="sub in filteredSubcategories"
                  :key="sub.id"
                  class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td class="p-3 font-mono font-bold text-[#026bb1] dark:text-[#52b5f2]">{{ sub.id }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#026bb1] dark:text-[#52b5f2] border border-blue-200 dark:border-blue-900 font-mono">
                      {{ getCategoryName(sub.category_id) }} ({{ sub.category_id }})
                    </span>
                  </td>
                  <td class="p-3 font-bold text-gray-900 dark:text-white">{{ sub.name }}</td>
                  <td class="p-3 text-right space-x-2">
                    <button @click="editSubcategory(sub)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                    <button @click="deleteSubcategory(sub.id)" class="text-rose-600 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                  </td>
                </tr>
                <tr v-if="filteredSubcategories.length === 0">
                  <td colspan="4" class="p-8 text-center text-gray-400 text-xs">
                    Tidak ada data subkategori untuk kategori ini.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- TAB 2: PRIORITAS TIKET -->
      <div v-if="activeTab === 'PRIORITIES'" class="p-5 sm:p-6 space-y-4">
        <div>
          <h3 class="text-sm font-bold text-gray-900 dark:text-white">Daftar Tingkat Prioritas Tiket</h3>
          <p class="text-[11px] text-gray-500">Standar tingkat urgensi dan kesulitan penanganan tiket</p>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                <th class="p-3">Kode Prioritas</th>
                <th class="p-3">Label</th>
                <th class="p-3">Preview Badge</th>
                <th class="p-3">Deskripsi / SLA Level</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
              <tr v-for="p in prioritiesList" :key="p.id" class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td class="p-3 font-mono font-bold text-[#026bb1]">{{ p.id }}</td>
                <td class="p-3 font-bold text-gray-900 dark:text-white">{{ p.label }}</td>
                <td class="p-3">
                  <span :class="['px-2 py-0.5 rounded text-xs font-bold uppercase', getTicketPriorityBadgeClass(p.id)]">
                    {{ getTicketPriorityLabel(p.id) }}
                  </span>
                </td>
                <td class="p-3 text-gray-600 dark:text-gray-300">{{ p.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: USERS & ROLE SIMULATOR -->
      <div v-if="activeTab === 'USERS'" class="p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Daftar Akun Pengguna & Simulasi Multi-Role</h3>
            <p class="text-[11px] text-gray-500">
              Kelola akun dan uji coba sistem menggunakan persona role berbeda untuk memverifikasi hak akses.
            </p>
          </div>
          <button
            @click="openAddUserModal"
            class="px-3.5 py-1.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah User Baru</span>
          </button>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold uppercase text-gray-500">
                <th class="p-3">User</th>
                <th class="p-3">Email Perusahaan</th>
                <th class="p-3">Departemen</th>
                <th class="p-3">Role Hak Akses</th>
                <th class="p-3 text-center">Status Login</th>
                <th class="p-3 text-right">Aksi Simulasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-slate-800">
              <tr
                v-for="u in store.allUsers"
                :key="u.id"
                class="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors"
                :class="store.currentUser?.id === u.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''"
              >
                <td class="p-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-[#026bb1] dark:text-[#52b5f2] flex items-center justify-center font-bold text-xs">
                      {{ u.name.charAt(0) }}
                    </div>
                    <div>
                      <span class="font-bold text-gray-900 dark:text-white block">{{ u.name }}</span>
                      <span class="text-[10px] text-gray-400 font-mono">{{ u.id }}</span>
                    </div>
                  </div>
                </td>
                <td class="p-3 font-mono text-gray-600 dark:text-gray-400">{{ u.email }}</td>
                <td class="p-3 text-gray-800 dark:text-gray-200">{{ u.department }}</td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      u.role === 'SYSTEM_ADMIN' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                      u.role === 'IT_WORKER' ? 'bg-blue-100 text-[#026bb1] dark:bg-blue-950 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                    ]"
                  >
                    {{ u.role }}
                  </span>
                </td>
                <td class="p-3 text-center">
                  <span
                    v-if="store.currentUser?.id === u.id"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    Aktif
                  </span>
                  <span v-else class="text-[10px] text-gray-400">
                    Offline
                  </span>
                </td>
                <td class="p-3 text-right">
                  <button
                    v-if="store.currentUser?.id === u.id"
                    class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg"
                  >
                    Akun Aktif
                  </button>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL ADD / EDIT CATEGORY -->
    <Teleport to="body">
      <div v-if="isCategoryModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            {{ editingCatId ? 'Edit Kategori Induk' : 'Tambah Kategori Induk Baru' }}
          </h3>
          <form @submit.prevent="saveCategoryForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">ID Kategori</label>
              <input v-model="catForm.id" required :disabled="!!editingCatId" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Kategori</label>
              <input v-model="catForm.name" required placeholder="Cth: Support IT / IT Programmer" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isCategoryModalOpen = false" class="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-[#026bb1] text-white rounded-xl font-bold">Simpan Kategori</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT SUBCATEGORY (INDIVIDU RECORD) -->
    <Teleport to="body">
      <div v-if="isSubcategoryModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-gray-900 dark:text-white">
            {{ editingSubId ? 'Edit Record Subkategori' : 'Tambah Record Subkategori Baru' }}
          </h3>
          <form @submit.prevent="saveSubcategoryForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">ID Subkategori</label>
              <input v-model="subForm.id" required :disabled="!!editingSubId" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" />
            </div>
            <div>
              <AppSelect
                v-model="subForm.category_id"
                :options="categoryFormOptions"
                label="Pilih Kategori Induk (FK: category_id)"
                placeholder="-- Pilih Kategori --"
              />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Subkategori</label>
              <input v-model="subForm.name" required placeholder="Cth: Maintenance ERP Web / Printer" class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isSubcategoryModalOpen = false" class="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan Record</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD USER -->
    <Teleport to="body">
      <div v-if="isUserModalOpen" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <h3 class="text-base font-bold text-gray-900 dark:text-white">Tambah Pengguna Baru</h3>
          <form @submit.prevent="saveUserForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">ID User</label>
              <input v-model="userForm.id" required class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
              <input v-model="userForm.name" required class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input v-model="userForm.email" type="email" required class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
            </div>
            <div>
              <label class="block font-bold text-gray-700 dark:text-gray-300 mb-1">Departemen</label>
              <input v-model="userForm.department" required class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
            </div>
            <div>
              <AppSelect
                v-model="userForm.role"
                :options="roleFormOptions"
                label="Role"
              />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isUserModalOpen = false" class="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-[#026bb1] text-white rounded-xl font-bold">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '~/stores/app';
import {
  Settings,
  FolderTree,
  Tag,
  AlertCircle,
  Users,
  Plus,
} from 'lucide-vue-next';
import type { CategoryItem, SubcategoryItem, UserRole } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import AppSelect from '~/components/common/AppSelect.vue';

const store = useAppStore();

const activeTab = ref<'CATEGORIES' | 'PRIORITIES' | 'USERS'>('CATEGORIES');
const selectedCategoryFilter = ref('ALL');

const categoryFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Kategori (${store.subcategories.length} record)` },
  ...store.categories.map(c => ({ value: c.id, label: `[${c.id}] ${c.name}` }))
]);

const categoryFormOptions = computed(() => store.categories.map(c => ({
  value: c.id,
  label: `[${c.id}] ${c.name}`
})));

const roleFormOptions = [
  { value: 'USER_NON_IT', label: 'USER_NON_IT' },
  { value: 'IT_WORKER', label: 'IT_WORKER' },
  { value: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN' },
];

const prioritiesList = [
  { id: 'LOW', label: 'Low', desc: 'Kendala ringan / non-urgently, penanganan rutin.' },
  { id: 'MEDIUM', label: 'Medium', desc: 'Kendala standar operasional harian.' },
  { id: 'HIGH', label: 'High', desc: 'Kendala berdampak pada produktivitas tim/departemen.' },
  { id: 'CRITICAL', label: 'Critical', desc: 'Sistem down total / insiden darurat kritikal.' },
];

// Modals: Category
const isCategoryModalOpen = ref(false);
const editingCatId = ref<string | null>(null);
const catForm = ref({ id: '', name: '' });

// Modals: Subcategory
const isSubcategoryModalOpen = ref(false);
const editingSubId = ref<string | null>(null);
const subForm = ref({ id: '', category_id: '', name: '' });

// Modals: User
const isUserModalOpen = ref(false);
const userForm = ref<{ id: string; name: string; email: string; department: string; role: UserRole }>({
  id: '',
  name: '',
  email: '',
  department: '',
  role: 'USER_NON_IT',
});

// Category methods
const openAddCategoryModal = () => {
  editingCatId.value = null;
  catForm.value = { id: `CAT-0${store.categories.length + 1}`, name: '' };
  isCategoryModalOpen.value = true;
};

const editCategory = (cat: CategoryItem) => {
  editingCatId.value = cat.id;
  catForm.value = { id: cat.id, name: cat.name };
  isCategoryModalOpen.value = true;
};

const saveCategoryForm = () => {
  const payload: CategoryItem = {
    id: catForm.value.id,
    name: catForm.value.name,
  };
  if (editingCatId.value) {
    store.updateCategory(payload);
  } else {
    store.addCategory(payload);
  }
  isCategoryModalOpen.value = false;
};

const deleteCategory = (id: string) => {
  if (confirm(`Hapus kategori ${id}? Semua subkategori terkait juga akan terhapus.`)) {
    store.deleteCategory(id);
  }
};

const getSubcategoriesCount = (catId: string) => {
  return store.subcategories.filter(s => s.category_id === catId).length;
};

const getCategoryName = (catId: string) => {
  const found = store.categories.find(c => c.id === catId);
  return found ? found.name : catId;
};

const filteredSubcategories = computed(() => {
  if (selectedCategoryFilter.value === 'ALL') return store.subcategories;
  return store.subcategories.filter(s => s.category_id === selectedCategoryFilter.value);
});

// Subcategory methods
const openAddSubcategoryModal = () => {
  editingSubId.value = null;
  const nextNum = store.subcategories.length + 1;
  const defaultCatId = store.categories[0]?.id || 'CAT-01';
  subForm.value = {
    id: `SUB-${String(nextNum).padStart(3, '0')}`,
    category_id: selectedCategoryFilter.value !== 'ALL' ? selectedCategoryFilter.value : defaultCatId,
    name: '',
  };
  isSubcategoryModalOpen.value = true;
};

const editSubcategory = (sub: SubcategoryItem) => {
  editingSubId.value = sub.id;
  subForm.value = { ...sub };
  isSubcategoryModalOpen.value = true;
};

const saveSubcategoryForm = () => {
  const payload: SubcategoryItem = {
    id: subForm.value.id,
    category_id: subForm.value.category_id,
    name: subForm.value.name.trim(),
  };
  if (editingSubId.value) {
    store.updateSubcategory(payload);
  } else {
    store.addSubcategory(payload);
  }
  isSubcategoryModalOpen.value = false;
};

const deleteSubcategory = (id: string) => {
  if (confirm(`Hapus subkategori ${id}?`)) {
    store.deleteSubcategory(id);
  }
};

// User methods
const openAddUserModal = () => {
  userForm.value = {
    id: `USR-00${store.allUsers.length + 1}`,
    name: '',
    email: '',
    department: '',
    role: 'USER_NON_IT',
  };
  isUserModalOpen.value = true;
};

const saveUserForm = () => {
  store.addUser({ ...userForm.value });
  isUserModalOpen.value = false;
};
</script>
