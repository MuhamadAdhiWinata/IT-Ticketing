# Rencana & Fase Pengembangan Backend

Dokumen ini merinci rencana arsitektur dan tahapan pengembangan backend untuk sistem **IT Ticketing & Work Monitoring** menggunakan **Nuxt 4 Nitro Server**, **Drizzle ORM**, **MariaDB**, dan **File System Storage** dengan pola abstrak.

---

## 1. Arsitektur & Teknologi

- **Framework**: Nuxt 4 Nitro Server (API Routes di `/server/api/`)
- **Database ORM**: Drizzle ORM (`drizzle-orm` + `mysql2`)
- **Database Engine**: MariaDB (Docker container `mariadb_local` pada port `3306`, database `ticket_db`)
- **File Storage**: Local Filesystem dengan pola **Storage Abstraction Layer** (memungkinkan migrasi mudah ke S3/MinIO/Google Drive di masa depan tanpa mengubah kode bisnis).

---

## 2. Struktur Direktori Backend

```
server/
├── database/
│   ├── schema.ts          # Definisi tabel Drizzle ORM (users, tickets, categories, dll)
│   ├── client.ts          # Koneksi Drizzle ke MariaDB
│   └── seed.ts            # Seeder data awal (dari mockData.ts)
├── services/
│   └── storage/
│       ├── index.ts       # Interface FileStorage
│       └── local.ts       # Implementasi Local File System
├── utils/
│   ├── response.ts        # Helper JSON response (success/error)
│   └── ticket-id.ts       # Generator ID tiket (TCK-YYYYMM-XXX)
├── api/
│   ├── auth/              # me.ts, switch-user.ts
│   ├── users/             # index.ts, [id].ts
│   ├── tickets/           # index.ts, [id].ts, status.ts, assignee.ts, worklogs.ts, stages.ts, attachments.ts
│   ├── categories/        # index.ts, [id].ts
│   ├── subcategories/     # index.ts, [id].ts
│   ├── vendors/           # index.ts, [id].ts
│   ├── technicians/       # index.ts, [id].ts
│   ├── reports/           # summary.ts, tickets.ts, worklogs.ts, workers.ts
│   ├── dashboard/         # kpis.ts, my-work.ts, daily-worklogs.ts
│   ├── preferences/       # index.ts
│   └── upload/            # index.ts
└── uploads/               # Folder penyimpanan fisik (di-mount ke Docker volume)
```

---

## 3. Strategi File Storage

1. **Phase 1 (Sekarang)**:
   - Menggunakan Local File System (`server/uploads/`).
   - Disimpan di Docker volume agar data persist meskipun container restart.
   - Endpoint `/api/upload` menerima `multipart/form-data` (mendukung PDF, gambar, dokumen), menyimpan ke disk, dan mengembalikan URL relatif.
   - Serve file statis melalui Nitro endpoint `/api/uploads/**`.

2. **Phase 2 (Masa Depan / Produksi)**:
   - Mengganti implementasi `LocalFileStorage` menjadi `S3FileStorage` (mendukung MinIO, AWS S3, Cloudflare R2, atau S3-compatible drive lainnya) cukup dengan mengganti class implementasi pada `server/services/storage/`.

---

## 4. Fase Pengembangan (Development Phases)

### Phase 1: Database & ORM Setup
- Install dependencies (`drizzle-orm`, `drizzle-kit`, `mysql2`)
- Buat `drizzle.config.ts`
- Definisikan Schema Drizzle di `server/database/schema.ts`
- Buat koneksi client MariaDB di `server/database/client.ts`
- Buat seeder data awal (`server/database/seed.ts`)

### Phase 2: Auth & User API
- `GET /api/auth/me`
- `POST /api/auth/switch-user`
- `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`

### Phase 3: Master Data API (Categories, Subcategories, Vendors, Technicians)
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/subcategories`
- `GET/POST/PUT/DELETE /api/vendors`
- `GET/POST/PUT/DELETE /api/technicians`

### Phase 4: Core Tickets & Sub-Entities API
- `GET /api/tickets`, `GET /api/tickets/:id`, `POST /api/tickets`
- `PUT /api/tickets/:id`, `PATCH /api/tickets/:id/status`, `PATCH /api/tickets/:id/assignee`
- `POST /api/tickets/:id/worklogs`
- `POST /api/tickets/:id/worklogs/custom`
- `POST /api/tickets/:id/stages/complete`
- `POST /api/tickets/:id/comments`, `POST /api/tickets/:id/internal-notes`

### Phase 5: File Upload & Preferences API
- `POST /api/upload` (multipart/form-data, PDF & image support)
- `GET/PUT /api/user/preferences` (dark mode)

### Phase 6: Reports & Dashboard API
- `GET /api/reports/summary`
- `GET /api/reports/tickets`
- `GET /api/reports/worklogs`
- `GET /api/reports/workers`
- `GET /api/dashboard/kpis`
- `GET /api/dashboard/my-work`
- `GET /api/dashboard/daily-worklogs`

### Phase 7: Frontend Integration
- Ganti `StorageService` (localStorage) di frontend dengan `$fetch` ke API backend.
- Verifikasi seluruh fitur end-to-end dengan MariaDB.
