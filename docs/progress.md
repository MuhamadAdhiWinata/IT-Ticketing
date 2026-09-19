# Progress Implementasi Backend

## Phase 1: Database & ORM Setup
- [x] Install dependencies (`drizzle-orm`, `drizzle-kit`, `mysql2`)
- [x] Buat `drizzle.config.ts`
- [x] Definisikan Schema Drizzle di `server/database/schema.ts`
- [x] Buat client koneksi MariaDB di `server/database/client.ts`
- [x] Buat seeder data awal `server/database/seed.ts`
- [x] Run migration & seed ke `ticket_db` di MariaDB

## Phase 2: Core Response & Storage Utilities
- [x] Buat helper response standar `server/utils/response.ts`
- [x] Buat generator ID `server/utils/ticket-id.ts`
- [x] Buat Storage Abstraction Layer `server/services/storage/`

## Phase 3: Auth & Users API
- [x] `GET /api/auth/me`
- [x] `POST /api/auth/switch-user`
- [x] `GET/POST /api/users`
- [x] `PUT/DELETE /api/users/:id`

## Phase 4: Master Data API
- [x] `GET/POST /api/categories` & `GET/PUT/DELETE /api/categories/:id`
- [x] `GET/POST /api/subcategories` & `GET/PUT/DELETE /api/subcategories/:id`
- [x] `GET/POST /api/vendors` & `GET/PUT/DELETE /api/vendors/:id`
- [x] `GET/POST /api/technicians` & `GET/PUT/DELETE /api/technicians/:id`

## Phase 5: Tickets & Sub-Entities API
- [x] `GET/POST /api/tickets`
- [x] `GET/PUT /api/tickets/:id`
- [x] `PATCH /api/tickets/:id/status` & `PATCH /api/tickets/:id/assignee`
- [x] `POST /api/tickets/:id/worklogs` & `/worklogs/custom`
- [x] `POST /api/tickets/:id/stages/complete`
- [x] `POST /api/tickets/:id/comments` & `/internal-notes`
- [x] `POST /api/tickets/:id/attachments`

## Phase 6: File Upload & Serving + Preferences
- [x] `POST /api/upload` (support image & PDF)
- [x] Static file serving route `/api/uploads/**`
- [x] `GET/PUT /api/user/preferences` (dark mode)

## Phase 7: Reports & Dashboard API
- [x] `GET /api/reports/summary`, `/tickets`, `/worklogs`, `/workers`
- [x] `GET /api/dashboard/kpis`, `/my-work`, `/daily-worklogs`

## Phase 8: Frontend Integration & Verification
- [x] Update `stores/app.ts` untuk menggunakan `$fetch` ke API (ganti `StorageService`)
- [x] End-to-end testing
