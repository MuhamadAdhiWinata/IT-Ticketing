# Product Requirement Document (PRD)

# Sistem Information Technology Ticketing & Work Monitoring

## IT-Ticketing

**Versi:** 1.1
**Platform:** Web Application
**Target Pengguna:** Karyawan Non-IT, IT Support, Programmer, Teknisi Internal, IT Lead/Admin, dan Vendor

---

# 1. Ringkasan Eksekutif & Tujuan

Sistem **IT-Ticketing** dirancang untuk menjadi pusat komunikasi, pencatatan, monitoring, dan pengelolaan pekerjaan antara karyawan Non-IT (*User*) dengan Tim IT seperti IT Support, Programmer, Network/Hardware Specialist, maupun pihak eksternal seperti Teknisi dan Vendor.

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
| **IT Worker**       | Programmer, IT Support, Network/Hardware Specialist, Teknisi Internal | Melihat tiket yang tersedia, mengambil tiket, menerima assignment, mengerjakan tiket, menambah supporting member, upload lampiran proses, worklog, komentar, delegasi, menyelesaikan tiket, export laporan pribadi |
| **IT Admin / Lead** | Supervisor / Manager IT                                               | Seluruh akses IT Worker + assignment/reassignment, pengelolaan master data, monitoring workload, Kanban tim, SLA, laporan tim                                                                                      |
| **Vendor**          | Pihak eksternal yang menerima delegasi pekerjaan                      | Hanya melihat dan memperbarui tiket yang didelegasikan kepadanya sesuai permission                                                                                                                                 |
| **System Admin**    | Administrator aplikasi                                                | Mengelola user, role, permission, kategori, vendor, teknisi, konfigurasi sistem                                                                                                                                    |

---

# 4. Konsep Status & Lifecycle

Lifecycle utama tiket:

```text
[ DRAFT ]
     │
     ▼
[ PROCESS / ON-PROGRESS ]
     │
     ├──────────────► [ DELEGASI ]
     │                    │
     │                    ▼
     │              kembali ke PROCESS
     │
     ▼
[ SELESAI ]
```

## Catatan Penting

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

* Primary Worker ditentukan
* Supporting Member dapat ditambahkan
* Worklog dapat dibuat
* Lampiran proses dapat ditambahkan
* Komentar dapat ditambahkan
* Internal Note dapat dibuat
* Tiket dapat didelegasikan

---

## 5.3. DELEGASI

Delegasi digunakan ketika penanganan membutuhkan pihak lain.

Jenis delegasi:

```text
DELEGASI_VENDOR
DELEGASI_TEKNISI
```

Contoh:

```text
IT Internal
     │
     ▼
Vendor Printer
     │
     ▼
Service Center
```

Setelah penanganan pihak tersebut selesai, tiket dapat kembali ke:

```text
PROCESS
```

atau langsung:

```text
SELESAI
```

tergantung kebutuhan pekerjaan.

---

## 5.4. SELESAI

Pekerjaan dinyatakan selesai.

Pada saat status menjadi `SELESAI`:

* Primary Worker tetap tersimpan
* Supporting Member dikunci
* Assignment dikunci
* Worklog tetap tersimpan
* Attachment tetap tersimpan
* Audit trail tetap tersimpan

Opsi tambahan:

> User dapat melakukan **Konfirmasi Selesai**.

Jika User menyatakan masalah belum selesai:

```text
SELESAI
   ↓
REOPEN
   ↓
PROCESS
```

---

# 6. Recall

Recall bukan penghapusan tiket.

Jika sebuah kasus lama membutuhkan penanganan baru, sistem membuat tiket baru.

Contoh:

```text
TCK-202609-001
Printer rusak
SELESAI

        ↓ RECALL

TCK-202609-025
Printer kembali rusak
PROCESS
```

Tiket baru memiliki:

```text
referenced_ticket_id:
TCK-202609-001
```

Sehingga hubungan antar kasus tetap dapat dilacak.

---

# 7. Multi-Stage Attachments

Lampiran merupakan bagian penting dari sistem.

Lampiran dipisahkan berdasarkan tahapan pekerjaan.

## 7.1. REQUEST

Lampiran dari User.

Contoh:

* Foto kerusakan
* Screenshot error
* Dokumen permintaan
* Dokumen pendukung
* Bukti masalah

---

## 7.2. IN_PROGRESS

Lampiran yang dibuat ketika IT melakukan pekerjaan.

Contoh:

* Screenshot error log
* Screenshot coding
* Foto kondisi hardware
* Foto proses perbaikan
* Screenshot konfigurasi
* Bukti testing sementara

---

## 7.3. DELEGATION

Lampiran terkait proses delegasi.

Contoh:

* Form serah terima
* Tanda terima vendor
* Surat garansi
* Resi pengiriman
* Nota service
* Dokumen klaim garansi

---

## 7.4. COMPLETION

Lampiran hasil akhir.

Contoh:

* Foto perangkat setelah diperbaiki
* Screenshot fitur setelah selesai
* Screenshot hasil testing
* Bukti deployment production
* Dokumen final

---

# 8. Attachment Visibility

Selain `stage`, setiap attachment memiliki `visibility`.

Contoh:

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

# 9. Ticket Tracking seperti Resi JNE

Halaman tracking merupakan fitur utama.

User memasukkan:

```text
TCK-202609-001
```

Kemudian sistem menampilkan:

```text
TCK-202609-001

Printer Kehabisan Tinta & Paper Jam
```

### Tracking Stepper

```text
✓ Tiket Dibuat
  12 Sep 2026 09:00

✓ Tiket Di-issue
  12 Sep 2026 09:05

✓ Sedang Diproses
  12 Sep 2026 09:15

✓ Didelegasikan ke Vendor
  12 Sep 2026 11:00

● Menunggu Hasil Vendor

○ Selesai
```

Jika tidak ada delegasi:

```text
✓ Dibuat
✓ Di-issue
✓ Diproses
● Selesai
```

---

# 10. Informasi yang Dapat Dilihat User

User dapat melihat:

* Ticket ID
* Judul
* Deskripsi
* Status
* Tanggal dibuat
* Tanggal issue
* Primary Worker
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

# 11. Modul Pembuatan Tiket

Form User dibuat sesederhana mungkin.

### Informasi utama

```text
Judul
Kategori
Subkategori
Lokasi
Deskripsi
Attachment
```

Contoh:

```text
Judul:
Printer Lantai 2 Tidak Bisa Print

Kategori:
Hardware

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

# 12. Draft Ticket

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

# 13. Issue & Take Ticket

IT Worker memiliki dua cara memperoleh tiket.

### 13.1. Issue to Worker

Supervisor:

```text
Ticket
   ↓
Assign
   ↓
Budi
```

### 13.2. Take Ticket

Worker melihat:

```text
AVAILABLE TICKETS

TCK-202609-001
Printer Bermasalah

[ Ambil Tiket ]
```

Setelah diambil:

```text
Primary Worker:
Budi
```

---

# 14. Primary Worker & Supporting Member

Satu tiket memiliki:

### Primary Worker

Orang yang bertanggung jawab terhadap tiket.

### Supporting Member

Orang lain yang membantu pengerjaan.

Contoh:

```text
Primary Worker
Budi

Supporting Member
Andi
Dedi
Rizal
```

---

# 15. Aturan Lock Member

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

# 16. Worklog

Setiap pekerja dapat mencatat aktivitas pekerjaan.

Contoh:

```text
Tanggal:
12 September 2026

Start:
09:15

Finish:
09:45

Durasi:
30 menit

Aktivitas:
Melakukan pengecekan koneksi printer.
Ditemukan kabel LAN rusak.
```

Worklog menjadi sumber data utama untuk:

* Daily Work
* Weekly Report
* Monthly Report
* Productivity Report
* Export Excel
* Export PDF

---

# 17. Internal Note

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

# 18. Comment

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

Untuk pencatatan aktivitas pekerjaan.

### Internal Note

Untuk komunikasi internal IT.

---

# 19. Dashboard IT Worker

Dashboard IT memiliki tiga mode tampilan.

## 19.1. Table View

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

# 20. Card View

Contoh:

```text
┌─────────────────────────────┐
│ TCK-202609-001             │
│ Printer Produksi Bermasalah│
│                             │
│ HIGH                        │
│                             │
│ 👤 Budi                     │
│ 👥 2 Members                │
│                             │
│ 📎 4 Attachments            │
│                             │
│ PROCESS                     │
└─────────────────────────────┘
```

---

# 21. Kanban View

Kanban:

```text
DRAFT        PROCESS       DELEGASI       SELESAI

┌──────┐     ┌──────┐      ┌──────┐       ┌──────┐
│TCK001│     │TCK004│      │TCK007│       │TCK010│
└──────┘     └──────┘      └──────┘       └──────┘

┌──────┐     ┌──────┐      ┌──────┐       ┌──────┐
│TCK002│     │TCK005│      │TCK008│       │TCK011│
└──────┘     └──────┘      └──────┘       └──────┘
```

Drag-and-drop hanya diperbolehkan apabila perpindahan status sesuai dengan business rules dan permission.

---

# 22. My Work

Setiap IT Worker memiliki halaman pekerjaan pribadi.

Filter:

```text
ALL
DRAFT
PROCESS
DELEGASI
SELESAI
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

# 23. Daily Work

Halaman khusus pekerjaan harian.

```text
12 September 2026

Total Ticket       8
Process            3
Selesai            4
Delegasi           1
```

Detail:

```text
09:00 - 09:30
TCK-001
Printer Produksi

09:45 - 10:20
TCK-003
User Login

10:30 - 12:00
TCK-007
ERP Error
```

---

# 24. Dashboard IT Lead

IT Lead dapat melihat:

```text
TOTAL TICKET       125

DRAFT               12
PROCESS             35
DELEGASI             8
SELESAI             70
```

Kemudian workload:

```text
Budi       8 ticket
Andi       5 ticket
Dedi       7 ticket
Rizal      3 ticket
```

---

# 25. Laporan Pekerja

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

# 26. Export

Sistem menyediakan:

### Excel

Untuk:

* Daily Work
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

# 27. Audit Trail

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

# 28. Search

Search harus menjadi fitur utama aplikasi.

### Search utama

```text
┌────────────────────────────────────────┐
│ 🔍 Masukkan ID Tiket...                │
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

# 29. Ticket Detail & Progress Stepper-Centric Attachment
 
 Halaman detail:
 
 ```text
 TCK-202609-001
 
 Printer Kehabisan Tinta & Paper Jam
 
 Status:
 PROCESS
 
 Primary Worker:
 Budi
 
 Supporting:
 Andi
 Dedi
 ```
 
 **Core UI/UX Concept:**
 Progress Tracking Stepper adalah pusat utama (main content) dari detail tiket. 
 Setiap tahapan pada stepper memuat informasi detail dan lampiran terkait secara langsung:
 - **Created**: Tanggal/waktu, pembuat tiket, dan lampiran foto/request awal.
 - **Issued**: Waktu issue, siapa yang melakukan issue, serta assignment worker/primary worker & supporting.
 - **Process**: Log pengerjaan (worklog), catatan, dan lampiran foto proses/progress (`IN_PROGRESS`).
 - **Delegation** (jika ada): Info vendor/teknisi, surat jalan, resi, dan lampiran delegasi.
 - **Completed**: Hasil akhir, konfirmasi user, dan lampiran completion.

---

# 30. Struktur Data Utama

```json
{
  "ticket": {
    "id": "TCK-202609-001",
    "title": "Printer Kehabisan Tinta & Paper Jam",
    "description": "Printer Lantai 2 tidak bisa print laporan",

    "category": "Hardware",
    "subcategory": "Printer",

    "status": "PROCESS",

    "created_by": "USER-001",

    "primary_worker_id": "IT-001",

    "supporting_members": [
      "IT-002",
      "IT-003"
    ],

    "delegation": {
      "type": null,
      "vendor_id": null,
      "technician_id": null,
      "delegated_at": null,
      "returned_at": null
    },

    "referenced_ticket_id": null,

    "attachments": [
      {
        "stage": "REQUEST",
        "visibility": "USER_VISIBLE",
        "file_name": "foto_error_user.jpg",
        "file_url": "...",
        "uploaded_by": "USER-001",
        "uploaded_at": "2026-09-12T09:00:00Z"
      },
      {
        "stage": "IN_PROGRESS",
        "visibility": "INTERNAL_ONLY",
        "file_name": "foto_bongkar_printer.jpg",
        "file_url": "...",
        "uploaded_by": "IT-001",
        "uploaded_at": "2026-09-12T10:15:00Z"
      },
      {
        "stage": "DELEGATION",
        "visibility": "USER_VISIBLE",
        "file_name": "tanda_terima_vendor.pdf",
        "file_url": "...",
        "uploaded_by": "IT-001",
        "uploaded_at": "2026-09-12T11:00:00Z"
      }
    ],

    "worklogs": [
      {
        "worker_id": "IT-001",
        "start_at": "2026-09-12T10:00:00Z",
        "finish_at": "2026-09-12T10:30:00Z",
        "duration_minutes": 30,
        "description": "Melakukan pengecekan koneksi printer."
      }
    ],

    "created_at": "2026-09-12T09:00:00Z",
    "completed_at": null
  }
}
```

---

# 31. Entity Utama Database

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

ticket_history

categories
subcategories

vendors
technicians

notifications
```

---

# 32. Aturan Bisnis Utama

### Rule 01

Ticket ID bersifat unik dan tidak berubah.

### Rule 02

Draft belum dianggap pekerjaan aktif.

### Rule 03

Issue membuat tiket masuk ke antrean pekerjaan.

### Rule 04

Setiap tiket memiliki satu Primary Worker.

### Rule 05

Ticket dapat memiliki banyak Supporting Member.

### Rule 06

Member dapat ditambahkan selama tiket belum `SELESAI`.

### Rule 07

Setelah `SELESAI`, assignment dan member dikunci.

### Rule 08

Delegasi tidak menghilangkan histori pekerjaan internal IT.

### Rule 09

Recall tidak menghapus tiket lama.

### Rule 10

Recall menghasilkan Ticket ID baru.

### Rule 11

Tiket baru hasil Recall memiliki hubungan `referenced_ticket_id`.

### Rule 12

Audit Trail tidak dapat dihapus oleh user biasa.

### Rule 13

Worklog menjadi bagian dari histori pekerjaan.

### Rule 14

Internal Note tidak terlihat oleh User.

### Rule 15

Attachment memiliki stage dan visibility.

### Rule 16

Tiket yang sudah selesai dapat di-Reopen jika User menyatakan masalah belum selesai, sesuai permission.

---

# 33. Prinsip UX User Non-IT

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

# 34. Prinsip UX IT Worker

IT Worker juga tidak boleh dibebani form panjang.

Flow utama:

```text
Ambil Tiket
      ↓
Mulai Pekerjaan
      ↓
Worklog
      ↓
Update / Attachment
      ↓
Delegasi jika diperlukan
      ↓
Selesaikan
```

Detail teknis hanya diisi ketika memang diperlukan.

---

# 35. Roadmap Pengembangan

## Phase 1 — Core Ticketing

* Authentication
* RBAC
* User Management
* Create Ticket
* Draft
* Issue
* Take Ticket
* Assignment
* Status
* Attachment
* Ticket Detail
* Search
* Ticket History

## Phase 2 — Work Management

* Supporting Member
* Worklog
* My Work
* Daily Work
* Table View
* Card View
* Kanban
* Comment
* Internal Note

## Phase 3 — Collaboration

* Delegation
* Vendor
* Technician
* Reopen
* User Confirmation
* Notification

## Phase 4 — Management

* Dashboard
* Workload
* SLA
* Analytics
* Reports
* Excel Export
* PDF Export

---

# 36. Definition of Done — MVP

MVP dinyatakan berhasil apabila:

* User dapat login.
* User dapat membuat tiket.
* User dapat menyimpan Draft.
* Sistem memberikan Ticket ID.
* User dapat Issue Ticket.
* IT dapat melihat tiket tersedia.
* IT dapat mengambil tiket.
* Supervisor dapat melakukan assignment.
* Ticket memiliki Primary Worker.
* Ticket dapat memiliki Supporting Member.
* User dapat mengunggah foto/dokumen.
* IT dapat mengunggah attachment berdasarkan stage.
* Attachment memiliki visibility.
* Ticket memiliki tracking stepper.
* User dapat melihat progres tiket.
* IT dapat membuat Worklog.
* IT memiliki My Work.
* Tersedia Table View.
* Tersedia Card View.
* Tersedia Kanban View.
* Ticket memiliki Audit Trail.
* Ticket dapat didelegasikan.
* Ticket dapat diselesaikan.
* Supporting Member terkunci setelah selesai.
* Recall menghasilkan Ticket ID baru dengan referensi tiket lama.
* IT dapat melakukan export laporan.
* User tidak dapat melihat Internal Note dan attachment internal.

---

# 37. Konsep Produk

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
WORKLOG
   ↓
COLLABORATE
   ↓
DELEGATE
   ↓
COMPLETE
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
