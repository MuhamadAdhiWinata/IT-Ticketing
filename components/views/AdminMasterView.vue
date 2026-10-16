<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-surface rounded-lg border border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
          <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-md border border-primary/15">
          <Settings class="w-3.5 h-3.5" />
          <span>Master Data Governance & System Configuration</span>
        </div>
        <h1 class="text-xl font-bold text-foreground">
          Manajemen Master Data
        </h1>
        <p class="text-xs text-muted-foreground">
          Kelola master kategori, Aplikasi/Project &amp; Sub Modul layanan IT terpisah, prioritas tiket, serta akun pengguna sistem.
        </p>
      </div>

      <!-- User Info -->
      <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-input bg-muted">
        <div class="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">
          {{ store.currentUser?.name.charAt(0) }}
        </div>
        <div class="text-xs">
          <span class="font-bold text-foreground">{{ store.currentUser?.name.split(' ')[0] }}</span>
        </div>
      </div>
    </div>

    <!-- Master Tabs -->
    <div class="bg-surface rounded-lg border border-border overflow-hidden shadow-xs">
      <div class="flex flex-wrap border-b border-border bg-muted p-2 gap-2">
        <button
          @click="activeTab = 'CATEGORIES'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'CATEGORIES' ? 'bg-surface text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        >
          <FolderTree class="w-4 h-4" />
          <span>Kategori & Aplikasi/Project ({{ store.categories.length }} Kategori, {{ store.subcategories.length }} Aplikasi/Project)</span>
        </button>

        <button
          @click="activeTab = 'PRIORITIES'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'PRIORITIES' ? 'bg-surface text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        >
          <AlertCircle class="w-4 h-4" />
          <span>Prioritas Tiket</span>
        </button>

        <button
          @click="activeTab = 'USERS'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'USERS' ? 'bg-surface text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        >
          <Users class="w-4 h-4" />
          <span>Master Account & Simulasi Role ({{ store.allUsers.length }})</span>
        </button>
      </div>

      <!-- TAB 1: KATEGORI, APLIKASI/PROJECT & SUB MODUL (RELASIONAL TERPISAH) -->
      <div v-if="activeTab === 'CATEGORIES'" class="p-5 sm:p-6 space-y-8">
        
        <!-- SECTION 1: MASTER KATEGORI INDUK -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <FolderTree class="w-4 h-4 text-primary" />
                <span>Tabel Master Kategori Induk</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">Tabel entitas utama kategori layanan (misal: Support IT & IT Programmer)</p>
            </div>
            <button
              @click="openAddCategoryModal"
              class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="cat in store.categories"
              :key="cat.id"
              class="p-4 rounded-xl border border-border bg-muted space-y-3 shadow-xs"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <!-- Logo/Icon -->
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderTree class="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/15">
                        {{ cat.id }}
                      </span>
                      <span class="font-bold text-sm text-foreground">{{ cat.name }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="editCategory(cat)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteCategory(cat.id)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div class="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
                <span>Total Aplikasi/Project Terhubung:</span>
                <span class="font-mono font-bold text-foreground px-2 py-0.5 bg-surface rounded border border-input">
                  {{ getSubcategoriesCount(cat.id) }} Aplikasi/Project
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- SECTION 2: MASTER APLIKASI/PROJECT INDIVIDU (RELASIONAL FK) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <Tag class="w-4 h-4 text-success" />
                <span>Tabel Master Aplikasi/Project (Relational DB Records)</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">
                Setiap baris adalah record Aplikasi/Project terpisah yang terhubung via Foreign Key <code class="font-mono text-primary">category_id</code>
              </p>
            </div>
            <button
              @click="openAddSubcategoryModal"
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Aplikasi/Project Baru</span>
            </button>
          </div>

          <!-- Filter Kategori Induk + Search -->
          <div class="flex items-center gap-2 bg-muted p-3 rounded-xl border border-border text-xs">
            <span class="font-bold text-foreground shrink-0">Filter Kategori Induk:</span>
            <div class="min-w-[200px] flex-1">
              <AppSelect
                v-model="selectedCategoryFilter"
                :options="categoryFilterOptions"
                size="sm"
                searchable
                searchPlaceholder="Cari kategori..."
              />
            </div>
            <div class="min-w-[200px] flex-1">
              <input
                v-model="subcategorySearch"
                type="text"
                placeholder="Cari nama/ID Aplikasi/Project..."
                class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs"
              />
            </div>
          </div>

          <!-- Subcategories Table -->
          <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <th class="p-3">ID Aplikasi/Project</th>
                  <th class="p-3">Kategori Induk (FK: category_id)</th>
                  <th class="p-3">Nama Aplikasi/Project</th>
                  <th class="p-3">Total Sub Modul</th>
                  <th class="p-3 text-right">Aksi Record</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="sub in filteredSubcategories"
                  :key="sub.id"
                  class="hover:bg-muted/70 transition-colors"
                >
                  <td class="p-3 font-mono font-bold text-primary">{{ sub.id }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 font-mono">
                      {{ getCategoryName(sub.category_id) }} ({{ sub.category_id }})
                    </span>
                  </td>
                  <td class="p-3 font-bold text-foreground">{{ sub.name }}</td>
                  <td class="p-3 font-mono text-muted-foreground">{{ getSubmodulesCount(sub.id) }}</td>
                  <td class="p-3 text-right space-x-2">
                    <button @click="editSubcategory(sub)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                    <button @click="deleteSubcategory(sub.id)" class="text-rose-600 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                  </td>
                </tr>
                <tr v-if="filteredSubcategories.length === 0">
                  <td colspan="5" class="p-8 text-center text-muted-foreground text-xs">
                    {{ selectedCategoryFilter === 'ALL' && !subcategorySearch.value
                      ? 'Belum ada data Aplikasi/Project. Klik "Tambah Aplikasi/Project Baru" untuk menambah.'
                      : `Tidak ditemukan Aplikasi/Project${subcategorySearch.value ? ` untuk "${subcategorySearch.value}"` : ''}${selectedCategoryFilter.value !== 'ALL' ? ' pada kategori ini' : ''}.` }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr class="border-border" />

        <!-- SECTION 3: MASTER SUB MODUL -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tabel Master Sub Modul (Relational DB Records)</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">
                Setiap baris adalah record Sub Modul yang terhubung via Foreign Key <code class="font-mono text-primary">subcategory_id</code>
              </p>
            </div>
            <button
              @click="openAddSubmoduleModal"
              class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Sub Modul Baru</span>
            </button>
          </div>

          <!-- Filter Aplikasi/Project Induk + Search -->
          <div class="flex items-center gap-2 bg-muted p-3 rounded-xl border border-border text-xs">
            <span class="font-bold text-foreground shrink-0">Filter Aplikasi/Project:</span>
            <div class="min-w-[200px] flex-1">
              <AppSelect
                v-model="selectedSubcategoryFilter"
                :options="subcategoryFilterOptions"
                size="sm"
                searchable
                searchPlaceholder="Cari Aplikasi/Project..."
              />
            </div>
            <div class="min-w-[200px] flex-1">
              <input
                v-model="submoduleSearch"
                type="text"
                placeholder="Cari nama/ID Sub Modul..."
                class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs"
              />
            </div>
          </div>

          <!-- Submodules Table -->
          <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <th class="p-3">ID Sub Modul</th>
                  <th class="p-3">Aplikasi/Project (FK: subcategory_id)</th>
                  <th class="p-3">Nama Sub Modul</th>
                  <th class="p-3 text-right">Aksi Record</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="mod in filteredSubmodules"
                  :key="mod.id"
                  class="hover:bg-muted/70 transition-colors"
                >
                  <td class="p-3 font-mono font-bold text-primary">{{ mod.id }}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 font-mono">
                      {{ getSubcategoryName(mod.subcategory_id) }} ({{ mod.subcategory_id }})
                    </span>
                  </td>
                  <td class="p-3 font-bold text-foreground">{{ mod.name }}</td>
                  <td class="p-3 text-right space-x-2">
                    <button @click="editSubmodule(mod)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                    <button @click="deleteSubmodule(mod.id)" class="text-rose-600 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                  </td>
                </tr>
                <tr v-if="filteredSubmodules.length === 0">
                  <td colspan="4" class="p-8 text-center text-muted-foreground text-xs">
                    {{ selectedSubcategoryFilter === 'ALL' && !submoduleSearch.value
                      ? 'Belum ada data Sub Modul. Klik "Tambah Sub Modul Baru" untuk menambah.'
                      : `Tidak ditemukan Sub Modul${submoduleSearch.value ? ` untuk "${submoduleSearch.value}"` : ''}${selectedSubcategoryFilter.value !== 'ALL' ? ' pada Aplikasi/Project ini' : ''}.` }}
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
          <h3 class="text-sm font-bold text-foreground">Daftar Tingkat Prioritas Tiket</h3>
          <p class="text-[11px] text-muted-foreground">Standar tingkat urgensi dan kesulitan penanganan tiket</p>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                <th class="p-3">Kode Prioritas</th>
                <th class="p-3">Label</th>
                <th class="p-3">Preview Badge</th>
                <th class="p-3">Deskripsi / SLA Level</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="p in prioritiesList" :key="p.id" class="hover:bg-muted/70 transition-colors">
                <td class="p-3 font-mono font-bold text-primary">{{ p.id }}</td>
                <td class="p-3 font-bold text-foreground">{{ p.label }}</td>
                <td class="p-3">
                  <span :class="['px-2 py-0.5 rounded text-xs font-bold uppercase', getTicketPriorityBadgeClass(p.id)]">
                    {{ getTicketPriorityLabel(p.id) }}
                  </span>
                </td>
                <td class="p-3 text-muted-foreground">{{ p.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: USERS & ROLE SIMULATOR -->
      <div v-if="activeTab === 'USERS'" class="p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-foreground">Daftar Akun Pengguna & Simulasi Multi-Role</h3>
            <p class="text-[11px] text-muted-foreground">
              Kelola akun dan uji coba sistem menggunakan persona role berbeda untuk memverifikasi hak akses.
            </p>
          </div>
          <button
            @click="openAddUserModal"
            class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah User Baru</span>
          </button>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                <th class="p-3">User</th>
                <th class="p-3">Email Perusahaan</th>
                <th class="p-3">Departemen</th>
                <th class="p-3">Role Hak Akses</th>
                <th class="p-3 text-center">Status Login</th>
                <th class="p-3 text-right">Aksi Simulasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="u in store.allUsers"
                :key="u.id"
                class="hover:bg-muted/70 transition-colors"
                :class="store.currentUser?.id === u.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''"
              >
                <td class="p-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs">
                      {{ u.name.charAt(0) }}
                    </div>
                    <div>
                      <span class="font-bold text-foreground block">{{ u.name }}</span>
                      <span class="text-[10px] text-muted-foreground font-mono">{{ u.id }}</span>
                    </div>
                  </div>
                </td>
                <td class="p-3 font-mono text-muted-foreground">{{ u.email }}</td>
                <td class="p-3 text-foreground">{{ u.department }}</td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      u.role === 'SYSTEM_ADMIN' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                      u.role === 'IT_WORKER' ? 'bg-primary/5 text-primary dark:bg-blue-950 dark:text-blue-300' :
                      'bg-muted text-foreground'
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
                  <span v-else class="text-[10px] text-muted-foreground">
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
                  <span v-else class="text-xs text-muted-foreground">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL ADD / EDIT CATEGORY -->
    <Teleport to="body">
      <div v-if="isCategoryModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingCatId ? 'Edit Kategori Induk' : 'Tambah Kategori Induk Baru' }}
          </h3>
          <form @submit.prevent="saveCategoryForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID Kategori</label>
              <input v-model="catForm.id" required :disabled="!!editingCatId" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-mono" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Kategori</label>
              <input v-model="catForm.name" required placeholder="Cth: Support IT / IT Programmer" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isCategoryModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-primary text-white rounded-xl font-bold">Simpan Kategori</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT SUBCATEGORY (INDIVIDU RECORD) -->
    <Teleport to="body">
      <div v-if="isSubcategoryModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingSubId ? 'Edit Record Aplikasi/Project' : 'Tambah Record Aplikasi/Project Baru' }}
          </h3>
          <form @submit.prevent="saveSubcategoryForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID Aplikasi/Project</label>
              <input v-model="subForm.id" required :disabled="!!editingSubId" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-mono" />
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
              <label class="block font-bold text-foreground mb-1">Nama Aplikasi/Project</label>
              <input v-model="subForm.name" required placeholder="Cth: Maintenance ERP Web / Printer" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-medium" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isSubcategoryModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan Record</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT SUB MODULE (INDIVIDU RECORD) -->
    <Teleport to="body">
      <div v-if="isSubmoduleModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingSmId ? 'Edit Record Sub Modul' : 'Tambah Record Sub Modul Baru' }}
          </h3>
          <form @submit.prevent="saveSubmoduleForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID Sub Modul</label>
              <input v-model="smForm.id" required :disabled="!!editingSmId" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-mono" />
            </div>
            <div>
              <AppSelect
                v-model="smForm.subcategory_id"
                :options="subcategoryFormOptions"
                label="Pilih Aplikasi/Project Induk (FK: subcategory_id)"
                placeholder="-- Pilih Aplikasi/Project --"
              />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Sub Modul</label>
              <input v-model="smForm.name" required placeholder="Cth: Modul Payroll / Modul Printer" class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-medium" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isSubmoduleModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">Simpan Record</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD USER -->
    <Teleport to="body">
      <div v-if="isUserModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">Tambah Pengguna Baru</h3>
          <form @submit.prevent="saveUserForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID User</label>
              <input v-model="userForm.id" required class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs font-mono" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Lengkap</label>
              <input v-model="userForm.name" required class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Email</label>
              <input v-model="userForm.email" type="email" required class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Departemen</label>
              <input v-model="userForm.department" required class="w-full px-3 py-2 rounded-xl border border-input bg-surface text-xs" />
            </div>
            <div>
              <AppSelect
                v-model="userForm.role"
                :options="roleFormOptions"
                label="Role"
              />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isUserModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-primary text-white rounded-xl font-bold">Simpan</button>
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
  Layers,
  AlertCircle,
  Users,
  Plus,
} from 'lucide-vue-next';
import type { CategoryItem, SubcategoryItem, SubmoduleItem, UserRole } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import AppSelect from '~/components/common/AppSelect.vue';

const store = useAppStore();
const { confirm: doConfirm } = useConfirmModal();

const activeTab = ref<'CATEGORIES' | 'PRIORITIES' | 'USERS'>('CATEGORIES');
const selectedCategoryFilter = ref('ALL');
const selectedSubcategoryFilter = ref('ALL');
const subcategorySearch = ref('');
const submoduleSearch = ref('');

const categoryFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Kategori (${store.subcategories.length} record)` },
  ...store.categories.map(c => ({ value: c.id, label: `[${c.id}] ${c.name}` }))
]);

const subcategoryFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Aplikasi/Project (${store.submodules.length} record)` },
  ...store.subcategories.map(s => ({ value: s.id, label: `[${s.id}] ${s.name}` }))
]);

const categoryFormOptions = computed(() => store.categories.map(c => ({
  value: c.id,
  label: `[${c.id}] ${c.name}`
})));

const subcategoryFormOptions = computed(() => store.subcategories.map(s => ({
  value: s.id,
  label: `[${s.id}] ${s.name}`
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

// Modals: Submodule
const isSubmoduleModalOpen = ref(false);
const editingSmId = ref<string | null>(null);
const smForm = ref({ id: '', subcategory_id: '', name: '' });

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

const saveCategoryForm = async () => {
  const payload: CategoryItem = {
    id: catForm.value.id,
    name: catForm.value.name,
  };
  if (editingCatId.value) {
    await store.updateCategory(payload);
  } else {
    await store.addCategory(payload);
  }
  isCategoryModalOpen.value = false;
};

const deleteCategory = async (id: string) => {
  const ok = await doConfirm('Hapus Kategori', `Hapus kategori ${id}? Semua Aplikasi/Project & Sub Modul terkait juga akan terhapus.`);
  if (ok) {
    await store.deleteCategory(id);
  }
};

const getSubcategoriesCount = (catId: string) => {
  return store.subcategories.filter(s => s.category_id === catId).length;
};

const getCategoryName = (catId: string) => {
  const found = store.categories.find(c => c.id === catId);
  return found ? found.name : catId;
};

const getSubcategoryName = (subId: string) => {
  const found = store.subcategories.find(s => s.id === subId);
  return found ? found.name : subId;
};

const getSubmodulesCount = (subId: string) => {
  return store.submodules.filter(m => m.subcategory_id === subId).length;
};

const filteredSubcategories = computed(() => {
  let result = selectedCategoryFilter.value === 'ALL'
    ? store.subcategories
    : store.subcategories.filter(s => s.category_id === selectedCategoryFilter.value);
  
  if (subcategorySearch.value.trim()) {
    const q = subcategorySearch.value.trim().toLowerCase();
    result = result.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q)
    );
  }
  return result;
});

const filteredSubmodules = computed(() => {
  let result = selectedSubcategoryFilter.value === 'ALL'
    ? store.submodules
    : store.submodules.filter(m => m.subcategory_id === selectedSubcategoryFilter.value);
  
  if (submoduleSearch.value.trim()) {
    const q = submoduleSearch.value.trim().toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.id.toLowerCase().includes(q)
    );
  }
  return result;
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

const saveSubcategoryForm = async () => {
  const payload: SubcategoryItem = {
    id: subForm.value.id,
    category_id: subForm.value.category_id,
    name: subForm.value.name.trim(),
  };
  if (editingSubId.value) {
    await store.updateSubcategory(payload);
  } else {
    await store.addSubcategory(payload);
  }
  isSubcategoryModalOpen.value = false;
};

const deleteSubcategory = async (id: string) => {
  const ok = await doConfirm('Hapus Aplikasi/Project', `Hapus Aplikasi/Project ${id}? Semua Sub Modul terkait juga akan terhapus.`);
  if (ok) {
    await store.deleteSubcategory(id);
  }
};

// Submodule methods
const openAddSubmoduleModal = () => {
  editingSmId.value = null;
  const nextNum = store.submodules.length + 1;
  const defaultSubId = selectedSubcategoryFilter.value !== 'ALL'
    ? selectedSubcategoryFilter.value
    : (store.subcategories[0]?.id || '');
  smForm.value = {
    id: `SMOD-${String(nextNum).padStart(3, '0')}`,
    subcategory_id: defaultSubId,
    name: '',
  };
  isSubmoduleModalOpen.value = true;
};

const editSubmodule = (mod: SubmoduleItem) => {
  editingSmId.value = mod.id;
  smForm.value = { ...mod };
  isSubmoduleModalOpen.value = true;
};

const saveSubmoduleForm = async () => {
  const payload: SubmoduleItem = {
    id: smForm.value.id,
    subcategory_id: smForm.value.subcategory_id,
    name: smForm.value.name.trim(),
  };
  if (editingSmId.value) {
    await store.updateSubmodule(payload);
  } else {
    await store.addSubmodule(payload);
  }
  isSubmoduleModalOpen.value = false;
};

const deleteSubmodule = async (id: string) => {
  const ok = await doConfirm('Hapus Sub Modul', `Hapus Sub Modul ${id}?`);
  if (ok) {
    await store.deleteSubmodule(id);
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

const saveUserForm = async () => {
  await store.addUser({ ...userForm.value });
  isUserModalOpen.value = false;
};
</script>
