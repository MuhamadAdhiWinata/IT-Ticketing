# Product Requirement Document (PRD)

# Sistem Information Technology Ticketing & Work Monitoring

## IT-Ticketing

**Versi:** 2.2
**Platform:** Web Application (Nuxt 4 + Tailwind + Pinia)
**Target Pengguna:** Karyawan Non-IT, IT Worker, dan System Admin

---

# 1. Ringkasan Eksekutif & Tujuan

Sistem **IT-Ticketing** dirancang untuk menjadi pusat komunikasi, pencatatan, monitoring, dan pengelolaan pekerjaan antara karyawan Non-IT (*User*) dengan Tim IT seperti IT Support, Programmer, dan Network/Hardware Specialist.

Sistem mengutamakan:

* **Transparansi pekerjaan IT**
* **Kemudahan pelacakan tiket**
* **Tracking tiket seperti pengecekan resi JNE**
* **Kolaborasi antar pekerja IT**
* **Dokumentasi bukti pekerjaan**
* **Pemisahan lampiran berdasarkan tahapan pekerjaan**
* **Histori dan audit trail yang jelas**
* **Monitoring pekerjaan individu**
* **Pelaporan pekerjaan IT**
* **Kemudahan delegasi ke Vendor/Teknisi**

Tujuan akhirnya adalah menciptakan satu sumber data yang menjawab:

> **Apa masalahnya? Siapa yang meminta? Siapa yang mengerjakan? Apa yang sudah dilakukan? Apakah didelegasikan? Apa buktinya? Dan bagaimana hasil akhirnya?**

---

# 2. Prinsip Utama Sistem

Sistem dibangun berdasarkan tiga prinsip utama.

### 2.1. Mudah bagi User

User Non-IT tidak perlu memahami istilah teknis.

User cukup:

**Buat Tiket → Jelaskan Masalah → Lampirkan Bukti → Issue → Pantau**

---

### 2.2. Terkontrol bagi IT

IT mendapatkan:

**Queue → Assignment → Process → Worklog → Collaboration → Delegation → Completion**

---

### 2.3. Terukur bagi Management

Management dapat melihat:

* Jumlah tiket
* Status pekerjaan
* Beban kerja
* Durasi pengerjaan
* Pekerjaan per personel
* Pekerjaan yang didelegasikan
* Pekerjaan yang selesai
* Histori dan bukti pekerjaan

---

# 3. Manajemen Peran & Hak Akses (RBAC)

| Peran               | Deskripsi                                                             | Hak Akses Utama                                                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User (Non-IT)**   | Karyawan pelapor masalah / peminta pekerjaan                          | Membuat tiket, menyimpan draft, issue tiket, melihat status, tracking stepper, upload lampiran request, memberikan komentar, melakukan recall/reopen sesuai aturan                                                 |
| **IT Worker**       | Programmer, IT Support, Network/Hardware Specialist                   | Melihat tiket yang tersedia, mengambil tiket dari detail/kanban, mengerjakan tiket, menambahkan catatan kerja (Kirim), upload lampiran proses, delegasi, menyelesaikan tiket, export laporan pribadi                |
| **System Admin**    | Administrator aplikasi                                                | Mengelola user, kategori, subkategori, prioritas, master data. **Buat Tiket Atas Nama** user lain. Akses penuh ke semua modul termasuk Laporan dan Admin                                                          |

> **Catatan:** Tidak ada role "Admin" untuk assignment. Worker mengambil tiket sendiri dari detail atau kanban (self-assign).

> **Catatan:** Role IT Lead dan Vendor telah dihapus dari sistem. Fitur delegasi ke vendor eksternal tetap tersedia melalui menu Delegasi.

---

# 4. Konsep Status & Lifecycle

## 4.1. Stepper Flow (Detail Tiket)

Lifecycle utama tiket mengikuti **stepper** pada halaman detail:

```text
[ Created (Draft) ]        ← selalu selesai, tiket sudah dibuat
       │
       ▼
[ Issued & Assigned ]      ← worker mengambil / konfirmasi assign
       │
       ▼
[ Process (In Progress) ]  ← pengerjaan aktif, catatan kerja
       │
       ├──── [ Selesai Internal ]  ← pekerjaan IT selesai
       │          │
       │          ▼
       │    [ Delegasi ]           ← eskalasi ke vendor (opsional)
       │          │
       │          ▼
       │    kembali ke Selesai Internal
       │
       ▼
     SELESAI
```

## 4.2. Status Tiket

```text
DRAFT → PROCESS → SELESAI
                    └─→ DELEGASI (dari tahap Selesai Internal)
```

| Status    | Keterangan |
|-----------|------------|
| DRAFT     | Tiket dibuat, belum di-issue ke antrean IT |
| PROCESS   | Tiket sedang dikerjakan oleh IT Worker |
| SELESAI   | Pekerjaan dinyatakan selesai |
| DELEGASI  | Tiket didelegasikan ke vendor/teknisi eksternal |

## 4.3. Catatan Penting

**Recall bukan status lifecycle utama.**

Recall adalah sebuah **action/event** terhadap tiket yang sudah selesai atau kondisi tertentu.

Contoh:

```text
Tiket Lama
TCK-202609-001
        │
        │ Recall
        ▼
Tiket Baru
TCK-202609-015
```

Tiket baru memiliki:

```text
referenced_ticket_id = TCK-202609-001
```

Dengan demikian histori tiket lama tidak rusak atau berubah.

---

# 5. Status Tiket

## 5.1. DRAFT

Tiket sudah dibuat oleh User tetapi belum di-issue ke antrean pekerjaan IT.

User masih dapat mengubah:

* Judul
* Deskripsi
* Kategori
* Lokasi
* Attachment
* Informasi tambahan

IT Worker dapat melihat tiket Draft yang tersedia dan mengambil tiket tersebut sesuai permission.

---

## 5.2. PROCESS / ON-PROGRESS

Tiket sedang dikerjakan oleh IT.

Pada tahap ini:

* Worker ditugaskan / berkontribusi pada tiket
* Supporting Member dapat ditambahkan
* Worklog dapat dibuat (dengan stageKey IN_PROGRESS)
* Lampiran proses dapat ditambahkan
* Komentar dapat ditambahkan
* Internal Note dapat dibuat
* Tiket dapat diselesaikan (→ SELESAI)

---

## 5.3. SELESAI

Pekerjaan dinyatakan selesai.

Pada saat status menjadi `SELESAI`:

* Primary Worker tetap tersimpan
* Supporting Member dikunci
* Assignment dikunci
* Worklog tetap tersimpan
* Attachment tetap tersimpan
* Audit trail tetap tersimpan

Pada tahap Selesai Internal, worker memiliki opsi untuk **Delegasi** ke vendor jika diperlukan.

---

## 5.4. DELEGASI

Delegasi digunakan ketika penanganan membutuhkan pihak lain.

Delegasi **hanya bisa dilakukan dari tahap Selesai Internal** (status SELESAI).

Jenis delegasi:

```text
DELEGASI_VENDOR
DELEGASI_TEKNISI
```

Setelah delegasi, tiket berpindah ke status DELEGASI dan tahap Delegasi muncul di stepper.

---

# 6. Stepper & Tombol Aksi

Halaman detail tiket menggunakan **Progress Tracking Stepper** sebagai pusat UI.

## 6.1. Tahapan Stepper

| Tahap | Label | StageKey | Keterangan |
|-------|-------|----------|------------|
| 1 | Created (Draft) | REQUEST | Selalu selesai. Tiket dibuat oleh user. |
| 2 | Issued & Assigned | ASSIGN | Worker mengambil/menerima tiket |
| 3 | Process (In Progress) | IN_PROGRESS | Pengerjaan aktif & catatan kerja |
| 4 | Selesai Internal | COMPLETION | Penyelesaian tugas IT |
| 5 | Delegasi (opsional) | DELEGATION | Eskalasi ke vendor/teknisi luar |

## 6.2. Tombol Aksi per Tahap

### Tahap ASSIGN

| Tombol | Fungsi |
|--------|--------|
| **Kirim** | Menyimpan catatan kerja (worklog) tanpa mengubah status. Form input kosong setelah diklik. |
| **Konfirmasi Assign** | Majukan tiket ke tahap PROCESS (status → PROCESS). |

### Tahap IN_PROGRESS

| Tombol | Fungsi |
|--------|--------|
| **Kirim** | Menyimpan catatan kerja (worklog) tanpa mengubah status. Form input kosong setelah diklik. |
| **Selesai** | Majukan tiket ke tahap Selesai Internal (status → SELESAI). |

### Tahap COMPLETION (status SELESAI)

| Tombol | Fungsi |
|--------|--------|
| **Kirim** | Menyimpan catatan kerja (worklog) tanpa mengubah status. Form input kosong setelah diklik. |
| **Delegasi** | Majukan tiket ke tahap Delegasi (status → DELEGASI). Hanya muncul jika status belum DELEGASI. |

## 6.3. Aturan Submit

* Tombol **Kirim** hanya muncul di tahap ASSIGN dan IN_PROGRESS
* Tombol **Kirim** disabled jika textarea kosong
* Setelah klik **Kirim**, textarea dan file input otomatis kosong
* Setelah klik **Selesai** atau **Konfirmasi Assign**, textarea dan file input otomatis kosong
* Tombol aksi hanya muncul untuk role IT Worker (tidak untuk USER_NON_IT)
* Tombol aksi tidak muncul di tahap REQUEST/Created
* Tombol aksi stacked vertically di mobile, inline horizontal di desktop

---

# 7. Worklog & Catatan Kerja

## 7.1. Konsep

Worklog berfungsi sebagai **absen/check-in kerja** — mencatat bahwa worker sedang/ sudah mengerjakan tiket.

Setiap catatan kerja memiliki `stageKey` yang menunjukkan tahap mana catatan tersebut dibuat:

| stageKey | Keterangan |
|----------|------------|
| ASSIGN | Catatan saat tahap penugasan |
| IN_PROGRESS | Catatan saat tahap pengerjaan |
| COMPLETION | Catatan saat tahap penyelesaian |

## 7.2. Dua Cara Menyimpan

### Cara 1: Tombol "Kirim" (saveWorklogNote)

Menyimpan catatan **tanpa mengubah status** tiket.

```text
User ketik catatan → klik "Kirim"
  → worklog tersimpan dengan stageKey tahap saat ini
  → status tiket TIDAK berubah
  → form input (textarea + file) kosong
```

### Cara 2: Tombol "Selesai" / "Konfirmasi Assign" / "Delegasi" (completeStage)

Menyimpan catatan **sekaligus mengubah status** tiket.

```text
User ketik catatan → klik "Selesai"
  → worklog tersimpan dengan stageKey tahap saat ini
  → audit_log entry dibuat (TAHAP_[stageKey]_SELESAI)
  → status tiket berubah ke tahap berikutnya
  → form input (textarea + file) kosong
```

## 7.3. Struktur Data Worklog

```json
{
  "id": "wl-1789613906338",
  "stageKey": "IN_PROGRESS",
  "worker_id": "IT-001",
  "worker_name": "Budi Santoso",
  "date": "2026-09-17",
  "start_at": "09.58",
  "finish_at": "09.58",
  "duration_minutes": 0,
  "description": "hai",
  "created_at": "2026-09-17T02:58:34.906Z"
}
```

## 7.4. Sumber Data

Worklog menjadi sumber data utama untuk:

* Daily Work
* Weekly Report
* Monthly Report
* Productivity Report
* Export Excel
* Export PDF

---

# 8. Tracking (Riwayat Status Pelacakan)

## 8.1. Halaman Tracking

User memasukkan kode tiket (contoh: `TCK-202609-001`) dan melihat:

* Kode tiket
* Judul tiket
* Status badge (DIPROSES, SELESAI, DIDELEGASIKAN)
* Lokasi & peminta
* Deskripsi permasalahan
* **Riwayat Status Pelacakan** (timeline)

## 8.2. Riwayat Status Pelacakan

Timeline menampilkan **audit_logs** secara chronologis. Setiap card audit_log **juga menampilkan catatan/worklog** yang cocok dengan stage-nya.

```text
✓ TIKET_DRAFT_DISIMPAN
  9/11/2026, 4:00:00 PM
  Oleh: Rina Wulandari

✓ TAHAP_ASSIGN_SELESAI
  9/17/2026, 9:58:27 AM
  Oleh: Budi Santoso
  "meluncur"

✓ TAHAP_IN_PROGRESS_SELESAI
  9/17/2026, 9:58:50 AM
  Oleh: Budi Santoso
  "hai"
  "hallo"
  "cihui"

✓ TAHAP_COMPLETION_SELESAI
  9/17/2026, 9:59:00 AM
  Oleh: Budi Santoso
  "selesai sudah bisa digunakan"
```

## 8.3. Rendering Worklogs di Tracking

Catatan/worklogs ditampilkan **di dalam** card audit_log yang sesuai, bukan sebagai step terpisah.

Mapping action → stageKey:

| audit_log action | stageKey worklog |
|---|---|
| TAHAP_ASSIGN_SELESAI | ASSIGN |
| TAHAP_IN_PROGRESS_SELESAI | IN_PROGRESS |
| TAHAP_COMPLETION_SELESAI | COMPLETION |

---

# 9. Multi-Stage Attachments

Lampiran merupakan bagian penting dari sistem.

Lampiran dipisahkan berdasarkan tahapan pekerjaan.

## 9.1. REQUEST

Lampiran dari User.

Contoh:

* Foto kerusakan
* Screenshot error
* Dokumen permintaan
* Dokumen pendukung
* Bukti masalah

---

## 9.2. IN_PROGRESS

Lampiran yang dibuat ketika IT melakukan pekerjaan.

Contoh:

* Screenshot error log
* Screenshot coding
* Foto kondisi hardware
* Foto proses perbaikan
* Screenshot konfigurasi
* Bukti testing sementara

---

## 9.3. DELEGATION

Lampiran terkait proses delegasi.

Contoh:

* Form serah terima
* Tanda terima vendor
* Surat garansi
* Resi pengiriman
* Nota service
* Dokumen klaim garansi

---

## 9.4. COMPLETION

Lampiran hasil akhir.

Contoh:

* Foto perangkat setelah diperbaiki
* Screenshot fitur setelah selesai
* Screenshot hasil testing
* Bukti deployment production
* Dokumen final

---

# 10. Attachment Visibility

Selain `stage`, setiap attachment memiliki `visibility`.

```text
REQUEST
└── USER_VISIBLE

IN_PROGRESS
├── USER_VISIBLE
└── INTERNAL_ONLY

DELEGATION
├── USER_VISIBLE
└── INTERNAL_ONLY

COMPLETION
└── USER_VISIBLE
```

Hal ini penting karena tidak semua dokumen internal IT boleh dilihat User.

Contoh:

> Screenshot konfigurasi server → `INTERNAL_ONLY`

Sedangkan:

> Foto perangkat sudah diperbaiki → `USER_VISIBLE`

---

# 11. Sidebar & Navigasi

## 11.1. Sidebar Desktop (Tablet & Desktop)

```text
┌──────────────┐
│   [Logo]     │
│              │
│  📊 Dashboard│
│  📋 Tiket    │
│  🏠 My Work  │
│  📈 Tracking │
│  ➕ Buat     │
│              │
│  [◄] Toggle  │
└──────────────┘
```

* **Toggle** berada di **Navbar** (bukan di sidebar itu sendiri)
* Default: expanded (lebar penuh dengan label)
* Toggle: collapse ke **icon-only** (lebar sempit, hanya ikon)
* Transisi smooth saat expand/collapse
* Padding konten utama menyesuaikan (`md:pl-20` collapsed, `md:pl-64` expanded)

## 11.2. Sidebar Mobile

```text
┌─────────────────────┐
│ [Hamburger]  [Logo] │  ← Navbar
├─────────────────────┤
│ Overlay Backdrop    │
│ ┌─────────────────┐ │
│ │ [X] Close       │ │
│ │ 📊 Dashboard    │ │
│ │ 📋 Tiket        │ │
│ │ 🏠 My Work      │ │
│ │ 📈 Tracking     │ │
│ │ ➕ Buat Tiket   │ │
│ └─────────────────┘ │
└─────────────────────┘
```

* Hamburger button di **Navbar** (kanan)
* Klik → muncul drawer overlay dengan backdrop gelap
* **X button** di pojok kanan atas drawer untuk menutup
* Klik backdrop juga menutup sidebar
* Navigation link menutup sidebar setelah diklik

---

# 12. Mobile-First Responsive

## 12.1. Kanban Mobile

```text
┌──────────────────────────────┐
│ ← scroll horizontal →       │
│ ┌────────┐ ┌────────┐       │
│ │ DRAFT  │ │PROCESS │ ...   │
│ │        │ │        │       │
│ │ [card] │ │ [card] │       │
│ └────────┘ └────────┘       │
└──────────────────────────────┘
```

* Horizontal scroll (tanpa snap)
* Setiap kolom lebar `85vw` di mobile
* Quick status dropdown per kartu untuk pindah status

## 12.2. Table Mobile

```text
┌──────────────────────────────┐
│ ← scroll horizontal →       │
│ ┌──────────────────────────┐ │
│ │ ID  │ Title │ Status │..│ │
│ │ ... │ ...   │ ...    │   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

* Horizontal scroll hanya di mobile (`overflow-x-auto md:overflow-x-visible`)
* `min-width: 700px` agar tabel tidak terlalu sempit

## 12.3. Stepper Mobile

* Horizontal scroll dengan tombol panah
* Auto-scroll ke tahap aktif (smooth scrolling)
* Connector lines antar tahap terlihat di semua ukuran layar

## 12.4. Modal Dialog

* Semua modal menggunakan `<Teleport to="body">` agar render di root `<body>`
* Z-index `z-[9999]` untuk semua modal agar di atas elemen lain (sidebar, dropdown, navbar)
* Backdrop `bg-slate-900/60 backdrop-blur-xs`
* Contoh modal: Create Ticket Success, Catat Log Kerja, Add/Edit Kategori, Add/Edit Subkategori, Tambah User

## 12.5. Tombol Aksi Mobile

* Tombol stacked vertically di mobile (`flex-col`)
* Tombol sejajar horizontal di desktop (`sm:flex-row`)
* Setiap tombol full width di mobile
* Tombol Back (kembali) disembunyikan di mobile

## 12.6. Judul Tiket di Detail

* Di mobile: judul wrap natural (tanpa `truncate`), semua teks terlihat
* Di desktop: judul tetap `truncate` satu baris rapi
* Kode tiket ditampilkan sebagai badge mono dengan background biru

---

# 13. Informasi yang Dapat Dilihat User

User dapat melihat:

* Ticket ID (kode tiket)
* Judul
* Deskripsi
* Status
* Tanggal dibuat
* Tanggal issue
* Assigned Worker
* Supporting Member jika diizinkan
* Status delegasi
* Komentar yang bersifat user-visible
* Attachment yang bersifat user-visible
* Histori progres
* Hasil penyelesaian

User tidak dapat melihat:

* Internal Note
* Attachment `INTERNAL_ONLY`
* Informasi teknis internal yang dibatasi
* Data tiket milik user lain

---

# 14. Modul Pembuatan Tiket

Form User dibuat sesederhana mungkin.

### Informasi utama

```text
Judul
Kategori (Support IT / IT Programmer)
Subkategori (relasional berdasarkan kategori induk)
Lokasi
Prioritas (LOW / MEDIUM / HIGH / CRITICAL)
Deskripsi
Attachment
```

Contoh:

```text
Judul:
Printer Lantai 2 Tidak Bisa Print

Kategori:
Support IT

Subkategori:
Printer

Lokasi:
Lantai 2

Deskripsi:
Printer tidak dapat mencetak laporan
sejak pukul 08.00.

Attachment:
foto_printer.jpg
screenshot_error.png
```

---

# 15. Draft Ticket

Ketika User membuat tiket:

```text
SAVE DRAFT
```

sistem langsung membuat:

```text
TCK-202609-001
Status: DRAFT
```

User dapat kembali melanjutkan tiket tersebut.

Tiket baru masuk antrean resmi IT setelah:

```text
ISSUE TICKET
```

---

# 16. Issue & Take Ticket

IT Worker memiliki cara memperoleh tiket:

### 16.1. Take Ticket dari Detail

Worker membuka detail tiket, lalu klik **Konfirmasi Assign** di tahap ASSIGN.

### 16.2. Take Ticket dari Kanban

Worker mengambil tiket dari kolom DRAFT di kanban.

Setelah diambil:

```text
Assigned Worker:
Budi
```

---

# 17. Kontributor Tiket

Satu tiket memiliki beberapa kontributor yang berperan dalam pengerjaan:

### Assigned Worker

Worker yang ditugaskan menangani tiket (ditentukan saat konfirmasi assign).

### Supporting Member

Worker lain yang membantu pengerjaan.

### Worklog Contributor

Worker yang pernah mengisi catatan kerja (worklog) pada tiket, baik sebagai assigned worker maupun supporting member.

Kontribusi dicatat melalui **worklog** — setiap entry worklog memiliki `worker_id` yang menunjukkan siapa yang melakukan aktivitas.

Contoh:

```text
Assigned Worker:
Budi

Supporting Member:
Andi
Dedi

Worklog Contributors:
Budi (3 aktivitas)
Andi (1 aktivitas)
Rizal (2 aktivitas)
```

---

# 18. Aturan Lock Member

Member dapat ditambahkan selama:

```text
DRAFT
PROCESS
DELEGASI
```

Ketika tiket:

```text
SELESAI
```

maka:

```text
Add Member = Disabled
Remove Member = Disabled
```

Assignment menjadi read-only.

Histori tetap tersimpan.

---

# 19. Internal Note

IT dapat membuat catatan internal.

Contoh:

```text
INTERNAL NOTE

Kemungkinan driver printer corrupt.
Coba reinstall driver sebelum dilakukan
eskalasi ke vendor.
```

Internal Note tidak terlihat oleh User.

---

# 20. Comment

Comment digunakan untuk komunikasi antara User dan IT.

Contoh:

```text
User:
Printer sekarang sudah menyala,
tetapi masih belum bisa print.

IT:
Kami lanjut melakukan pengecekan.
```

Comment berbeda dari Worklog.

### Comment

Untuk komunikasi.

### Worklog

Untuk pencatatan aktivitas kerja / check-in kerja.

### Internal Note

Untuk komunikasi internal IT.

---

# 21. Dashboard IT Worker

Dashboard IT memiliki tiga mode tampilan.

## 21.1. Table View

Data dikelompokkan berdasarkan tanggal.

```text
HARI INI

TCK-001   Printer Rusak       Budi    PROCESS
TCK-002   User Login          Budi    SELESAI
TCK-003   ERP Error           Andi    PROCESS


KEMARIN

TCK-004   Network Down        Dedi    SELESAI
```

---

# 22. Card View

Contoh:

```text
┌─────────────────────────────┐
│ TCK-202609-001             │
│ Printer Produksi Bermasalah│
│                             │
│ HIGH                        │
│                             │
│ Budi                        │
│ 2 Members                   │
│                             │
│ 4 Attachments               │
│                             │
│ PROCESS                     │
└─────────────────────────────┘
```

---

# 23. Kanban View

Kanban:

```text
DRAFT        PROCESS       SELESAI        DELEGASI

┌──────┐     ┌──────┐      ┌──────┐       ┌──────┐
│TCK001│     │TCK004│      │TCK010│       │TCK007│
└──────┘     └──────┘      └──────┘       └──────┘

┌──────┐     ┌──────┐      ┌──────┐       ┌──────┐
│TCK002│     │TCK005│      │TCK011│       │TCK008│
└──────┘     └──────┘      └──────┘       └──────┘
```

* **Urutan kolom:** DRAFT → PROCESS → SELESAI → DELEGASI
* Drag-and-drop native HTML5 hanya diperbolehkan apabila perpindahan status sesuai dengan business rules dan permission

---

# 24. My Work

Setiap IT Worker memiliki halaman pekerjaan pribadi.

Filter:

```text
ALL
PROCESS
SELESAI
DELEGASI
DRAFT
```

Tambahan filter:

```text
Today
This Week
This Month
Overdue
Priority
Category
```

Tujuannya agar pekerja dapat langsung mengetahui:

> Apa yang masih menjadi tanggung jawab saya?

---

# 25. Daily Work

Halaman khusus pekerjaan harian dengan fitur lengkap.

## 25.1. Header

* Tombol "Catat Log Kerja" untuk menambah worklog manual
* Tombol "Ekspor Excel" untuk download rekap worklog
* Tombol "Cetak" untuk cetak laporan

## 25.2. Filter Periode

Preset cepat:

```text
Hari Ini
7 Hari Terakhir
30 Hari Terakhir
Bulan Ini
Rentang Kustom
```

Navigasi tanggal:

* Tombol mundur/maju per periode
* Input tanggal manual (Dari — Sampai)
* Filter worker (Semua Worker / individual)

## 25.3. KPI Cards

```text
Tiket Dikerjakan    Tiket Selesai    On-Progress    Total Jam Kerja
     8                  4                3              42.5 Jam
```

## 25.4. Timeline Aktivitas

Urutan kronologis catatan pengerjaan tiket oleh teknisi IT:

```text
┌─────────────────────────────────────────────────────┐
│ 📅 17 Sep 2026 │ TCK-202609-001 │ Printer Error    │
│ ⏱ 09:00 - 09:45 (45 mnt)            [Lihat Tiket] │
│ ─────────────────────────────────────────────────── │
│ Pengecekan driver printer, reinstall firmware...    │
│ 👤 Teknisi: Budi Santoso                            │
└─────────────────────────────────────────────────────┘
```

## 25.5. Modal Catat Log Kerja

Form untuk menambah worklog manual:

```text
Pilih Tiket yang Dikerjakan
Tanggal Pengerjaan
Durasi (Menit)
Jam Mulai
Jam Selesai
Rincian Aktivitas / Troubleshooting
```

## 25.6. Export Excel

Filter otomatis berdasarkan:
* Rentang tanggal yang dipilih
* Worker yang dipilih

---

# 26. Laporan Pekerja

Laporan dapat difilter berdasarkan:

* Worker
* Tanggal
* Kategori
* Status
* Departemen
* Prioritas
* Vendor
* Jenis pekerjaan

Contoh:

```text
WORK REPORT

Worker:
Budi

Periode:
01 - 30 September 2026

Total Ticket:
85

Selesai:
72

Process:
8

Delegasi:
5

Total Worklog:
126 Jam
```

---

# 27. Export

Sistem menyediakan:

### Excel

Untuk:

* Daily Work (dengan filter rentang tanggal & worker)
* Weekly Work
* Monthly Work
* Ticket List
* Worklog
* Assignment
* Delegation

### PDF

Untuk laporan formal:

* Daily Report
* Weekly Report
* Monthly Report
* Worker Performance
* Ticket Detail

---

# 28. Audit Trail

Semua aktivitas penting dicatat.

Contoh:

```text
12 Sep 09:00
Andi membuat tiket

12 Sep 09:05
Andi melakukan Issue

12 Sep 09:10
Budi mengambil tiket

12 Sep 09:15
Budi memulai pekerjaan

12 Sep 10:00
Budi menambahkan Andi sebagai member

12 Sep 11:00
Tiket didelegasikan ke Vendor ABC

12 Sep 15:00
Tiket kembali ke Process

12 Sep 16:00
Budi menyelesaikan tiket
```

Audit trail tidak dapat diubah oleh user biasa.

---

# 29. Search

Search harus menjadi fitur utama aplikasi.

### Search utama

```text
┌────────────────────────────────────────┐
│ Masukkan ID Tiket...                   │
└────────────────────────────────────────┘

             [ Cari Tiket ]
```

Format:

```text
TCK-202609-001
```

IT juga memiliki pencarian lebih luas:

```text
Ticket ID
Judul
Keyword
Requester
Worker
Kategori
Status
Tanggal
```

---

# 30. Ticket Detail & Progress Stepper-Centric

Halaman detail:

```text
┌─────────────────────────────────────────┐
│ TCK-202609-001 ← badge mono biru       │
│                                         │
│ Printer Kehabisan Tinta & Paper Jam     │
│ Status: PROCESS    Worker: Budi         │
└─────────────────────────────────────────┘
```

**Core UI/UX Concept:** Progress Tracking Stepper adalah pusat utama (main content) dari detail tiket.
Setiap tahapan pada stepper memuat informasi detail dan lampiran terkait secara langsung:
- **Created**: Tanggal/waktu, pembuat tiket, dan lampiran foto/request awal.
- **Issued & Assigned**: Waktu issue, siapa yang melakukan issue, serta assignment worker.
- **Process**: Log pengerjaan (worklog), catatan kerja, dan lampiran foto proses/progress.
- **Selesai Internal**: Hasil akhir, dan lampiran completion.
- **Delegation** (jika ada): Info vendor/teknisi, surat jalan, resi, dan lampiran delegasi.

### Catatan & Histori per Tahap

Panel detail menampilkan lampiran dan catatan/worklog per tahap:

```text
Lampiran / Bukti pada Tahap Ini:
├── foto_proses.jpg — Oleh: Budi — 1.8 MB
└── log_printer.txt — Oleh: Budi — 45 KB

Catatan & Histori pada Tahap Ini:
├── Oleh: Budi Santoso — 9/17/2026, 9:02 AM
│   "meluncur"
├── Oleh: Budi Santoso — 9/17/2026, 9:03 AM
│   "sedang dikerjakan"
└── Oleh: Budi Santoso — 9/17/2026, 9:04 AM
    "selesai"
```

---

# 31. Navbar & Role Switcher

## 31.1. Komponen Navbar

* Toggle sidebar button (hamburger)
* Judul tab aktif
* Role switcher dropdown (untuk testing)
* Tombol "Buat Tiket"
* Toggle dark mode

## 31.2. Role Switcher

Fitur testing untuk beralih antar role pengguna:

* Klik avatar/nama → dropdown muncul
* Tampilkan daftar semua user dengan role badge
* Klik user → switch role aktif
* Jika tab baru tidak diizinkan → redirect ke tab pertama yang diizinkan

## 31.3. Tombol "Buat Tiket"

* Teks "Buat Tiket" disembunyikan di mobile (`hidden sm:inline`)
* Hanya ikon PlusCircle yang tampil di mobile

---

# 32. Notifikasi Toast

Sistem notifikasi menggunakan komponen toast (bukan alert() browser).

## 32.1. Jenis Toast

| Type | Warna | Icon |
|------|-------|------|
| success | hijau | ✓ |
| error | merah | ✗ |
| info | biru | ℹ |

## 32.2. Perilaku

* Muncul di pojok kanan atas
* Auto-dismiss setelah 3 detik
* Bisa di-dismiss manual (klik ×)
* Animasi enter/exit (slide + fade)
* Menggantikan penggunaan `alert()` sebelumnya

---

# 33. Struktur Data Utama

```json
{
  "ticket": {
    "id": "TCK-202609-001",
    "title": "Printer Kehabisan Tinta & Paper Jam",
    "description": "Printer Lantai 2 tidak bisa print laporan",

    "category": "Support IT",
    "subcategory": "Printer",

    "status": "PROCESS",

    "created_by": "USR-001",
    "created_by_name": "Rina Wulandari",
    "created_by_dept": "Finance & Accounting",
    "created_by_admin_id": null,
    "created_by_admin_name": null,

    "requestedBy": "USR-001",
    "requestedByName": "Rina Wulandari",
    "requestedByDept": "Finance & Accounting",

    "assignedTo": "IT-001",
    "assignedToName": "Budi Santoso",

    "supporting_members": ["Andi Pratama", "Dedi Kurniawan"],
    "supporting_member_details": [
      { "id": "IT-002", "name": "Andi Pratama" },
      { "id": "IT-003", "name": "Dedi Kurniawan" }
    ],

    "delegation": null,

    "referenced_ticket_id": null,

    "attachments": [
      {
        "id": "ATT-001",
        "stage": "REQUEST",
        "visibility": "USER_VISIBLE",
        "file_name": "foto_printer_berkedip_merah.jpg",
        "file_size": "2.4 MB",
        "uploaded_by": "USR-001",
        "uploaded_by_name": "Rina Wulandari",
        "uploaded_at": "2026-09-11T09:02:00Z"
      }
    ],

    "worklogs": [
      {
        "id": "wl-1789613906338",
        "stageKey": "IN_PROGRESS",
        "worker_id": "IT-001",
        "worker_name": "Budi Santoso",
        "date": "2026-09-17",
        "start_at": "09.58",
        "finish_at": "09.58",
        "duration_minutes": 0,
        "description": "hai",
        "created_at": "2026-09-17T02:58:34.906Z"
      }
    ],

    "comments": [],
    "internal_notes": [],

    "audit_logs": [
      {
        "id": "aud-001",
        "action": "TIKET_DRAFT_DISIMPAN",
        "performed_at": "2026-09-11T09:00:00Z",
        "performed_by": "USR-001",
        "performed_by_name": "Rina Wulandari",
        "notes": null
      },
      {
        "id": "aud-002",
        "action": "TAHAP_ASSIGN_SELESAI",
        "performed_at": "2026-09-17T02:58:26.337Z",
        "performed_by": "IT-001",
        "performed_by_name": "Budi Santoso",
        "notes": "meluncur"
      }
    ],

    "created_at": "2026-09-11T09:00:00Z",
    "completed_at": null
  }
}
```

---

# 34. Entity Utama Database

Minimal sistem membutuhkan entity:

```text
users
roles
permissions

tickets

ticket_members
ticket_assignments

ticket_attachments

ticket_comments
ticket_internal_notes

ticket_worklogs

ticket_delegations

ticket_history (audit_logs)

categories
subcategories

vendors
technicians

notifications
```

---

# 35. Aturan Bisnis Utama

### Rule 01

Ticket ID bersifat unik dan tidak berubah.

### Rule 02

Draft belum dianggap pekerjaan aktif.

### Rule 03

Issue membuat tiket masuk ke antrean pekerjaan.

### Rule 04

Setiap tiket memiliki satu Assigned Worker.

### Rule 05

Ticket dapat memiliki banyak Supporting Member.

### Rule 06

Member dapat ditambahkan selama tiket belum `SELESAI`.

### Rule 07

Setelah `SELESAI`, assignment dan member dikunci.

### Rule 08

Delegasi tidak menghilangkan histori pekerjaan internal IT.

### Rule 09

Delegasi hanya bisa dilakukan dari tahap Selesai Internal (status SELESAI).

### Rule 10

Recall tidak menghapus tiket lama.

### Rule 11

Recall menghasilkan Ticket ID baru.

### Rule 12

Tiket baru hasil Recall memiliki hubungan `referenced_ticket_id`.

### Rule 13

Audit Trail tidak dapat dihapus oleh user biasa.

### Rule 14

Worklog menjadi bagian dari histori pekerjaan.

### Rule 15

Internal Note tidak terlihat oleh User.

### Rule 16

Attachment memiliki stage dan visibility.

### Rule 17

Tiket yang sudah selesai dapat di-Reopen jika User menyatakan masalah belum selesai, sesuai permission.

### Rule 18

Kirim (saveWorklogNote) hanya menyimpan worklog tanpa mengubah status.

### Rule 19

Selesai/Konfirmasi Assign/Delegasi (completeStage) menyimpan worklog sekaligus mengubah status.

### Rule 20

Setelah klik tombol aksi (Kirim/Selesai/Konfirmasi/Delegasi), form input (textarea + file) otomatis kosong.

### Rule 21

Saat pindah tab, `selectedTicketId` dan `selectedTicket` otomatis dibersihkan dari URL dan state.

### Rule 22

SYSTEM_ADMIN dapat membuat tiket atas nama user lain menggunakan fitur "Buat Atas Nama". Field `created_by_admin_id` dan `created_by_admin_name` dicatat untuk audit trail.

### Rule 23

Ketika tiket dibuat atas nama user lain, audit trail `DIBUAT_ATAS_NAMA` otomatis ditambahkan.

### Rule 24

Semua modal dialog menggunakan `<Teleport to="body">` dengan `z-[9999]` agar konsisten dan tidak tertimpa elemen lain.

---

# 36. Prinsip UX User Non-IT

Form User harus sederhana.

User **tidak wajib mengetahui**:

* Root Cause
* Server
* Database
* Environment
* Stack Trace
* Technical Severity
* Deployment

User cukup menjelaskan:

> **Apa yang terjadi?**

IT kemudian menentukan informasi teknis.

---

# 37. Prinsip UX IT Worker

IT Worker juga tidak boleh dibebani form panjang.

Flow utama:

```text
Ambil Tiket / Konfirmasi Assign
      ↓
Kirim catatan (check-in kerja)
      ↓
Kirim catatan lagi saat bekerja
      ↓
Selesaikan (tombol Selesai)
      ↓
Delegasi jika diperlukan (tombol Delegasi)
```

Detail teknis hanya diisi ketika memang diperlukan.

---

# 38. Roadmap Pengembangan

## Phase 1 — Core Ticketing

* ~~Authentication~~
* ~~RBAC~~
* ~~User Management~~
* ~~Create Ticket~~
* ~~Draft~~
* ~~Issue~~
* ~~Take Ticket (Self-Assign)~~
* ~~Assignment~~
* ~~Status~~
* ~~Attachment~~
* ~~Ticket Detail~~
* ~~Search~~
* ~~Ticket History~~

## Phase 2 — Work Management

* ~~Supporting Member~~
* ~~Worklog (with stageKey)~~
* ~~Save Worklog Note (saveWorklogNote)~~
* ~~My Work~~
* ~~Daily Work~~
* ~~Table View~~
* ~~Card View~~
* ~~Kanban (Drag & Drop)~~
* ~~Comment~~
* ~~Internal Note~~
* ~~Sidebar Responsive (Collapse/Expand)~~
* ~~Mobile-First Responsive~~

## Phase 3 — Collaboration

* ~~Delegation~~
* ~~Vendor (master data untuk delegasi)~~
* ~~Technician~~
* ~~Toast Notification System~~
* ~~Role Switcher (testing)~~
* Reopen
* User Confirmation

## Phase 4 — Management

* ~~Dashboard (IT Kanban + Table)~~
* ~~Workload (My Work + Daily Work)~~
* ~~SLA~~ (dihapus)
* Analytics
* ~~Reports (Laporan & Export)~~
* ~~Excel Export~~
* ~~PDF Export~~
* ~~Admin Master Data (Kategori, Subkategori, Prioritas, User)~~
* ~~Buat Tiket Atas Nama (Admin On Behalf)~~
* ~~AppSelect Component (menggantikan select native)~~

---

# 39. Definition of Done — MVP

MVP dinyatakan berhasil apabila:

* ~~User dapat login.~~
* ~~User dapat membuat tiket.~~
* ~~User dapat menyimpan Draft.~~
* ~~Sistem memberikan Ticket ID.~~
* ~~User dapat Issue Ticket.~~
* ~~IT dapat melihat tiket tersedia.~~
* ~~IT dapat mengambil tiket (self-assign).~~
* ~~Ticket memiliki Primary Worker~~ → Assigned Worker (kontributor model)
* ~~Ticket dapat memiliki Supporting Member.~~
* ~~User dapat mengunggah foto/dokumen.~~
* ~~IT dapat mengunggah attachment berdasarkan stage.~~
* ~~Attachment memiliki visibility.~~
* ~~Ticket memiliki tracking stepper.~~
* ~~User dapat melihat progres tiket.~~
* ~~IT dapat membuat Worklog (check-in/absen).~~
* ~~IT dapat menyimpan catatan tanpa mengubah status (Kirim).~~
* ~~IT dapat menyelesaikan tiket (Selesai).~~
* ~~IT dapat mendelegasikan tiket (Delegasi).~~
* ~~IT memiliki My Work.~~
* ~~Tersedia Table View.~~
* ~~Tersedia Card View.~~
* ~~Tersedia Kanban View (Drag & Drop).~~
* ~~Ticket memiliki Audit Trail.~~
* ~~Tracking menampilkan catatan worklog di dalam card audit_log.~~
* ~~Supporting Member terkunci setelah selesai.~~
* ~~Sidebar responsive (collapse/expand).~~
* ~~Mobile-first responsive design.~~
* ~~Ticket ID ditampilkan di halaman detail.~~
* ~~Form input kosong setelah submit.~~
* ~~Toast notification (menggantikan alert()).~~
* ~~Daily Work dengan filter periode, KPI, timeline, dan modal catat worklog.~~
* ~~Export Excel dengan filter rentang tanggal & worker.~~
* ~~Role switcher untuk testing.~~
* ~~Tombol Back disembunyikan di mobile.~~
* ~~Judul tiket wrap natural di mobile.~~
* ~~Tombol aksi stacked di mobile.~~
* ~~Kode tiket ditampilkan sebagai badge mono biru.~~
* ~~URL state bersih saat pindah tab.~~
* ~~SYSTEM_ADMIN dapat membuat tiket atas nama user lain.~~
* ~~Laporan & Export dengan 3 tab (Rekapitulasi Tiket, Log Pekerjaan, Ringkasan Per Teknisi).~~
* ~~Admin Master Data (Kategori, Subkategori, Prioritas, User).~~
* ~~AppSelect component (menggantikan select native).~~
* ~~Semua modal menggunakan Teleport to body + z-[9999].~~
* ~~Contributor model (assigned + supporting + worklog writer).~~
* ~~Prioritas tiket: LOW, MEDIUM, HIGH, CRITICAL (tanpa URGENT).~~
* ~~Kategori: Support IT & IT Programmer (model relasional).~~
* Recall menghasilkan Ticket ID baru dengan referensi tiket lama.
* User tidak dapat melihat Internal Note dan attachment internal.

---

# 40. Konsep Produk

Sistem ini bukan sekadar:

> **Aplikasi Pengaduan IT**

tetapi:

> **IT Ticketing & Work Monitoring System**

Dengan dua pengalaman utama:

### User

```text
SEARCH
   ↓
CREATE
   ↓
ISSUE
   ↓
TRACK
   ↓
CONFIRM
```

### IT

```text
QUEUE
   ↓
TAKE / ASSIGN
   ↓
PROCESS
   ↓
KIRIM (check-in kerja)
   ↓
SELESAI
   ↓
DELEGASI (jika perlu)
   ↓
REPORT
```

Dan untuk Management:

```text
MONITOR
   ↓
ANALYZE
   ↓
REPORT
   ↓
IMPROVE
```

**Prinsip akhirnya:**

> **User mendapatkan kemudahan.
> IT mendapatkan kontrol.
> Management mendapatkan visibility.
> Setiap pekerjaan memiliki histori dan bukti.**
