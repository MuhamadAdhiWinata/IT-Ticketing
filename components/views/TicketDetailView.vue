<template>
  <div v-if="isOpen && ticket" class="w-full mx-auto space-y-4 sm:space-y-6 pb-12 px-2 sm:px-6">
    <!-- Header -->
    <div class="p-3 sm:px-6 sm:py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface rounded-lg shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="store.backToMainView()" class="hidden sm:flex p-2 rounded-lg bg-muted hover:bg-muted text-muted-foreground shrink-0">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="min-w-0">
          <span class="text-xs font-mono font-bold text-primary bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-primary/15">{{ ticket.id }}</span>
          <h2 class="text-base sm:text-xl font-bold text-foreground flex items-center gap-2 sm:truncate">
            <span class="sm:truncate">{{ ticket.title }}</span>
            <span v-if="isCompleted" class="inline-flex items-center gap-1 text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
              <CheckCircle2 class="w-3.5 h-3.5" /> Selesai
            </span>
          </h2>
          <p class="text-[11px] sm:text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Kategori: <strong class="text-foreground">{{ ticket.category }}</strong></span>
            <span class=" text-muted-foreground/50 dark:text-slate-700">•</span>
            <span v-if="ticket.location">Lokasi: <strong class="text-foreground">{{ ticket.location }}</strong></span>
          </p>
          <p class="text-[11px] sm:text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            <span>Pelapor:</span>
            <strong class="text-foreground">{{ requesterIdentityLabel }}</strong>
          </p>
        </div>
      </div>
      <div class="flex items-center justify-end sm:justify-start gap-2">
        <button
          @click="handlePrint"
          title="Cetak Laporan Tiket (PDF)"
          class="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-semibold hover:bg-muted dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Cetak PDF</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-6 shadow-xs">
      <!-- SLA & Status Header Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2 bg-muted/50 p-4 rounded-lg border border-border">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Yang Terjadi</span>
          <p class="text-xs text-foreground whitespace-pre-line leading-relaxed">{{ ticket.description }}</p>
        </div>

        <div class="bg-muted/50 p-4 rounded-lg border border-border space-y-2">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">Status & Penanganan</span>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Prioritas:</span>
            <span :class="['px-2 py-0.5 rounded text-xs font-bold uppercase', getTicketPriorityBadgeClass(ticket.priority)]">
              {{ getTicketPriorityLabel(ticket.priority) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Status Saat Ini:</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-primary">
              {{ ticket.status_label || ticket.status }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">Pelaksana:</span>
            <div class="flex flex-wrap items-center gap-1.5">
              <template v-if="ticket.members && ticket.members.length > 0">
                <span
                  v-for="m in ticket.members"
                  :key="m.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/80 dark:from-blue-950/60 dark:to-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 shadow-xs"
                >
                  <span class="w-5 h-5 rounded-full bg-primary dark:bg-[#52b5f2] flex items-center justify-center shrink-0">
                    <User class="w-3 h-3 text-primary-foreground" />
                  </span>
                  <span class="text-xs font-semibold text-primary">{{ m.user_name }}</span>
                </span>
              </template>
              <span v-else class="text-xs text-muted-foreground italic">Belum ada Pelaksana</span>
            </div>
          </div>
          <div v-if="(ticket.reopen_count ?? 0) > 0" class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Dibuka ulang:</span>
            <span class="text-xs font-bold text-foreground">{{ ticket.reopen_count }}x</span>
          </div>
        </div>
      </div>

      <TicketTriagePanel v-if="store.currentUser" :ticket="ticket" />

      <div v-if="ticket.solution_type" class="bg-muted/50 p-4 rounded-lg border border-border space-y-1.5">
        <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">Solusi Penyelesaian ({{ labelOf(SOLUTION_TYPES, ticket.solution_type) }})</span>
        <p class="text-xs text-foreground whitespace-pre-line leading-relaxed">{{ ticket.resolution_summary }}</p>
        <p v-if="ticket.odoo_task_url" class="text-xs">Task Odoo: <a :href="ticket.odoo_task_url" target="_blank" rel="noopener noreferrer" class="text-primary underline break-all">{{ ticket.odoo_task_url }}</a></p>
        <p v-if="ticket.tech_debt_url" class="text-xs">Utang teknis: <a :href="ticket.tech_debt_url" target="_blank" rel="noopener noreferrer" class="text-primary underline break-all">{{ ticket.tech_debt_url }}</a></p>
      </div>

      <!-- Progress Tracking Stepper -->
      <div class="bg-muted/50 p-3 sm:p-5 rounded-lg border border-border space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider">Fase Tiket</h3>
          <span class="text-[10px] text-muted-foreground">Klik fase untuk detail</span>
        </div>

        <!-- Stepper Pipeline with Inter-step Connectors -->
        <div class="py-2">
          <div class="overflow-x-auto w-full px-1 py-2 custom-scrollbar">
          <div class="flex items-center gap-3 sm:gap-4 w-max mx-auto">
            <template v-for="(step, i) in stepperStages" :key="i">
              <!-- Stepper Card -->
              <div
                :ref="(el: any) => { if (step.current) activeStepEl = el as HTMLElement }"
                @click="selectedStepIndex = i"
                :class="[
                  'min-w-[130px] sm:min-w-[150px] shrink-0 p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs relative bg-surface',
                  selectedStepIndex === i
                    ? 'border-primary shadow-sm ring-2 ring-primary/20'
                    : step.current
                    ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30'
                    : 'border-border hover:border-gray-300'
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-muted-foreground">Fase {{ i + 1 }}</span>
                  <span :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs',
                    step.completed
                      ? 'bg-emerald-700 text-white'
                      : step.current
                      ? 'bg-amber-700 text-white'
                      : 'bg-muted dark:bg-slate-700 text-muted-foreground'
                  ]">
                    <span v-if="step.completed">✓</span>
                    <span v-else-if="step.current" class="w-2 h-2 rounded-full bg-white" />
                    <span v-else>{{ i + 1 }}</span>
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold text-foreground flex items-center gap-1">
                    {{ step.label }}
                    <span v-if="step.current" class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  </p>
                  <p class="text-[10px] text-muted-foreground truncate">{{ step.desc }}</p>
                </div>
                <div class="flex items-center gap-1 text-[10px] text-primary font-semibold pt-1 border-t border-border/60">
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
        </div>

        <!-- Active Step Detail Panel -->
        <div class="bg-surface p-4 rounded-lg border border-border space-y-3">
          <div class="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h4 class="text-xs font-bold text-foreground uppercase tracking-wide">
                Detail Fase: {{ stepperStages[selectedStepIndex]?.label }}
              </h4>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ stepperStages[selectedStepIndex]?.actorInfo }}</p>
            </div>
          </div>

          <TicketTriagePanel v-if="store.currentUser && selectedStep" :ticket="ticket" :phase="selectedStep.phase" />

          <!-- Attachments in this step -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold text-muted-foreground uppercase">Lampiran / Bukti pada Fase Ini:</span>
            <div v-if="(stepperStages[selectedStepIndex]?.attachments?.length ?? 0) > 0" class="space-y-2">
              <template v-for="att in stepperStages[selectedStepIndex]?.attachments ?? []" :key="att.id">
                <!-- Image Preview Card -->
                <div v-if="isImage(att.file_name)" class="bg-muted rounded-lg border border-border overflow-hidden">
                  <div class="relative bg-muted flex items-center justify-center max-h-[250px] overflow-hidden">
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
                        <p class="text-xs font-medium text-foreground truncate">{{ att.file_name }}</p>
                        <p class="text-[9px] text-muted-foreground">{{ att.file_size || '' }}</p>
                      </div>
                    </div>
                    <a
                      v-if="att.file_path"
                      :href="att.file_path"
                      :download="att.file_name"
                      class="shrink-0 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Download"
                    >
                      <Download class="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <!-- PDF Card -->
                <div v-else-if="isPdf(att.file_name)" class="p-2.5 bg-muted rounded-lg border border-border flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <FileText class="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-foreground truncate">{{ att.file_name || 'Attachment' }}</p>
                    <p class="text-[9px] text-muted-foreground">{{ att.file_size || '' }}</p>
                  </div>
                  <a
                    v-if="att.file_path"
                    :href="att.file_path"
                    :download="att.file_name"
                    class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-semibold flex items-center gap-1"
                    title="Download"
                  >
                    <Download class="w-3 h-3" />
                    <span class="hidden sm:inline">Download</span>
                  </a>
                </div>

                <!-- Generic File Card -->
                <div v-else class="p-2.5 bg-muted rounded-lg border border-border flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <File class="w-5 h-5 text-primary" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-foreground truncate">{{ att.file_name || 'Attachment' }}</p>
                    <p class="text-[9px] text-muted-foreground">
                      <span v-if="getFileExtLabel(att.file_name) !== 'FILE'" class="font-semibold text-primary">{{ getFileExtLabel(att.file_name) }}</span>
                      <span v-if="getFileExtLabel(att.file_name) !== 'FILE' && att.file_size"> • </span>
                      {{ att.file_size || '' }}
                    </p>
                  </div>
                  <a
                    v-if="att.file_path"
                    :href="att.file_path"
                    :download="att.file_name"
                    class="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-[10px] font-semibold flex items-center gap-1"
                    title="Download"
                  >
                    <Download class="w-3 h-3" />
                    <span class="hidden sm:inline">Download</span>
                  </a>
                </div>
              </template>
            </div>
            <div v-else class="text-center py-4 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
              Tidak ada lampiran pada fase ini.
            </div>
          </div>

          <!-- Image Lightbox -->
          <Teleport to="body">
            <div v-if="previewImage" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-modal flex items-center justify-center p-4" @click="previewImage = null">
              <div class="relative max-w-4xl max-h-[90vh] w-full" @click.stop>
                <button @click="previewImage = null" class="absolute -top-3 -right-3 p-2 rounded-full bg-surface shadow-lg text-muted-foreground hover:text-foreground z-10">
                  <X class="w-5 h-5" />
                </button>
                <img :src="previewImage.url" :alt="previewImage.name" class="max-h-[85vh] w-full object-contain rounded-lg" />
                <div class="mt-2 text-center">
                  <p class="text-xs text-muted-foreground/50 font-medium">{{ previewImage.name }}</p>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- History Catatan / Worklog pada Tahap Ini -->
          <div v-if="filteredWorklogs.length > 0" class="space-y-2 pt-2 border-t border-border">
            <span class="text-[10px] font-bold text-muted-foreground uppercase">Catatan & Histori pada Fase Ini:</span>
            <div class="space-y-3">
              <div
                v-for="wl in filteredWorklogs"
                :key="wl.id"
                :class="['flex', wl.worker_id === store.currentUser?.id ? 'justify-end' : 'justify-start']"
              >
                <div
                  :class="[
                    'max-w-[85%] sm:max-w-[75%] rounded-lg text-xs p-3 space-y-1',
                    wl.worker_id === store.currentUser?.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/50 border border-border'
                  ]"
                >
                  <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span class="font-bold text-primary">{{ wl.worker_name || 'Worker' }}<span v-if="wl.on_duty" class="ml-1.5 px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/30 text-[9px] font-bold uppercase">On Duty</span></span>
                    <span>{{ new Date(wl.created_at || Date.now()).toLocaleString() }}</span>
                  </div>
                  <div class="rich-text text-foreground" v-html="toSafeHtml(wl.description)" @click="onRichTextClick"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aksi catatan / selesaikan: hanya di fase aktif -->
          <div v-if="isITRole(store.currentUser?.role) && selectedStep?.current" class="pt-3 border-t border-border space-y-3">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-foreground">Catatan:</label>
              <RichTextEditor
                v-model="stageNotes"
                placeholder="Tuliskan catatan (opsional)..."
                :upload="uploadInlineImage"
              />
            </div>
            <div v-if="canSolve" class="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
              <p class="text-[11px] font-bold text-foreground">Solusi Penyelesaian (diisi saat menyelesaikan tiket):</p>
              <select v-model="solution.type" aria-label="Jenis solusi" class="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground">
                <option v-for="o in SOLUTION_TYPES" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
              <textarea v-model="solution.summary" rows="3" aria-label="Ringkasan solusi" placeholder="Jelaskan solusi yang diterapkan..." class="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground" />
              <input v-if="solution.type === 'SEMENTARA'" v-model="solution.tech_debt_url" type="url" aria-label="Tautan utang teknis" placeholder="Tautan utang teknis (wajib)" class="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground" />
            </div>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                @click="handleSaveNote()"
                class="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Clock class="w-4 h-4" />
                <span>Kirim</span>
              </button>
              <button
                v-if="canSolve"
                @click="handleSubmitCurrentStage()"
                class="w-full px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diskusi Tiket (Komentar) & Catatan Internal (PRD §20 / §19) -->
    <div class="bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-6 shadow-xs">
      <!-- Komentar: komunikasi antara User dan IT, terlihat semua pihak tiket -->
      <section class="space-y-3">
        <div class="flex items-center justify-between border-b border-border pb-2">
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider">Diskusi Tiket</h3>
          <span class="text-[10px] text-muted-foreground">{{ comments.length }} komentar</span>
        </div>

        <div v-if="commentsLoading" class="text-xs text-muted-foreground italic py-2">Memuat komentar...</div>
        <div v-else-if="comments.length === 0" class="text-xs text-muted-foreground italic py-2">
          Belum ada komentar. Ajukan pertanyaan atau balasan lewat kolom di bawah.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="c in comments"
            :key="c.id"
            :class="['flex', c.user_id === store.currentUser?.id ? 'justify-end' : 'justify-start']"
          >
            <div
              :class="[
                'max-w-[85%] sm:max-w-[75%] rounded-lg text-xs space-y-2',
                c.user_id === store.currentUser?.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-muted/50 border border-border'
              ]"
            >
              <div class="p-3 space-y-1">
                <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span class="font-bold text-primary">
                    {{ c.user_name }}
                    <span class="ml-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 font-semibold">{{ roleLabel(c.user_role) }}</span>
                  </span>
                  <span>{{ new Date(c.created_at).toLocaleString() }}</span>
                </div>
                <div class="rich-text text-foreground" v-html="toSafeHtml(c.message)" @click="onRichTextClick"></div>
              </div>
              
              <!-- Files attached to comment -->
              <div v-if="c.files && c.files.length > 0" class="px-3 pb-3 space-y-2">
                <div v-for="file in c.files" :key="file.id" class="flex items-center gap-2 p-2 bg-surface/50 rounded border border-border/50">
                  <Paperclip class="w-3.5 h-3.5 text-primary shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-foreground truncate">{{ file.file_name }}</p>
                    <p class="text-[9px] text-muted-foreground">{{ file.file_size }}</p>
                  </div>
                  <a
                    v-if="file.file_path"
                    :href="file.file_path"
                    :download="file.file_name"
                    class="shrink-0 p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    title="Download"
                  >
                    <Download class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSendComment" class="space-y-1.5">
          <label class="block text-[11px] font-bold text-foreground">Tulis Komentar:</label>
          <RichTextEditor
            v-model="commentDraft"
            placeholder="Tuliskan pertanyaan / balasan..."
            :upload="uploadInlineImage"
          />
          <button
            type="submit"
            :disabled="isRichTextEmpty(commentDraft) || commentSending"
            class="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Send class="w-4 h-4" />
            <span>{{ commentSending ? 'Mengirim...' : 'Kirim Komentar' }}</span>
          </button>
        </form>
      </section>

      <!-- Internal Note: khusus IT (Rule 15: tidak terlihat oleh User Non-IT) -->
      <section v-if="isITRole(store.currentUser?.role)" class="space-y-3 border-t border-border pt-4">
        <div class="flex items-center justify-between border-b border-border pb-2">
          <h3 class="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Lock class="w-3.5 h-3.5" />
            Catatan Internal (IT Saja)
          </h3>
          <span class="text-[10px] text-muted-foreground">{{ internalNotes.length }} catatan</span>
        </div>

        <p class="text-[10px] text-muted-foreground">
          Hanya terlihat oleh IT Worker dan System Admin, tidak dibagikan ke pelapor.
        </p>

        <div v-if="notesLoading" class="text-xs text-muted-foreground italic py-2">Memuat catatan internal...</div>
        <div v-else-if="internalNotes.length === 0" class="text-xs text-muted-foreground italic py-2">
          Belum ada catatan internal.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="n in internalNotes"
            :key="n.id"
            class="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1"
          >
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span class="font-bold text-amber-800 dark:text-amber-300">Oleh: {{ n.author_name }}</span>
              <span>{{ new Date(n.created_at).toLocaleString() }}</span>
            </div>
            <p class="text-foreground whitespace-pre-line leading-relaxed">{{ n.note }}</p>
          </div>
        </div>

        <form @submit.prevent="handleSendNote" class="space-y-1.5">
          <label for="note-draft" class="block text-[11px] font-bold text-foreground">Tulis Catatan Internal:</label>
          <textarea
            id="note-draft"
            v-model="noteDraft"
            rows="2"
            maxlength="2000"
            placeholder="Tuliskan catatan internal IT (opsional)..."
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          ></textarea>
          <button
            type="submit"
            :disabled="!noteDraft.trim() || noteSending"
            class="w-full sm:w-auto px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Lock class="w-4 h-4" />
            <span>{{ noteSending ? 'Menyimpan...' : 'Simpan Catatan' }}</span>
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isITRole } from '~/utils/roles';
import { PHASES, type Phase } from '~/utils/ticketSpec';
import { ref, computed, watch, nextTick } from 'vue';
import { useAppStore } from '~/stores/app';
import { apiFetch } from '~/services/api';
import { ArrowLeft, CheckCircle2, Paperclip, Printer, Clock, ExternalLinkIcon, User, X, Download, Image as ImageIcon, FileText, File, Send, Lock } from 'lucide-vue-next';
import type { TicketStatus, TicketComment, TicketInternalNote } from '~/types';
import { triggerPrintPDF } from '~/utils/export';
import { getTicketPriorityLabel, getTicketPriorityBadgeClass } from '~/utils/ticketHelpers';
import { isImage, isPdf, getFileExtLabel } from '~/utils/fileHelpers';
import { formatRequesterIdentity } from '~/utils/identity';
import { useModal } from '~/composables/useModal';
import { useToast } from '~/composables/useToast';
import RichTextEditor from '~/components/common/RichTextEditor.vue';
import { toSafeHtml, isRichTextEmpty } from '~/utils/richText';
import { SOLUTION_TYPES, labelOf } from '~/utils/ticketSpec';
import TicketTriagePanel from '~/components/features/Triage/TicketTriagePanel.vue';

const store = useAppStore();
const { showError } = useModal();
const { toast } = useToast();
const isOpen = computed(() => store.activeView === 'ticket-detail');
const ticket = computed(() => store.selectedTicket);

const requesterIdentityLabel = computed(() => {
  const t = ticket.value;
  if (!t) return '';
  return formatRequesterIdentity({
    name: t.requestedByName,
    company: t.requested_by_company,
    division: t.requested_by_division,
    department: t.requestedByDept || t.created_by_dept,
  }, 'User');
});
const isCompleted = computed(() => ticket.value?.status === 'SELESAI');

const selectedStepIndex = ref(0);
const activeStepEl = ref<HTMLElement | null>(null);
const stageNotes = ref('');
const solution = ref({ type: 'PANDUAN', summary: '', tech_debt_url: '' });
const previewImage = ref<{ url: string; name: string } | null>(null);

// Kunci tahap log/berkas di API mengikuti status DB (sama dengan activityStagesFor di server).
const stageKey = computed(() => ({ PROCESS: 'IN_PROGRESS', SELESAI: 'COMPLETION' } as Record<string, string>)[ticket.value?.status ?? ''] ?? 'ASSIGN');
const selectedStep = computed(() => stepperStages.value[selectedStepIndex.value]);
const canSolve = computed(() => !!selectedStep.value?.current && ticket.value?.status === 'PROCESS');

const openPreview = (att: { file_path?: string | null; file_name: string }) => {
  if (att.file_path) {
    previewImage.value = { url: att.file_path, name: att.file_name };
  }
};

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

const handleSubmitCurrentStage = async () => {
  if (!ticket.value || !canSolve.value) return;

  const f = solution.value;
  if (!f.summary.trim()) return showError('Solusi Belum Diisi', 'Isi ringkasan solusi penyelesaian.');
  if (f.type === 'SEMENTARA' && !f.tech_debt_url.trim()) {
    return showError('Tautan Wajib', 'Solusi sementara wajib menyertakan tautan utang teknis.');
  }
  const sol: Record<string, string> = { type: f.type, summary: f.summary.trim() };
  if (f.type === 'SEMENTARA') sol.tech_debt_url = f.tech_debt_url.trim();

  try {
    await store.completeStage(ticket.value.id, 'IN_PROGRESS', isRichTextEmpty(stageNotes.value) ? undefined : stageNotes.value, undefined, undefined, undefined, sol);
    solution.value = { type: 'PANDUAN', summary: '', tech_debt_url: '' };
  } catch (e: any) {
    showError('Gagal Memproses', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  }
  stageNotes.value = '';
};

const handleSaveNote = async () => {
  if (!ticket.value || isRichTextEmpty(stageNotes.value)) return;
  await store.saveWorklogNote(ticket.value.id, stageKey.value, stageNotes.value);
  stageNotes.value = '';
};

// ponytail: log/berkas dipetakan ke fase lewat kunci tahap API; log ASSIGN tampil di ketiga fase pra-kerja (tanpa stempel fase per log).
const STAGE_PHASES: Record<string, Phase[]> = {
  REQUEST: ['Baru'],
  ASSIGN: ['Baru', 'Diakui', 'Ditriase'],
  IN_PROGRESS: ['Dikerjakan', 'Menunggu Pemohon'],
  DELEGATION: ['Dikerjakan', 'Menunggu Pemohon'],
  COMPLETION: ['Selesai'],
};
const inPhase = (stage: string | null | undefined, phase: Phase) => !!stage && !!STAGE_PHASES[stage]?.includes(phase);

const PHASE_DESC: Record<Phase, string> = {
  Baru: 'Tiket dibuat pemohon',
  Diakui: 'Diakui tim IT',
  Ditriase: 'PM mengisi triase',
  Dikerjakan: 'Pengerjaan & worklog IT',
  'Menunggu Pemohon': 'Menunggu jawaban pemohon',
  Selesai: 'Hasil akhir tiket',
};

const stepperStages = computed(() => {
  const t = ticket.value;
  if (!t) return [];
  const cur = PHASES.indexOf((t.status_phase ?? 'Baru') as Phase);
  const atts = t.attachments || [];
  const requester = formatRequesterIdentity({ name: t.created_by_name, company: t.created_by_company, division: t.created_by_division, department: t.created_by_dept }, 'User');
  const actor: Record<Phase, string> = {
    Baru: t.created_by_admin_name && t.created_by_admin_id !== t.requestedBy ? `Dibuat oleh Admin: ${t.created_by_admin_name} atas nama ${requester}` : `Dibuat oleh: ${requester}`,
    Diakui: t.acknowledged_at ? `Diakui pada: ${new Date(t.acknowledged_at).toLocaleString()}` : 'Belum diakui',
    Ditriase: t.triaged_at ? `Triase dimulai: ${new Date(t.triaged_at).toLocaleString()}` : 'Triase belum dimulai',
    Dikerjakan: `Pelaksana: ${t.assignedToName || 'Belum ditugaskan'}. ${t.worklogs?.length || 0} aktivitas tercatat`,
    'Menunggu Pemohon': t.waiting_started_at ? `Menunggu sejak: ${new Date(t.waiting_started_at).toLocaleString()}` : 'Tidak menunggu pemohon',
    Selesai: t.completed_at ? `Selesai pada: ${new Date(t.completed_at).toLocaleString()}` : 'Belum selesai',
  };
  return PHASES.map((phase, i) => ({
    phase,
    label: phase === 'Selesai' && i === cur ? (t.status_label || phase) : phase,
    desc: PHASE_DESC[phase],
    completed: i < cur,
    current: i === cur,
    actorInfo: actor[phase],
    attachments: atts.filter(a => inPhase(a.stage as string, phase)),
  }));
});

// Pilih fase aktif saat tiket dibuka atau fasenya berubah (setelah Akui, Mulai Triase, dst).
watch(() => [ticket.value?.id, ticket.value?.status_phase], () => {
  const i = PHASES.indexOf((ticket.value?.status_phase ?? 'Baru') as Phase);
  selectedStepIndex.value = i < 0 ? 0 : i;
  nextTick(() => activeStepEl.value?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }));
}, { immediate: true });

const filteredWorklogs = computed(() => {
  const phase = selectedStep.value?.phase;
  return phase ? (ticket.value?.worklogs ?? []).filter(wl => inPhase(wl.stageKey, phase)) : [];
});

// ── Diskusi (Komentar) & Internal Note ──
const comments = ref<TicketComment[]>([]);
const internalNotes = ref<TicketInternalNote[]>([]);
const commentsLoading = ref(false);
const notesLoading = ref(false);
const commentSending = ref(false);
const noteSending = ref(false);
const commentDraft = ref('');
const noteDraft = ref('');

const isViewerNonIT = computed(() => !isITRole(store.currentUser?.role));

const roleLabel = (role: string): string => {
  if (role === 'SYSTEM_ADMIN') return 'Admin';
  if (role === 'PM') return 'PM';
  if (role === 'DUTY_ENGINEER') return 'Duty Engineer';
  if (role === 'IT_WORKER') return 'IT';
  return 'User';
};

const loadDiscussions = async () => {
  const t = ticket.value;

  // Rule 21: state diskusi dibersihkan saat pindah tiket / tab.
  comments.value = [];
  internalNotes.value = [];
  commentDraft.value = '';
  noteDraft.value = '';
  if (!t) return;

  commentsLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: TicketComment[] }>(`/api/tickets/${t.id}/comments`);
    if (ticket.value?.id === t.id) comments.value = res.data;
  } catch (e) {
    console.error('Gagal memuat komentar:', e);
  } finally {
    commentsLoading.value = false;
  }

  // Internal note tidak pernah dimuat untuk User Non-IT (Rule 15).
  if (!isViewerNonIT.value) {
    notesLoading.value = true;
    try {
      const res = await apiFetch<{ success: boolean; data: TicketInternalNote[] }>(`/api/tickets/${t.id}/internal-notes`);
      if (ticket.value?.id === t.id) internalNotes.value = res.data;
    } catch (e) {
      console.error('Gagal memuat catatan internal:', e);
    } finally {
      notesLoading.value = false;
    }
  }
};

watch(() => ticket.value?.id, loadDiscussions, { immediate: true });

const uploadInlineImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('ticketId', ticket.value?.id || 'general');
  fd.append('file', file);
  try {
    const res = await apiFetch<{ success: boolean; data: { file_url: string }[] }>('/api/upload', { method: 'POST', body: fd });
    const url = res.data?.[0]?.file_url;
    if (!url) throw new Error('URL gambar tidak ditemukan');
    return url;
  } catch (e: any) {
    showError('Gagal Upload Gambar', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
    throw e;
  }
};

const onRichTextClick = (e: MouseEvent) => {
  const img = e.target as HTMLElement;
  if (img instanceof HTMLImageElement) {
    previewImage.value = { url: img.src, name: img.alt || 'Gambar' };
  }
};

const handleSendComment = async () => {
  const message = commentDraft.value;
  if (isRichTextEmpty(message) || !ticket.value || commentSending.value) return;

  commentSending.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: TicketComment }>(`/api/tickets/${ticket.value.id}/comments`, {
      method: 'POST',
      body: { message },
    });
    comments.value.push(res.data);
    commentDraft.value = '';
    toast('Komentar terkirim', 'success');
  } catch (e: any) {
    showError('Gagal Mengirim Komentar', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    commentSending.value = false;
  }
};

const handleSendNote = async () => {
  const note = noteDraft.value.trim();
  if (!note || !ticket.value || noteSending.value) return;

  noteSending.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: TicketInternalNote }>(`/api/tickets/${ticket.value.id}/internal-notes`, {
      method: 'POST',
      body: { note },
    });
    internalNotes.value.push(res.data);
    noteDraft.value = '';
    toast('Catatan internal tersimpan', 'success');
  } catch (e: any) {
    showError('Gagal Menyimpan Catatan', e?.data?.statusMessage || e?.message || 'Terjadi kesalahan.');
  } finally {
    noteSending.value = false;
  }
};

const handlePrint = () => {
  if (ticket.value) triggerPrintPDF(ticket.value.id);
};
</script>
