<template>
  <div v-if="isOpen && ticket" class="w-full mx-auto space-y-4 sm:space-y-6 pb-12 px-2 sm:px-6">
    <!-- Header -->
    <div class="p-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="store.backToMainView()" class="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 shrink-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <span class="text-xs font-mono font-bold text-[#026bb1] dark:text-[#52b5f2] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">{{ ticket.id }}</span>
          <h2 class="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:truncate">
            <span class="sm:truncate">{{ ticket.title }}</span>
            <span v-if="isCompleted" class="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
              <CheckCircle2 class="w-3.5 h-3.5" /> Selesai
            </span>
          </h2>
          <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Kategori: <strong class="text-gray-700 dark:text-gray-200">{{ ticket.category }}</strong></span>
            <span class="text-gray-300 dark:text-slate-700">•</span>
            <span>Lokasi: <strong class="text-gray-700 dark:text-gray-200">{{ ticket.location }}</strong></span>
          </p>
        </div>
      </div>
      <div class="flex items-center justify-end sm:justify-start gap-2">
        <button
          @click="handlePrint"
          title="Cetak Laporan Tiket (PDF)"
          class="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Cetak PDF</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6 space-y-6 shadow-xs">
      <!-- SLA & Status Header Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
          <span class="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Deskripsi Laporan</span>
          <p class="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">{{ ticket.description }}</p>
        </div>

        <div class="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
          <span class="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Status & Penanganan</span>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Prioritas:</span>
            <span :class="['px-2 py-0.5 rounded text-xs font-bold uppercase', getTicketPriorityBadgeClass(ticket.priority)]">
              {{ getTicketPriorityLabel(ticket.priority) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">Status Saat Ini:</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-[#026bb1] dark:text-[#52b5f2]">
              {{ ticket.status }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">Workers:</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <template v-if="ticket.members && ticket.members.length > 0">
                <span
                  v-for="m in ticket.members"
                  :key="m.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-blue-950/60 dark:to-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs"
                >
                  <span class="w-5 h-5 rounded-full bg-[#026bb1] dark:bg-[#52b5f2] flex items-center justify-center shrink-0">
                    <User class="w-3 h-3 text-white" />
                  </span>
                  <span class="text-xs font-semibold text-[#026bb1] dark:text-[#52b5f2]">{{ m.user_name }}</span>
                </span>
              </template>
              <span v-else class="text-xs text-gray-400 italic">Belum ditugaskan</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Tracking Stepper -->
      <div class="bg-gray-50 dark:bg-slate-800/40 p-3 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Progress Pengerjaan & Lampiran Per Tahap</h3>
          <span class="text-[10px] text-gray-400">Klik tahap untuk detail</span>
        </div>

        <!-- Stepper Pipeline with Inter-step Connectors -->
        <div class="py-2">
          <div class="flex items-center justify-start sm:justify-center gap-3 sm:gap-4 overflow-x-auto w-full py-2 custom-scrollbar">
            <template v-for="(step, i) in stepperStages" :key="i">
              <!-- Stepper Card -->
              <div
                :ref="(el: any) => { if (step.current) activeStepEl = el as HTMLElement }"
                @click="selectedStepIndex = i"
                :class="[
                  'min-w-[130px] sm:min-w-[150px] shrink-0 p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs relative bg-white dark:bg-slate-800',
                  selectedStepIndex === i
                    ? 'border-[#026bb1] dark:border-[#52b5f2] shadow-sm ring-2 ring-[#026bb1]/20'
                    : step.current
                    ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-gray-400">Tahap {{ i + 1 }}</span>
                  <span :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-xs',
                    step.completed
                      ? 'bg-emerald-600 text-white'
                      : step.current
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                  ]">
                    <span v-if="step.completed">✓</span>
                    <span v-else-if="step.current" class="w-2 h-2 rounded-full bg-white" />
                    <span v-else>{{ i + 1 }}</span>
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {{ step.label }}
                    <span v-if="step.current" class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  </p>
                  <p class="text-[10px] text-gray-500 truncate">{{ step.desc }}</p>
                </div>
                <div class="flex items-center gap-1 text-[10px] text-[#026bb1] dark:text-[#52b5f2] font-semibold pt-1 border-t border-gray-100 dark:border-slate-700/60">
                  <Paperclip class="w-3 h-3" />
                  <span>{{ step.attachments.length }} Berkas</span>
                </div>
              </div>

              <!-- Connecting Line between steps (tampil di semua ukuran layar yang mendukung flex scroll) -->
              <div
                v-if="i < stepperStages.length - 1"
                class="w-4 sm:w-6 h-0.5 shrink-0 bg-gray-300 dark:bg-slate-600"
              />
            </template>
          </div>
        </div>

        <!-- Active Step Detail Panel -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
            <div>
              <h4 class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Detail Tahap: {{ stepperStages[selectedStepIndex]?.label }}
              </h4>
              <p class="text-[10px] text-gray-500 mt-0.5">{{ stepperStages[selectedStepIndex]?.actorInfo }}</p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-[#026bb1] dark:text-blue-300">
              Stage: {{ stepperStages[selectedStepIndex]?.stageKey }}
            </span>
          </div>

          <!-- Attachments in this step -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold text-gray-500 uppercase">Lampiran / Bukti pada Tahap Ini:</span>
            <div v-if="(stepperStages[selectedStepIndex]?.attachments?.length ?? 0) > 0" class="space-y-2">
              <template v-for="att in stepperStages[selectedStepIndex]?.attachments ?? []" :key="att.id">
                <!-- Image Preview Card -->
                <div v-if="isImage(att.file_name)" class="bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div class="relative bg-gray-100 dark:bg-slate-900 flex items-center justify-center max-h-[250px] overflow-hidden">
                    <img
                      :src="att.file_path || '#'"
                      :alt="att.file_name"
                      class="max-h-[250px] w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      @click="openPreview(att)"
                      @error="handleImageError"
                    />
                  </div>
                  <div class="p-2.5 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 overflow-hidden min-w-0">
                      <ImageIcon class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div class="truncate">
                        <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{{ att.file_name }}</p>
                        <p class="text-[9px] text-gray-400">{{ att.file_size || '' }}</p>
                      </div>
                    </div>
                    <a
                      v-if="att.file_path"
                      :href="att.file_path"
                      :download="att.file_name"
                      class="shrink-0 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#026bb1] dark:text-[#52b5f2] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Download"
                    >
                      <Download class="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <!-- PDF Card -->
                <div v-else-if="isPdf(att.file_name)" class="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <FileText class="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{{ att.file_name || 'Attachment' }}</p>
                    <p class="text-[9px] text-gray-400">{{ att.file_size || '' }}</p>
                  </div>
                  <a
                    v-if="att.file_path"
                    :href="att.file_path"
                    :download="att.file_name"
                    class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#026bb1] dark:text-[#52b5f2] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-semibold flex items-center gap-1"
                    title="Download"
                  >
                    <Download class="w-3 h-3" />
                    <span class="hidden sm:inline">Download</span>
                  </a>
                </div>

                <!-- Generic File Card -->
                <div v-else class="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <File class="w-5 h-5 text-[#026bb1] dark:text-[#52b5f2]" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{{ att.file_name || 'Attachment' }}</p>
                    <p class="text-[9px] text-gray-400">
                      <span v-if="getFileExtLabel(att.file_name) !== 'FILE'" class="font-semibold text-[#026bb1] dark:text-[#52b5f2]">{{ getFileExtLabel(att.file_name) }}</span>
                      <span v-if="getFileExtLabel(att.file_name) !== 'FILE' && att.file_size"> • </span>
                      {{ att.file_size || '' }}
                    </p>
                  </div>
                  <a
                    v-if="att.file_path"
                    :href="att.file_path"
                    :download="att.file_name"
                    class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#026bb1] dark:text-[#52b5f2] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-semibold flex items-center gap-1"
                    title="Download"
                  >
                    <Download class="w-3 h-3" />
                    <span class="hidden sm:inline">Download</span>
                  </a>
                </div>
              </template>
            </div>
            <div v-else class="text-center py-4 text-xs text-gray-400 bg-gray-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
              Tidak ada lampiran pada tahap ini.
            </div>
          </div>

          <!-- Image Lightbox -->
          <Teleport to="body">
            <div v-if="previewImage" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" @click="previewImage = null">
              <div class="relative max-w-4xl max-h-[90vh] w-full" @click.stop>
                <button @click="previewImage = null" class="absolute -top-3 -right-3 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10">
                  <X class="w-5 h-5" />
                </button>
                <img :src="previewImage.url" :alt="previewImage.name" class="max-h-[85vh] w-full object-contain rounded-xl" />
                <div class="mt-2 text-center">
                  <p class="text-xs text-gray-300 font-medium">{{ previewImage.name }}</p>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- History Catatan / Worklog pada Tahap Ini -->
          <div v-if="filteredWorklogs.length > 0" class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span class="text-[10px] font-bold text-gray-500 uppercase">Catatan & Histori pada Tahap Ini:</span>
            <div class="space-y-2">
              <div
                v-for="wl in filteredWorklogs"
                :key="wl.id"
                class="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 text-xs space-y-1"
              >
                <div class="flex items-center justify-between text-[10px] text-gray-400">
              <div class="flex flex-wrap items-center gap-2">
                    <span class="font-bold text-[#026bb1] dark:text-[#52b5f2]">Oleh: {{ wl.worker_name || 'Worker' }}</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-[#026bb1] dark:text-[#52b5f2] font-semibold text-[9px]">
                      Tahap {{ stepperStages[selectedStepIndex]?.label }}
                    </span>
                  </div>
                  <span>{{ new Date(wl.created_at || Date.now()).toLocaleString() }}</span>
                </div>
                <p class="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-line">{{ wl.description }}</p>
              </div>
            </div>
          </div>

           <!-- Action Buttons -->
          <div v-if="store.currentUser?.role !== 'USER_NON_IT'" class="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-3">
            <!-- ASSIGN step context -->
            <template v-if="activeStep === 'ASSIGN'">
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Catatan Penugasan:
                </label>
                <textarea
                  v-model="stageNotes"
                  rows="2"
                  placeholder="Tuliskan catatan (opsional)..."
                  class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 resize-none"
                ></textarea>
              </div>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div class="flex-1 space-y-1.5">
                  <input type="file" multiple ref="stageFileInput" @change="handleStageFile" class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#026bb1] hover:file:bg-blue-100" />
                  <div v-if="pendingFiles.length > 0" class="flex flex-wrap gap-1.5">
                    <span v-for="(pf, i) in pendingFiles" :key="i" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] text-[#026bb1] dark:text-[#52b5f2] font-semibold">
                      {{ pf.file.name }}
                      <button @click="removePendingFile(i)" class="text-red-400 hover:text-red-600"><X class="w-3 h-3" /></button>
                    </span>
                  </div>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <!-- Kirim (always available) -->
                  <button
                    @click="handleSaveNote()"
                    class="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock class="w-4 h-4" />
                    <span>Kirim</span>
                  </button>
                  <!-- Ambil Tiket (add member, non-members only, not when SELESAI) -->
                  <button
                    v-if="!isCurrentUserMember && ticket.status !== 'SELESAI'"
                    @click="handleAddMember()"
                    class="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus class="w-4 h-4" />
                    <span>Ambil Tiket</span>
                  </button>
                  <!-- Mulai Proses (DRAFT → PROCESS, only when DRAFT + member) -->
                  <button
                    v-if="isCurrentUserMember && ticket.status === 'DRAFT'"
                    @click="handleStartWork()"
                    class="w-full px-4 py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play class="w-4 h-4" />
                    <span>Mulai Proses</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- PROCESS step context -->
            <template v-else-if="activeStep === 'IN_PROGRESS'">
              <template v-if="ticket.status === 'PROCESS'">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Catatan Pengerjaan:
                  </label>
                  <textarea
                    v-model="stageNotes"
                    rows="2"
                    placeholder="Tuliskan catatan (opsional)..."
                    class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 resize-none"
                  ></textarea>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div class="flex-1 space-y-1.5">
                    <input type="file" multiple ref="stageFileInput" @change="handleStageFile" class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#026bb1] hover:file:bg-blue-100" />
                    <div v-if="pendingFiles.length > 0" class="flex flex-wrap gap-1.5">
                      <span v-for="(pf, i) in pendingFiles" :key="i" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] text-[#026bb1] dark:text-[#52b5f2] font-semibold">
                        {{ pf.file.name }}
                        <button @click="removePendingFile(i)" class="text-red-400 hover:text-red-600"><X class="w-3 h-3" /></button>
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <!-- Kirim -->
                    <button
                      @click="handleSaveNote()"
                      class="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Clock class="w-4 h-4" />
                      <span>Kirim</span>
                    </button>
                    <!-- Selesaikan (PROCESS → SELESAI) -->
                    <button
                      @click="handleSubmitCurrentStage()"
                      class="w-full px-4 py-2.5 bg-[#026bb1] hover:bg-[#025a95] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 class="w-4 h-4" />
                      <span>Selesaikan</span>
                    </button>
                  </div>
                </div>
              </template>
              <!-- DRAFT status on PROCESS step: info only -->
              <template v-else-if="ticket.status === 'DRAFT'">
                <div class="text-center py-3 text-xs text-gray-400 bg-gray-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                  Proses belum dimulai. Klik "Mulai Proses" pada tahap Assign untuk memulai.
                </div>
              </template>
            </template>

            <!-- SELESAI step / COMPLETION step -->
            <template v-else-if="activeStep === 'COMPLETION'">
              <template v-if="ticket.status === 'SELESAI'">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Catatan:
                  </label>
                  <textarea
                    v-model="stageNotes"
                    rows="2"
                    placeholder="Tuliskan catatan (opsional)..."
                    class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#026bb1]/50 resize-none"
                  ></textarea>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div class="flex-1 space-y-1.5">
                    <input type="file" multiple ref="stageFileInput" @change="handleStageFile" class="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#026bb1] hover:file:bg-blue-100" />
                    <div v-if="pendingFiles.length > 0" class="flex flex-wrap gap-1.5">
                      <span v-for="(pf, i) in pendingFiles" :key="i" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] text-[#026bb1] dark:text-[#52b5f2] font-semibold">
                        {{ pf.file.name }}
                        <button @click="removePendingFile(i)" class="text-red-400 hover:text-red-600"><X class="w-3 h-3" /></button>
                      </span>
                    </div>
                  </div>
                  <button
                    @click="handleSaveNote()"
                    class="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock class="w-4 h-4" />
                    <span>Kirim</span>
                  </button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useAppStore } from '~/stores/app';
import { ArrowLeft, CheckCircle2, Paperclip, Printer, Clock, ExternalLinkIcon, User, X, Download, Image as ImageIcon, FileText, File, UserPlus, Play } from 'lucide-vue-next';
import type { TicketStatus, PendingAttachment } from '~/types';
import { triggerPrintPDF } from '~/utils/export';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import { isImage, isPdf, getFileExtLabel } from '~/utils/fileHelpers';

const store = useAppStore();
const isOpen = computed(() => store.activeView === 'ticket-detail');
const ticket = computed(() => store.selectedTicket);
const isCompleted = computed(() => ticket.value?.status === 'SELESAI');

const selectedStepIndex = ref(0);
const activeStepEl = ref<HTMLElement | null>(null);
const hasInitializedStep = ref(false);
const stageNotes = ref('');
const pendingFiles = ref<PendingAttachment[]>([]);
const previewImage = ref<{ url: string; name: string } | null>(null);

const activeStep = computed(() => stepperStages.value[selectedStepIndex.value]?.stageKey || 'ASSIGN');

const getDefaultStepIndex = (status: string): number => {
  if (status === 'PROCESS') return 2;
  if (status === 'SELESAI' || status === 'DELEGASI') return 3;
  return 1;
};

const openPreview = (att: { file_path?: string | null; file_name: string }) => {
  if (att.file_path) {
    previewImage.value = { url: att.file_path, name: att.file_name };
  }
};

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

const handleStageFile = (e: Event) => {
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

const handleSubmitCurrentStage = async (targetStatus?: TicketStatus) => {
  if (!ticket.value) return;
  const currentStage = stepperStages.value[selectedStepIndex.value];
  if (!currentStage) return;

  await store.completeStage(ticket.value.id, currentStage.stageKey, stageNotes.value || undefined, pendingFiles.value.length > 0 ? pendingFiles.value : undefined, targetStatus);
  stageNotes.value = '';
  pendingFiles.value = [];
  const newStatus = (store.selectedTicket?.status as string) || ticket.value.status as string;
  selectedStepIndex.value = getDefaultStepIndex(newStatus);
};

const handleSaveNote = async () => {
  if (!ticket.value) return;
  const hasNote = stageNotes.value.trim();
  const hasFiles = pendingFiles.value.length > 0;
  if (!hasNote && !hasFiles) return;

  const currentStage = stepperStages.value[selectedStepIndex.value];
  if (!currentStage) return;

  await store.saveWorklogNote(ticket.value.id, currentStage.stageKey, stageNotes.value, pendingFiles.value.length > 0 ? pendingFiles.value : undefined);
  stageNotes.value = '';
  pendingFiles.value = [];
};

const isCurrentUserMember = computed(() => {
  if (!ticket.value || !store.currentUser) return false;
  return ticket.value.members?.some(m => m.user_id === store.currentUser?.id) ?? false;
});

const isTicketActive = computed(() => {
  if (!ticket.value) return false;
  const status = ticket.value.status as string;
  return status === 'DRAFT' || status === 'PROCESS';
});

const handleAddMember = async () => {
  if (!ticket.value || !store.currentUser) return;
  try {
    await $fetch(`/api/tickets/${ticket.value.id}/members`, {
      method: 'POST',
      body: { userIds: [store.currentUser.id] },
      credentials: 'include',
    });
    await store.refreshTicket(ticket.value.id);
  } catch (e: any) {
    console.error('Failed to add member:', e);
  }
};

const handleStartWork = async () => {
  if (!ticket.value) return;
  await store.completeStage(ticket.value.id, 'START_WORK', stageNotes.value || undefined, pendingFiles.value.length > 0 ? pendingFiles.value : undefined);
  stageNotes.value = '';
  pendingFiles.value = [];
  selectedStepIndex.value = 2;
};

const stepperStages = computed(() => {
  if (!ticket.value) return [];
  const t = ticket.value;
  const status = t.status as string;
  const atts = t.attachments || [];
  const hasDelegation = !!t.delegation || status === 'DELEGASI';
  const hasMembers = (t.members?.length ?? 0) > 0;

  const isDraft = status === 'DRAFT';
  const isProcess = status === 'PROCESS';
  const isSelesai = status === 'SELESAI';
  const isDelegasi = status === 'DELEGASI';

  const stages = [
    {
      label: 'Created (Draft)',
      desc: 'Tiket dibuat oleh user',
      stageKey: 'REQUEST',
      completed: true,
      current: false,
      actorInfo: (t.created_by_admin_name && t.created_by_admin_id !== t.requestedBy)
        ? `Dibuat oleh Admin: ${t.created_by_admin_name} atas nama ${t.created_by_name || 'User'} (${t.created_by_dept || 'General'})`
        : `Dibuat oleh: ${t.created_by_name || 'User'} (${t.created_by_dept || 'General'})`,
      attachments: atts.filter(a => a.stage === 'REQUEST'),
    },
    {
      label: 'Assigned',
      desc: 'Penugasan worker',
      stageKey: 'ASSIGN',
      completed: isProcess || isSelesai || isDelegasi,
      current: selectedStepIndex.value === 1,
      actorInfo: `Worker: ${hasMembers ? t.members!.map((m: any) => m.user_name).join(', ') : 'Belum ditugaskan'}`,
      attachments: atts.filter(a => (a.stage as string) === 'ASSIGN'),
    },
    {
      label: 'Process (In Progress)',
      desc: 'Pengerjaan & Worklog IT',
      stageKey: 'IN_PROGRESS',
      completed: isSelesai || isDelegasi,
      current: selectedStepIndex.value === 2,
      actorInfo: `Total Worklog: ${t.worklogs?.length || 0} aktivitas tercatat`,
      attachments: atts.filter(a => a.stage === 'IN_PROGRESS'),
    },
    {
      label: 'Selesai Internal',
      desc: 'Penyelesaian tugas IT Internal',
      stageKey: 'COMPLETION',
      completed: isSelesai || isDelegasi,
      current: selectedStepIndex.value === 3,
      actorInfo: t.completed_at ? `Selesai pada: ${new Date(t.completed_at).toLocaleString()}` : 'Belum selesai',
      attachments: atts.filter(a => a.stage === 'COMPLETION'),
    },
  ];

  if (hasDelegation) {
    stages.push({
      label: 'Delegasi (Eksternal / Vendor)',
      desc: 'Eskalasi lanjutan ke pihak luar',
      stageKey: 'DELEGATION',
      completed: isDelegasi && !!t.delegation,
      current: selectedStepIndex.value === 4,
      actorInfo: t.delegation ? `Delegasi ke: ${t.delegation.vendor_name || t.delegation.technician_name || 'Vendor'}` : 'Ada delegasi tercatat',
      attachments: atts.filter(a => a.stage === 'DELEGATION'),
    });
  }

  return stages;
});

// Auto-select step based on ticket status on first load, then let user control
watch(stepperStages, (stages) => {
  if (!hasInitializedStep.value && stages.length > 1 && ticket.value) {
    hasInitializedStep.value = true;
    selectedStepIndex.value = getDefaultStepIndex(ticket.value.status as string);
    nextTick(() => {
      if (activeStepEl.value) {
        activeStepEl.value.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }
}, { immediate: true });

const filteredWorklogs = computed(() => {
  if (!ticket.value?.worklogs) return [];
  const currentStageKey = stepperStages.value[selectedStepIndex.value]?.stageKey;
  return ticket.value.worklogs.filter(wl => wl.stageKey === currentStageKey);
});

const handlePrint = () => {
  if (ticket.value) triggerPrintPDF(ticket.value.id);
};
</script>
