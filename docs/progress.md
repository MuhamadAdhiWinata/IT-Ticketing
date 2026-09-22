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

## Phase 3: Auth & Users API (JWT)
- [x] Install `bcryptjs` + `jsonwebtoken`
- [x] Buat `server/utils/auth.ts` (signToken, verifyToken, getCurrentUser)
- [x] Buat `server/utils/authorize.ts` (requireAuth, requireRole)
- [x] Buat `server/utils/user-context.ts` (getCurrentUserId — fallback X-User-Id)
- [x] Buat `server/api/auth/login.ts` (POST — validate credentials, JWT cookie)
- [x] Buat `server/api/auth/logout.ts` (POST — clear cookie)
- [x] Update `server/api/auth/me.ts` (GET — user from JWT)
- [x] Hapus `server/api/auth/switch-user.ts`
- [x] Buat `server/middleware/auth.ts` (JWT verification)
- [x] Update semua API endpoint pakai `getCurrentUserId`
- [x] Buat `pages/login.vue` (login form)
- [x] Buat `stores/auth.ts` (login, logout, restoreSession)
- [x] Update `pages/index.vue` (route guard + redirect ke login)
- [x] Update `components/global/Navbar.vue` (hapus role switcher, tambah logout)
- [x] Update `stores/app.ts` (hapus switchUser, gunakan auth user)
- [x] Hapus referensi `switchUser` di AdminMasterView
- [x] Update `server/database/schema.ts` (tambah `password_hash`)
- [x] Update `server/database/seed.ts` (bcrypt hashed passwords)
- [x] Update `.env` + `.env.example` (JWT_SECRET, JWT_EXPIRES_IN)
- [x] Hapus hardcoded `root:rootpassword` dari source code

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
- [x] `POST /api/upload` (support image & PDF via formidable)
- [x] Static file serving route `/api/uploads/**`
- [x] `GET/PUT /api/user/preferences` (dark mode)

## Phase 7: Reports & Dashboard API
- [x] `GET /api/reports/summary`, `/tickets`, `/worklogs`, `/workers`
- [x] `GET /api/dashboard/kpis`, `/my-work`, `/daily-worklogs`

## Phase 8: Frontend Integration & Serialization
- [x] Update `stores/app.ts` untuk menggunakan `$fetch` ke API
- [x] Buat `server/utils/serialize.ts` (Drizzle camelCase → Frontend snake_case)
- [x] Update `server/utils/tickets.ts` (getTicketById, getTicketsWithRelations)
- [x] Update semua API routes untuk pakai serializer
- [x] Hapus `services/storage.ts` (dead code)
- [x] Hapus `utils/mockData.ts` (dead code)
- [x] Hapus `primary_worker_id`/`primary_worker_name` dari semua kode
- [x] Hapus `--host` directory (artifact)
- [x] Hapus `migration_manual*.sql` (obsolete)

## Phase 9: Authentication & JWT
- [x] Install `bcryptjs` + `jsonwebtoken`
- [x] Backend: `server/utils/auth.ts`, `server/utils/authorize.ts`
- [x] Backend: `server/middleware/auth.ts` (JWT verification)
- [x] Backend: `server/api/auth/login.ts`, `server/api/auth/logout.ts`
- [x] Backend: Hapus `switch-user.ts`
- [x] Frontend: `stores/auth.ts`, `pages/login.vue`
- [x] Frontend: Route guard di `pages/index.vue`
- [x] Frontend: Update Navbar (hapus role switcher, tambah logout)
- [x] Seed: bcrypt hashed passwords

## Phase 10: Cleanup & Quality
- [x] Hapus hardcoded `root:rootpassword` dari source files
- [x] Update `.env.example` (JWT_SECRET, DATABASE_URL, UPLOAD_DIR)
- [x] Hapus unused dependencies: `@google/genai`, `@lucide/vue`, `express`, `vite`
- [x] Hapus dead code: `services/storage.ts`, `utils/mockData.ts`, `--host/`, `migration_manual*.sql`
- [x] Fix `nuxt.config.ts` (devtools gate, remove srcDir default)
- [x] Hapus `AuditEntry` type (ganti `AuditLog`), hapus `audit_trail` field
- [x] Fix `AuditEntry` type mismatch (actor_id→performed_by, timestamp→performed_at)
- [x] Hapus stale `// For compatibility` comments
- [x] Serialize API responses (Drizzle camelCase → Frontend snake_case)
- [x] Fix subcategory dropdown (category_id mismatch)

## Belum Selesai
- [ ] Phase B: Ticket Members (hapus supporting_members JSON, buat tabel relasional)
- [ ] Phase C: Ticket Lifecycle Enforcement + Transactions
- [ ] Phase D: Attachments Proper Flow
- [ ] Phase E: Validation (zod)
- [ ] Phase F: Documentation (audit, contract matrix, endpoint matrix)
- [ ] Phase H: Testing
- [ ] Phase I: Final Report
