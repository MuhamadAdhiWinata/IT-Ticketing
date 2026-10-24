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
          Kelola master kategori, Project/Kendala &amp; Sub Modul layanan IT terpisah, prioritas tiket, serta akun pengguna sistem.
        </p>
      </div>

      <!-- User Info -->
      <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-muted">
        <div class="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
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
          <span>Kategori & Project/Kendala ({{ store.categories.length }} Kategori, {{ store.projectKendala.length }} Project/Kendala)</span>
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
          @click="activeTab = 'ORG'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          :class="activeTab === 'ORG' ? 'bg-surface text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'"
        >
          <Building2 class="w-4 h-4" />
          <span>Perusahaan & Divisi ({{ store.companies.length }} / {{ store.divisions.length }})</span>
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
              class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
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
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div class="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
                <span>Total {{ getProjectKendalaLabel(cat.name) }} Terhubung:</span>
                <span class="font-mono font-bold text-foreground px-2 py-0.5 bg-surface rounded border border-border">
                  {{ getProjectKendalaCount(cat.id) }} {{ getProjectKendalaLabel(cat.name) }}
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
                <span>Tabel Master Project/Kendala (Relational DB Records)</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">
                Setiap baris adalah record Project/Kendala terpisah yang terhubung via Foreign Key <code class="font-mono text-primary">category_id</code>
              </p>
            </div>
            <button
              @click="openAddProjectKendalaModal"
              class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Project/Kendala Baru</span>
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
                v-model="projectKendalaSearch"
                type="text"
                placeholder="Cari nama/ID Project/Kendala..."
                class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs"
              />
            </div>
          </div>

          <!-- ProjectKendala Table -->
          <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <th class="p-3">ID Project/Kendala</th>
                  <th class="p-3">Kategori Induk (FK: category_id)</th>
                  <th class="p-3">Nama Project/Kendala</th>
                  <th class="p-3">Total Sub Modul</th>
                  <th class="p-3 text-right">Aksi Record</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="sub in filteredProjectKendala"
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
                    <button @click="editProjectKendala(sub)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                    <button @click="deleteProjectKendala(sub.id)" class="text-rose-700 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                  </td>
                </tr>
                <tr v-if="filteredProjectKendala.length === 0">
                  <td colspan="5" class="p-8 text-center text-muted-foreground text-xs">
                    {{ selectedCategoryFilter === 'ALL' && !projectKendalaSearch
                      ? 'Belum ada data Project/Kendala. Klik "Tambah Project/Kendala Baru" untuk menambah.'
                      : `Tidak ditemukan Project/Kendala${projectKendalaSearch ? ` untuk "${projectKendalaSearch}"` : ''}${selectedCategoryFilter !== 'ALL' ? ' pada kategori ini' : ''}.` }}
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
                Setiap baris adalah record Sub Modul yang terhubung via Foreign Key <code class="font-mono text-primary">project_kendala_id</code>
              </p>
            </div>
            <button
              @click="openAddSubmoduleModal"
              class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Sub Modul Baru</span>
            </button>
          </div>

          <!-- Filter Project/Kendala Induk + Search -->
          <div class="flex items-center gap-2 bg-muted p-3 rounded-xl border border-border text-xs">
            <span class="font-bold text-foreground shrink-0">Filter Project/Kendala:</span>
            <div class="min-w-[200px] flex-1">
              <AppSelect
                v-model="selectedProjectKendalaFilter"
                :options="projectKendalaFilterOptions"
                size="sm"
                searchable
                searchPlaceholder="Cari Project/Kendala..."
              />
            </div>
            <div class="min-w-[200px] flex-1">
              <input
                v-model="submoduleSearch"
                type="text"
                placeholder="Cari nama/ID Sub Modul..."
                class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs"
              />
            </div>
          </div>

          <!-- Submodules Table -->
          <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                  <th class="p-3">ID Sub Modul</th>
                  <th class="p-3">Project/Kendala (FK: project_kendala_id)</th>
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
                      {{ getProjectKendalaName(mod.project_kendala_id) }} ({{ mod.project_kendala_id }})
                    </span>
                  </td>
                  <td class="p-3 font-bold text-foreground">{{ mod.name }}</td>
                  <td class="p-3 text-right space-x-2">
                    <button @click="editSubmodule(mod)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                    <button @click="deleteSubmodule(mod.id)" class="text-rose-700 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                  </td>
                </tr>
                <tr v-if="filteredSubmodules.length === 0">
                  <td colspan="4" class="p-8 text-center text-muted-foreground text-xs">
                    {{ selectedProjectKendalaFilter === 'ALL' && !submoduleSearch
                      ? 'Belum ada data Sub Modul. Klik "Tambah Sub Modul Baru" untuk menambah.'
                      : `Tidak ditemukan Sub Modul${submoduleSearch ? ` untuk "${submoduleSearch}"` : ''}${selectedProjectKendalaFilter !== 'ALL' ? ' pada Project/Kendala ini' : ''}.` }}
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

      <!-- TAB: PERUSAHAAN & DIVISI -->
      <div v-if="activeTab === 'ORG'" class="p-5 sm:p-6 space-y-8">
        <!-- MASTER PERUSAHAAN -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 class="w-4 h-4 text-primary" />
                <span>Tabel Master Perusahaan / PT</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">Daftar entitas perusahaan. Setiap Divisi melekat pada satu Perusahaan.</p>
            </div>
            <button
              @click="openAddCompanyModal"
              class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Perusahaan</span>
            </button>
          </div>

          <div v-if="store.companies.length === 0" class="p-8 text-center rounded-xl border border-dashed border-border bg-muted/40 space-y-1">
            <p class="text-xs font-bold text-foreground">Belum ada data perusahaan</p>
            <p class="text-[11px] text-muted-foreground">Tambahkan PT / Perusahaan agar identitas pelapor dapat dipilih pada form akun dan tiket.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="c in store.companies"
              :key="c.id"
              class="p-4 rounded-xl border border-border bg-muted space-y-3 shadow-xs"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 class="w-5 h-5 text-primary" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/15 shrink-0">
                        {{ c.id }}
                      </span>
                      <span class="font-bold text-sm text-foreground truncate">{{ c.name }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    @click="editCompany(c)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteCompany(c)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div class="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
                <span>Total Divisi Terhubung:</span>
                <span class="font-mono font-bold text-foreground px-2 py-0.5 bg-surface rounded border border-border">
                  {{ getDivisionsCount(c.id) }} Divisi
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-border" />

        <!-- MASTER DIVISI -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tabel Master Divisi (FK: company_id)</span>
              </h3>
              <p class="text-[11px] text-muted-foreground">Divisi akan muncul pada label identitas pelapor, misal: "PT IONS - Divisi Finance".</p>
            </div>
            <button
              @click="openAddDivisionModal"
              :disabled="store.companies.length === 0"
              :title="store.companies.length === 0 ? 'Tambahkan perusahaan terlebih dahulu' : undefined"
              class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus class="w-4 h-4" />
              <span>Tambah Divisi</span>
            </button>
          </div>

          <div v-if="store.companies.length === 0" class="p-8 text-center rounded-xl border border-dashed border-border bg-muted/40 space-y-1">
            <p class="text-xs font-bold text-foreground">Belum ada perusahaan</p>
            <p class="text-[11px] text-muted-foreground">Divisi memerlukan induk perusahaan. Tambahkan Perusahaan di atas terlebih dahulu.</p>
          </div>

          <div v-else-if="store.divisions.length === 0" class="p-8 text-center rounded-xl border border-dashed border-border bg-muted/40 space-y-1">
            <p class="text-xs font-bold text-foreground">Belum ada data divisi</p>
            <p class="text-[11px] text-muted-foreground">Tambahkan divisi (misal: Finance, HR, Produksi) agar dapat dipilih pada form akun.</p>
          </div>

          <template v-else>
            <!-- Filter Perusahaan Induk -->
            <div class="flex items-center gap-2 bg-muted p-3 rounded-xl border border-border text-xs">
              <span class="font-bold text-foreground shrink-0">Filter Perusahaan:</span>
              <div class="min-w-[200px] flex-1">
                <AppSelect
                  v-model="selectedDivisionCompanyFilter"
                  :options="divisionCompanyFilterOptions"
                  size="sm"
                  searchable
                  searchPlaceholder="Cari perusahaan..."
                />
              </div>
            </div>

            <div class="overflow-x-auto custom-scrollbar border border-border rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-muted border-b border-border text-[11px] font-bold uppercase text-muted-foreground">
                    <th class="p-3">ID Divisi</th>
                    <th class="p-3">Perusahaan (FK: company_id)</th>
                    <th class="p-3">Nama Divisi</th>
                    <th class="p-3 text-right">Aksi Record</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="d in filteredDivisions" :key="d.id" class="hover:bg-muted/70 transition-colors">
                    <td class="p-3 font-mono font-bold text-primary">{{ d.id }}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary border border-primary/15 font-mono">
                        {{ getCompanyName(d.company_id) }}
                      </span>
                    </td>
                    <td class="p-3 font-bold text-foreground">{{ d.name }}</td>
                    <td class="p-3 text-right space-x-2">
                      <button @click="editDivision(d)" class="text-blue-600 dark:text-blue-400 hover:underline font-bold">Edit</button>
                      <button @click="deleteDivision(d)" class="text-rose-700 dark:text-rose-400 hover:underline font-bold">Hapus</button>
                    </td>
                  </tr>
                  <tr v-if="filteredDivisions.length === 0">
                    <td colspan="4" class="p-8 text-center text-muted-foreground text-xs">
                      Tidak ditemukan divisi pada perusahaan ini.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
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
            class="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
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
                <th class="p-3">Perusahaan</th>
                <th class="p-3">Divisi / Departemen</th>
                <th class="p-3">Role Hak Akses</th>
                <th class="p-3 text-center">Status Login</th>
                <th class="p-3 text-right">Aksi</th>
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
                <td class="p-3">
                  <span v-if="u.companyName" class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary border border-primary/15">
                    {{ u.companyName }}
                  </span>
                  <span v-else class="text-[10px] text-muted-foreground italic">Belum diisi</span>
                </td>
                <td class="p-3">
                  <div v-if="u.divisionName" class="font-bold text-foreground">{{ u.divisionName }}</div>
                  <div v-else class="text-[10px] text-muted-foreground italic">Belum diisi</div>
                  <div class="text-[10px] text-muted-foreground">{{ u.department }}</div>
                </td>
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
                  <span v-else class="text-[10px] text-muted-foreground">Offline</span>
                </td>
                <td class="p-3 text-right">
                  <button
                    @click="editUser(u)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
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
              <input v-model="catForm.id" required :disabled="!!editingCatId" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Kategori</label>
              <input v-model="catForm.name" required placeholder="Cth: Support IT / IT Programmer" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isCategoryModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold">Simpan Kategori</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT SUBCATEGORY (INDIVIDU RECORD) -->
    <Teleport to="body">
      <div v-if="isProjectKendalaModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingSubId ? `Edit Record ${projectKendalaModalLabel}` : `Tambah Record ${projectKendalaModalLabel} Baru` }}
          </h3>
          <form @submit.prevent="saveProjectKendalaForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID {{ projectKendalaModalLabel }}</label>
              <input v-model="subForm.id" required :disabled="!!editingSubId" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono" />
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
              <label class="block font-bold text-foreground mb-1">Nama {{ projectKendalaModalLabel }}</label>
              <input v-model="subForm.name" required placeholder="Cth: Maintenance ERP Web / Printer" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isProjectKendalaModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold">Simpan Record</button>
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
              <input v-model="smForm.id" required :disabled="!!editingSmId" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono" />
            </div>
            <div>
              <AppSelect
                v-model="smForm.project_kendala_id"
                :options="projectKendalaFormOptions"
                label="Pilih Project/Kendala Induk (FK: project_kendala_id)"
                placeholder="-- Pilih Project/Kendala --"
              />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Sub Modul</label>
              <input v-model="smForm.name" required placeholder="Cth: Modul Payroll / Modul Printer" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isSubmoduleModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold">Simpan Record</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT USER -->
    <Teleport to="body">
      <div v-if="isUserModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <h3 class="text-base font-bold text-foreground">{{ editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}</h3>
          <form @submit.prevent="saveUserForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID User</label>
              <input v-model="userForm.id" required :disabled="!!editingUserId" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono disabled:opacity-60" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Lengkap</label>
              <input v-model="userForm.name" required class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Email</label>
              <input v-model="userForm.email" type="email" required class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs" />
            </div>

            <div v-if="store.companies.length === 0" class="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <p class="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                Belum ada master Perusahaan. Tambahkan pada tab <strong>Perusahaan &amp; Divisi</strong> agar kolom identitas ini dapat dipilih. Sementara itu isi Departemen secara manual.
              </p>
            </div>

            <div>
              <AppSelect
                v-model="userForm.companyId"
                :options="companyFormOptions"
                label="Perusahaan / PT"
                placeholder="-- Pilih Perusahaan --"
                size="sm"
                searchable
                search-placeholder="Cari perusahaan..."
              />
            </div>

            <div>
              <AppSelect
                v-model="userForm.divisionId"
                :options="divisionFormOptions"
                label="Divisi"
                placeholder="-- Pilih Divisi --"
                :disabled="!userForm.companyId"
                size="sm"
              />
              <p v-if="!userForm.companyId" class="text-[10px] text-muted-foreground mt-1">
                Pilih perusahaan terlebih dahulu untuk melihat daftar divisi.
              </p>
            </div>

            <div>
              <label class="block font-bold text-foreground mb-1">Departemen</label>
              <input
                v-model="userForm.department"
                required
                :placeholder="userForm.divisionId ? 'Terisi otomatis dari divisi' : 'Cth: Finance & Accounting'"
                class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs"
              />
              <p class="text-[10px] text-muted-foreground mt-1">Otomatis mengikuti nama divisi bila divisi dipilih.</p>
            </div>

            <div>
              <AppSelect
                v-model="userForm.role"
                :options="roleFormOptions"
                label="Role"
              />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="closeUserModal" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" :disabled="isSavingUser" class="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-60">
                {{ isSavingUser ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT PERUSAHAAN -->
    <Teleport to="body">
      <div v-if="isCompanyModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingCompanyId ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru' }}
          </h3>
          <form @submit.prevent="saveCompanyForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID Perusahaan</label>
              <input v-model="companyForm.id" required :disabled="!!editingCompanyId" placeholder="Cth: COMP-IONS" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono disabled:opacity-60" />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Perusahaan / PT</label>
              <input v-model="companyForm.name" required placeholder="Cth: PT IONS" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isCompanyModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL ADD / EDIT DIVISI -->
    <Teleport to="body">
      <div v-if="isDivisionModalOpen" class="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-modal flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg border border-border p-6 max-w-md w-full shadow-lg space-y-4">
          <h3 class="text-base font-bold text-foreground">
            {{ editingDivisionId ? 'Edit Divisi' : 'Tambah Divisi Baru' }}
          </h3>
          <form @submit.prevent="saveDivisionForm" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-foreground mb-1">ID Divisi</label>
              <input v-model="divisionForm.id" required :disabled="!!editingDivisionId" placeholder="Cth: DIV-FIN" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs font-mono disabled:opacity-60" />
            </div>
            <div>
              <AppSelect
                v-model="divisionForm.company_id"
                :options="companyFormOptions"
                label="Perusahaan Induk (FK: company_id)"
                placeholder="-- Pilih Perusahaan --"
              />
            </div>
            <div>
              <label class="block font-bold text-foreground mb-1">Nama Divisi</label>
              <input v-model="divisionForm.name" required placeholder="Cth: Finance" class="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs" />
            </div>
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" @click="isDivisionModalOpen = false" class="px-3 py-1.5 bg-muted rounded-xl font-bold">Batal</button>
              <button type="submit" class="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '~/stores/app';
import {
  Settings,
  FolderTree,
  Tag,
  Layers,
  AlertCircle,
  Users,
  Plus,
  Building2,
} from 'lucide-vue-next';
import type { CategoryItem, ProjectKendalaItem, SubmoduleItem, CompanyItem, DivisionItem, AppUser, UserRole } from '~/types';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass, getProjectKendalaLabel } from '~/utils/ticketHelpers';
import { nextId } from '~/utils/id';
import { useToast } from '~/composables/useToast';
import AppSelect from '~/components/common/AppSelect.vue';

const store = useAppStore();
const { confirm: doConfirm, state: confirmState } = useConfirmModal();
const { toast } = useToast();

const activeTab = ref<'CATEGORIES' | 'PRIORITIES' | 'ORG' | 'USERS'>('CATEGORIES');
const selectedCategoryFilter = ref('ALL');
const selectedProjectKendalaFilter = ref('ALL');
const selectedDivisionCompanyFilter = ref('ALL');
const projectKendalaSearch = ref('');
const submoduleSearch = ref('');

const categoryFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Kategori (${store.projectKendala.length} record)` },
  ...store.categories.map(c => ({ value: c.id, label: `[${c.id}] ${c.name}` }))
]);

const projectKendalaFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Project/Kendala (${store.submodules.length} record)` },
  ...store.projectKendala.map(s => ({ value: s.id, label: `[${s.id}] ${s.name}` }))
]);

const categoryFormOptions = computed(() => store.categories.map(c => ({
  value: c.id,
  label: `[${c.id}] ${c.name}`
})));

const projectKendalaFormOptions = computed(() => store.projectKendala.map(s => ({
  value: s.id,
  label: `[${s.id}] ${s.name}`
})));

const roleFormOptions = [
  { value: 'USER_NON_IT', label: 'USER_NON_IT' },
  { value: 'IT_WORKER', label: 'IT_WORKER' },
  { value: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN' },
];

// ── Opsi dropdown Perusahaan & Divisi ──
const companyFormOptions = computed(() => store.companies.map(c => ({
  value: c.id,
  label: `[${c.id}] ${c.name}`,
})));

const divisionCompanyFilterOptions = computed(() => [
  { value: 'ALL', label: `Semua Perusahaan (${store.divisions.length} record)` },
  ...store.companies.map(c => ({ value: c.id, label: `[${c.id}] ${c.name}` }))
]);
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

// Modals: ProjectKendala
const isProjectKendalaModalOpen = ref(false);
const editingSubId = ref<string | null>(null);
const subForm = ref({ id: '', category_id: '', name: '' });

// Modals: Submodule
const isSubmoduleModalOpen = ref(false);
const editingSmId = ref<string | null>(null);
const smForm = ref({ id: '', project_kendala_id: '', name: '' });

// Modals: User
const isUserModalOpen = ref(false);
const editingUserId = ref<string | null>(null);
const isSavingUser = ref(false);
const userForm = ref<{ id: string; name: string; email: string; department: string; companyId: string; divisionId: string; role: UserRole }>({
  id: '',
  name: '',
  email: '',
  department: '',
  companyId: '',
  divisionId: '',
  role: 'USER_NON_IT',
});

// Divisi tersaring mengikuti perusahaan yang dipilih pada form user.
const divisionFormOptions = computed(() => {
  if (!userForm.value.companyId) return [];
  return store.divisions
    .filter(d => d.company_id === userForm.value.companyId)
    .map(d => ({ value: d.id, label: `[${d.id}] ${d.name}` }));
});

// Ganti perusahaan: buang divisi yang bukan miliknya, lalu isi departemen otomatis.
watch(() => userForm.value.companyId, () => {
  const selectedDivision = store.divisions.find(d => d.id === userForm.value.divisionId);
  if (selectedDivision && selectedDivision.company_id !== userForm.value.companyId) {
    userForm.value.divisionId = '';
  }
  syncDepartmentFromDivision();
});

// Pilih divisi: departemen mengikuti nama divisi agar label lama tetap terisi.
watch(() => userForm.value.divisionId, syncDepartmentFromDivision);

function syncDepartmentFromDivision() {
  const division = store.divisions.find(d => d.id === userForm.value.divisionId);
  if (division) userForm.value.department = division.name;
}

// Modals: Perusahaan
const isCompanyModalOpen = ref(false);
const editingCompanyId = ref<string | null>(null);
const companyForm = ref({ id: '', name: '' });

// Modals: Divisi
const isDivisionModalOpen = ref(false);
const editingDivisionId = ref<string | null>(null);
const divisionForm = ref({ id: '', company_id: '', name: '' });

// Category methods
const openAddCategoryModal = () => {
  editingCatId.value = null;
  catForm.value = { id: nextId(store.categories, 'CAT'), name: '' };
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
  const itemLabel = getProjectKendalaLabel(getCategoryName(id));
  const ok = await doConfirm('Hapus Kategori', `Hapus kategori ${id}? Semua ${itemLabel} & Sub Modul terkait juga akan terhapus.`);
  if (ok) {
    await store.deleteCategory(id);
  }
};

const getProjectKendalaCount = (catId: string) => {
  return store.projectKendala.filter(s => s.category_id === catId).length;
};

const getCategoryName = (catId: string) => {
  const found = store.categories.find(c => c.id === catId);
  return found ? found.name : catId;
};

// Nama benda untuk isi modal Project/Kendala, mengikuti kategori induk yang
// sedang dipilih di form. Masih kosong saat modal baru dibuka (sebelum kategori
// terpilih) dan nama kategori tak dikenal — keduanya jatuh ke label gabungan.
const projectKendalaModalLabel = computed(() =>
  getProjectKendalaLabel(getCategoryName(subForm.value.category_id))
);

const getProjectKendalaName = (subId: string) => {
  const found = store.projectKendala.find(s => s.id === subId);
  return found ? found.name : subId;
};

const getSubmodulesCount = (subId: string) => {
  return store.submodules.filter(m => m.project_kendala_id === subId).length;
};

const filteredProjectKendala = computed(() => {
  let result = selectedCategoryFilter.value === 'ALL'
    ? store.projectKendala
    : store.projectKendala.filter(s => s.category_id === selectedCategoryFilter.value);
  
  if (projectKendalaSearch.value.trim()) {
    const q = projectKendalaSearch.value.trim().toLowerCase();
    result = result.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q)
    );
  }
  return result;
});

const filteredSubmodules = computed(() => {
  let result = selectedProjectKendalaFilter.value === 'ALL'
    ? store.submodules
    : store.submodules.filter(m => m.project_kendala_id === selectedProjectKendalaFilter.value);
  
  if (submoduleSearch.value.trim()) {
    const q = submoduleSearch.value.trim().toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.id.toLowerCase().includes(q)
    );
  }
  return result;
});

// ProjectKendala methods
const openAddProjectKendalaModal = () => {
  editingSubId.value = null;
  const defaultCatId = store.categories[0]?.id || 'CAT-01';
  subForm.value = {
    id: nextId(store.projectKendala, 'SUB'),
    category_id: selectedCategoryFilter.value !== 'ALL' ? selectedCategoryFilter.value : defaultCatId,
    name: '',
  };
  isProjectKendalaModalOpen.value = true;
};

const editProjectKendala = (sub: ProjectKendalaItem) => {
  editingSubId.value = sub.id;
  subForm.value = { ...sub };
  isProjectKendalaModalOpen.value = true;
};

const saveProjectKendalaForm = async () => {
  const payload: ProjectKendalaItem = {
    id: subForm.value.id,
    category_id: subForm.value.category_id,
    name: subForm.value.name.trim(),
  };
  if (editingSubId.value) {
    await store.updateProjectKendala(payload);
  } else {
    await store.addProjectKendala(payload);
  }
  isProjectKendalaModalOpen.value = false;
};

const deleteProjectKendala = async (id: string) => {
  const ok = await doConfirm('Hapus Project/Kendala', `Hapus Project/Kendala ${id}? Semua Sub Modul terkait juga akan terhapus.`);
  if (ok) {
    await store.deleteProjectKendala(id);
  }
};

// Submodule methods
const openAddSubmoduleModal = () => {
  editingSmId.value = null;
  const defaultSubId = selectedProjectKendalaFilter.value !== 'ALL'
    ? selectedProjectKendalaFilter.value
    : (store.projectKendala[0]?.id || '');
  smForm.value = {
    id: nextId(store.submodules, 'SMOD'),
    project_kendala_id: defaultSubId,
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
    project_kendala_id: smForm.value.project_kendala_id,
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
  editingUserId.value = null;
  userForm.value = {
    id: nextId(store.allUsers, 'USR'),
    name: '',
    email: '',
    department: '',
    companyId: '',
    divisionId: '',
    role: 'USER_NON_IT',
  };
  isUserModalOpen.value = true;
};

const editUser = (u: AppUser) => {
  editingUserId.value = u.id;
  userForm.value = {
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    companyId: u.companyId ?? '',
    divisionId: u.divisionId ?? '',
    role: u.role,
  };
  isUserModalOpen.value = true;
};

const closeUserModal = () => {
  isUserModalOpen.value = false;
  editingUserId.value = null;
};

const saveUserForm = async () => {
  const payload = {
    ...userForm.value,
    companyId: userForm.value.companyId || null,
    divisionId: userForm.value.divisionId || null,
  };
  isSavingUser.value = true;
  try {
    if (editingUserId.value) {
      await store.updateUser(editingUserId.value, payload);
      toast('Data pengguna berhasil diperbarui.', 'success');
    } else {
      await store.addUser(payload as AppUser);
      toast('Pengguna baru berhasil ditambahkan.', 'success');
    }
    closeUserModal();
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menyimpan pengguna.', 'error', 5000);
  } finally {
    isSavingUser.value = false;
  }
};

// Company methods
const openAddCompanyModal = () => {
  editingCompanyId.value = null;
  companyForm.value = { id: nextId(store.companies, 'COMP'), name: '' };
  isCompanyModalOpen.value = true;
};

const editCompany = (c: CompanyItem) => {
  editingCompanyId.value = c.id;
  companyForm.value = { id: c.id, name: c.name };
  isCompanyModalOpen.value = true;
};

const saveCompanyForm = async () => {
  const payload: CompanyItem = {
    id: companyForm.value.id.trim(),
    name: companyForm.value.name.trim(),
  };
  try {
    if (editingCompanyId.value) {
      await store.updateCompany(payload);
      toast('Perusahaan berhasil diperbarui.', 'success');
    } else {
      await store.addCompany(payload);
      toast('Perusahaan berhasil ditambahkan.', 'success');
    }
    isCompanyModalOpen.value = false;
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menyimpan perusahaan.', 'error', 5000);
  }
};

const deleteCompany = async (c: CompanyItem) => {
  const divisionCount = getDivisionsCount(c.id);
  const detail = divisionCount > 0
    ? `${divisionCount} divisi beserta hubungannya akan ikut terhapus, dan identitas perusahaan pada user terkait dikosongkan.`
    : 'Identitas perusahaan pada user terkait akan dikosongkan.';
  const ok = await doConfirm('Hapus Perusahaan', `Hapus ${c.name} (${c.id})? ${detail}`);
  if (!ok) return;
  try {
    await store.deleteCompany(c.id);
    toast('Perusahaan berhasil dihapus.', 'success');
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menghapus perusahaan.', 'error', 5000);
  }
};

// Division methods
const getDivisionsCount = (companyId: string) =>
  store.divisions.filter(d => d.company_id === companyId).length;

const getCompanyName = (companyId: string) =>
  store.companies.find(c => c.id === companyId)?.name || companyId;

const filteredDivisions = computed(() => {
  if (selectedDivisionCompanyFilter.value === 'ALL') return store.divisions;
  return store.divisions.filter(d => d.company_id === selectedDivisionCompanyFilter.value);
});

const openAddDivisionModal = () => {
  editingDivisionId.value = null;
  divisionForm.value = {
    id: nextId(store.divisions, 'DIV'),
    company_id: selectedDivisionCompanyFilter.value !== 'ALL'
      ? selectedDivisionCompanyFilter.value
      : (store.companies[0]?.id || ''),
    name: '',
  };
  isDivisionModalOpen.value = true;
};

const editDivision = (d: DivisionItem) => {
  editingDivisionId.value = d.id;
  divisionForm.value = { ...d };
  isDivisionModalOpen.value = true;
};

const saveDivisionForm = async () => {
  const payload: DivisionItem = {
    id: divisionForm.value.id.trim(),
    company_id: divisionForm.value.company_id,
    name: divisionForm.value.name.trim(),
  };
  try {
    if (editingDivisionId.value) {
      await store.updateDivision(payload);
      toast('Divisi berhasil diperbarui.', 'success');
    } else {
      await store.addDivision(payload);
      toast('Divisi berhasil ditambahkan.', 'success');
    }
    isDivisionModalOpen.value = false;
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menyimpan divisi.', 'error', 5000);
  }
};

const deleteDivision = async (d: DivisionItem) => {
  const ok = await doConfirm('Hapus Divisi', `Hapus divisi ${d.name} (${d.id})? Identitas divisi pada user terkait akan dikosongkan.`);
  if (!ok) return;
  try {
    await store.deleteDivision(d.id);
    toast('Divisi berhasil dihapus.', 'success');
  } catch (e: any) {
    toast(e?.data?.statusMessage || e?.message || 'Gagal menghapus divisi.', 'error', 5000);
  }
};

// R-32: modal harus bisa ditutup dengan Escape.
// Kalau dialog konfirmasi sedang di atas, biarkan ia yang menerima Escape.
function closeOpenModal(): boolean {
  if (isUserModalOpen.value) { closeUserModal(); return true; }
  if (isCompanyModalOpen.value) { isCompanyModalOpen.value = false; return true; }
  if (isDivisionModalOpen.value) { isDivisionModalOpen.value = false; return true; }
  if (isSubmoduleModalOpen.value) { isSubmoduleModalOpen.value = false; return true; }
  if (isProjectKendalaModalOpen.value) { isProjectKendalaModalOpen.value = false; return true; }
  if (isCategoryModalOpen.value) { isCategoryModalOpen.value = false; return true; }
  return false;
}

function handleModalKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (confirmState.value.show) return;
  if (closeOpenModal()) e.preventDefault();
}

onMounted(() => document.addEventListener('keydown', handleModalKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleModalKeydown));
</script>
