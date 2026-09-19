# API Contract Specification

Dokumen ini berisi spesifikasi kontrak API lengkap untuk sistem **IT Ticketing & Work Monitoring**. Kontrak ini dirancang berdasarkan analisis menyeluruh terhadap seluruh fungsionalitas frontend (Store, Views, Components, Types, dan Utils).

---

## DAFTAR ISI

1. [Format Standar Response & Error](#1-format-standar-response--error)
2. [Authentication & Users](#2-authentication--users)
3. [Tickets (Core Ticketing & Lifecycle)](#3-tickets-core-ticketing--lifecycle)
4. [Ticket Sub-Entities (Worklogs, Attachments, Comments, Notes)](#4-ticket-sub-entities-worklogs-attachments-comments-notes)
5. [Master Data — Categories & Subcategories](#5-master-data--categories--subcategories)
6. [Master Data — Vendors & Technicians](#6-master-data--vendors--technicians)
7. [Reports & Analytics](#7-reports--analytics)
8. [Dashboard & Workload](#8-dashboard--workload)
9. [User Preferences](#9-user-preferences)
10. [File Upload](#10-file-upload)

---

## 1. FORMAT STANDAR RESPONSE & ERROR

### Success Response (Single Object)
```json
{
  "success": true,
  "data": { ... }
}
```

### Success Response (Array / List)
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Judul tiket dan deskripsi wajib diisi.",
    "details": []
  }
}
```

---

## 2. AUTHENTICATION & USERS

### `GET /api/auth/me`
* **Description**: Mendapatkan informasi user yang sedang aktif (current session).
* **Response** `200`:
```json
{
  "success": true,
  "data": {
    "id": "ADMIN-001",
    "name": "Administrator IT",
    "email": "sysadmin@company.co.id",
    "role": "SYSTEM_ADMIN",
    "department": "Enterprise IT Governance",
    "avatarUrl": "https://..."
  }
}
```

### `POST /api/auth/switch-user`
* **Description**: Berpindah akun untuk keperluan testing / simulasi role (Role Switcher di Navbar).
* **Request Body**:
```json
{
  "userId": "IT-001"
}
```
* **Response** `200`: Mengembalikan data user baru yang aktif.

### `GET /api/users`
* **Description**: Mengambil daftar seluruh pengguna sistem.
* **Query Parameters**:
  - `role` (optional): `USER_NON_IT | IT_WORKER | SYSTEM_ADMIN`
  - `department` (optional): string
* **Response** `200`: Array `AppUser[]`.

### `POST /api/users`
* **Description**: Menambah pengguna baru (dari AdminMasterView).
* **Request Body**:
```json
{
  "id": "USR-007",
  "name": "Ahmad Fauzi",
  "email": "ahmad.fauzi@company.co.id",
  "department": "HR & General Affairs",
  "role": "USER_NON_IT",
  "avatarUrl": "https://..."
}
```
* **Response** `201`: Object `AppUser` yang baru dibuat.

### `PUT /api/users/:id`
* **Description**: Mengupdate data pengguna.
* **Request Body**: Partial `AppUser`.
* **Response** `200`: Object `AppUser` yang diperbarui.

### `DELETE /api/users/:id`
* **Description**: Menghapus pengguna.
* **Response** `200`: `{ "success": true }`

---

## 3. TICKETS (CORE TICKETING & LIFECYCLE)

### `GET /api/tickets`
* **Description**: Mengambil daftar seluruh tiket dengan opsi filter server-side.
* **Query Parameters**:
  - `status`: `DRAFT | PROCESS | DELEGASI | SELESAI`
  - `priority`: `LOW | MEDIUM | HIGH | CRITICAL`
  - `category`: `Support IT | IT Programmer`
  - `workerId`: string (assigned worker)
  - `search`: string (pencarian ID atau judul)
  - `startDate`, `endDate`: YYYY-MM-DD
  - `page`, `limit`: pagination
* **Response** `200`: Array `Ticket[]` (dengan nested worklogs, attachments, audit_logs).

### `GET /api/tickets/:id`
* **Description**: Mengambil detail satu tiket berdasarkan ID.
* **Response** `200`: Object `Ticket` lengkap.

### `POST /api/tickets`
* **Description**: Membuat tiket baru (bisa sebagai draft atau langsung issue, dan bisa atas nama user lain jika SYSTEM_ADMIN).
* **Called From**: `CreateTicketView.handleSubmit()`
* **Request Body**:
```json
{
  "title": "Printer Lantai 2 Macet",
  "category": "Support IT",
  "subcategory": "Printer",
  "location": "Lantai 2, Ruang Finance",
  "priority": "HIGH",
  "description": "Printer tidak bisa cetak warna sejak pagi.",
  "shouldIssue": true,
  "behalfUserId": "USR-001",
  "attachments": [
    {
      "stage": "REQUEST",
      "visibility": "USER_VISIBLE",
      "file_name": "error.png",
      "file_size": "1.2 MB"
    }
  ]
}
```
* **Server Logic**:
  - Generate `id` unik (format `TCK-YYYYMM-XXX`)
  - Generate `ticket_number` (format `TIKSP-XXXXXX` atau `TIKPG-XXXXXX`)
  - Jika `behalfUserId` diisi oleh Admin: `requestedBy` = user target, `created_by_admin_*` = admin yang membuat
  - Jika tidak: `requestedBy` = current user
  - Set `status` = `PROCESS` jika `shouldIssue: true`, else `DRAFT`
  - Buat entry awal di `audit_logs` (`TIKET_DITERBITKAN` atau `TIKET_DRAFT_DISIMPAN`)
  - Jika `behalfUserId` ada, tambahkan audit log `DIBUAT_ATAS_NAMA`
* **Response** `201`: Object `Ticket` baru.

### `PUT /api/tickets/:id`
* **Description**: Update penuh data tiket.
* **Request Body**: Full `Ticket` object.
* **Response** `200`: Object `Ticket` terupdate.

### `PATCH /api/tickets/:id/status`
* **Description**: Update status tiket (misal dari Kanban drag-and-drop).
* **Request Body**:
```json
{
  "status": "PROCESS"
}
```
* **Response** `200`: Object `Ticket` terupdate.

### `PATCH /api/tickets/:id/assignee`
* **Description**: Mengambil tiket (Self-Assign / Konfirmasi Assign oleh IT Worker).
* **Request Body**:
```json
{
  "userId": "IT-001"
}
```
* **Server Logic**: Set `assignedTo` = userId, `assignedToName` = userName.
* **Response** `200`: Object `Ticket` terupdate.

---

## 4. TICKET SUB-ENTITIES (WORKLOGS, ATTACHMENTS, COMMENTS, NOTES)

### `POST /api/tickets/:id/worklogs`
* **Description**: Menambah catatan kerja (Kirim) pada tahap ASSIGN atau IN_PROGRESS tanpa mengubah status.
* **Called From**: `TicketDetailView.handleSaveNote()`
* **Request Body**:
```json
{
  "stageKey": "IN_PROGRESS",
  "description": "Sedang melakukan pengecekan driver printer.",
  "attachment": {
    "stage": "IN_PROGRESS",
    "visibility": "INTERNAL_ONLY",
    "file_name": "log.txt",
    "file_size": "45 KB"
  }
}
```
* **Response** `201`: Object `Ticket` terupdate.

### `POST /api/tickets/:id/worklogs/custom`
* **Description**: Menambah worklog manual dengan tanggal, jam mulai, jam selesai, dan durasi (dari DailyWorkView).
* **Request Body**:
```json
{
  "date": "2026-09-19",
  "start_at": "09:00",
  "finish_at": "09:45",
  "duration_minutes": 45,
  "description": "Perbaikan kabel jaringan",
  "stageKey": "IN_PROGRESS"
}
```
* **Response** `201`: Object `Ticket` terupdate.

### `POST /api/tickets/:id/stages/complete`
* **Description**: Menyelesaikan suatu tahap workflow (ADVANCE STAGE), menyimpan worklog/catatan, menambah attachment, dan mencatat audit trail.
* **Called From**: `TicketDetailView.handleSubmitCurrentStage()` (Tombol Konfirmasi Assign, Selesai, Delegasi).
* **Request Body**:
```json
{
  "stageKey": "IN_PROGRESS",
  "notes": "Pekerjaan selesai dengan baik.",
  "targetStatus": "SELESAI",
  "attachment": {
    "stage": "COMPLETION",
    "visibility": "USER_VISIBLE",
    "file_name": "hasil.jpg",
    "file_size": "2.1 MB"
  },
  "delegation": {
    "type": "DELEGASI_VENDOR",
    "vendor_id": "VEND-01",
    "vendor_name": "PT Sinar Jaya",
    "notes": "Eskalasi hardware"
  }
}
```
* **Server Logic**:
  - Buat worklog entry jika `notes` ada
  - Buat attachment entry jika ada
  - Buat audit_log entry (`TAHAP_{stageKey}_SELESAI`)
  - Update status tiket sesuai `targetStatus` (`PROCESS`, `SELESAI`, `DELEGASI`)
  - Set `completed_at` timestamp jika status menjadi `SELESAI`
* **Response** `200`: Object `Ticket` terupdate.

### `POST /api/tickets/:id/attachments`
* **Description**: Mengunggah file attachment ke tiket pada stage tertentu.
* **Request Body**: `multipart/form-data` (file + `stage` + `visibility`)
* **Response** `201`: Object `Attachment` yang baru dibuat.

### `POST /api/tickets/:id/comments`
* **Description**: Menambah komentar diskusi antara user dan IT.
* **Request Body**: `{ "message": "string" }`
* **Response** `201`: Object `TicketComment` baru.

### `POST /api/tickets/:id/internal-notes`
* **Description**: Menambah catatan internal IT (hanya terlihat sesama IT).
* **Request Body**: `{ "note": "string" }`
* **Response** `201`: Object `InternalNote` baru.

---

## 5. MASTER DATA — CATEGORIES & SUBCATEGORIES

### `GET /api/categories`
* **Description**: Mengambil daftar kategori utama (`Support IT`, `IT Programmer`).
* **Response** `200`: Array `CategoryItem[]`.

### `POST /api/categories`
* **Description**: Tambah kategori baru.
* **Request Body**: `{ "id": "CAT-03", "name": "Infrastructure" }`
* **Response** `201`: `CategoryItem`.

### `PUT /api/categories/:id`
* **Description**: Edit kategori.
* **Request Body**: `{ "name": "Updated Name" }`
* **Response** `200`: `CategoryItem`.

### `DELETE /api/categories/:id`
* **Description**: Hapus kategori (cascade delete subkategori terkait).
* **Response** `200`: `{ "success": true }`.

### `GET /api/subcategories`
* **Description**: Mengambil daftar subkategori.
* **Query Parameters**: `category_id` (optional).
* **Response** `200`: Array `SubcategoryItem[]`.

### `POST /api/subcategories`
* **Description**: Tambah subkategori baru dengan relasi `category_id`.
* **Request Body**: `{ "id": "SUB-013", "category_id": "CAT-01", "name": "Maintenance Router" }`
* **Response** `201`: `SubcategoryItem`.

### `PUT /api/subcategories/:id`
* **Description**: Edit subkategori.
* **Request Body**: `{ "category_id": "CAT-01", "name": "Updated Name" }`
* **Response** `200`: `SubcategoryItem`.

### `DELETE /api/subcategories/:id`
* **Description**: Hapus subkategori.
* **Response** `200`: `{ "success": true }`.

---

## 6. MASTER DATA — VENDORS & TECHNICIANS

### `GET /api/vendors`
* **Description**: Daftar vendor eksternal untuk delegasi.
* **Response** `200`: Array `VendorItem[]`.

### `POST /api/vendors`
* **Description**: Tambah vendor baru.
* **Request Body**: `{ "name": "PT Mitra", "service_type": "Hardware", "contact_person": "Budi", "phone": "081234" }`
* **Response** `201`: `VendorItem`.

### `GET /api/technicians`
* **Description**: Daftar teknisi eksternal.
* **Response** `200`: Array `TechnicianItem[]`.

### `POST /api/technicians`
* **Description**: Tambah teknisi baru.
* **Request Body**: `{ "name": "Agus", "specialty": "AC", "phone": "081234" }`
* **Response** `201`: `TechnicianItem`.

---

## 7. REPORTS & ANALYTICS

### `GET /api/reports/summary`
* **Description**: Ringkasan KPI untuk laporan (total tersaring, selesai, proses, total jam kerja).
* **Query Parameters**: `timePreset`, `startDate`, `endDate`, `workerId`, `status`, `category`, `priority`.
* **Response** `200`:
```json
{
  "totalTickets": 25,
  "completedCount": 18,
  "inProgressCount": 5,
  "totalWorklogHours": "120.5"
}
```

### `GET /api/reports/tickets`
* **Description**: Rekapitulasi tiket berdasarkan parameter filter laporan.
* **Response** `200`: Array `Ticket[]`.

### `GET /api/reports/worklogs`
* **Description**: Log pekerjaan rinci untuk diexport ke Excel/PDF.
* **Response** `200`: Array gabungan `{ ticket: Ticket, wl: Worklog }[]`.

### `GET /api/reports/workers`
* **Description**: Ringkasan kontribusi per teknisi (Tab 3 ReportsView).
* **Response** `200`:
```json
[
  {
    "user": { "id": "IT-001", "name": "Budi Santoso", "department": "IT Support" },
    "totalContributed": 12,
    "completedCount": 10,
    "inProgressCount": 2,
    "totalHours": "45.0",
    "avgDuration": 35
  }
]
```

---

## 8. DASHBOARD & WORKLOAD

### `GET /api/dashboard/kpis`
* **Description**: KPI harian untuk DailyWorkView.
* **Query Parameters**: `startDate`, `endDate`, `workerId`.
* **Response** `200`:
```json
{
  "dailyTicketsCount": 5,
  "completedInRangeCount": 3,
  "onProgressCount": 2,
  "totalHoursInRange": "16.0"
}
```

### `GET /api/dashboard/my-work`
* **Description**: Daftar pekerjaan pribadi (MyWorkView) untuk user yang sedang login.
* **Query Parameters**: `userId`, `status`.
* **Response** `200`: Array `Ticket[]`.

### `GET /api/dashboard/daily-worklogs`
* **Description**: Timeline aktivitas harian untuk DailyWorkView.
* **Response** `200`: Array `{ ticket: Ticket, wl: Worklog }[]`.

---

## 9. USER PREFERENCES

### `GET /api/user/preferences`
* **Description**: Mengambil preferensi user (misal: dark mode).
* **Response** `200`: `{ "darkMode": true }`

### `PUT /api/user/preferences`
* **Description**: Menyimpan preferensi user.
* **Request Body**: `{ "darkMode": false }`
* **Response** `200`: `{ "success": true }`

---

## 10. FILE UPLOAD

### `POST /api/upload`
* **Description**: Mengunggah file (foto kerusakan, dokumen, log) ke server storage (S3 / Local).
* **Request Body**: `multipart/form-data` (`file`)
* **Response** `201`:
```json
{
  "success": true,
  "data": {
    "file_url": "https://storage.company.co.id/uploads/2026/09/file.png",
    "file_name": "file.png",
    "file_size": "1.4 MB"
  }
}
```
