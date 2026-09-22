# Full Codebase Audit Report

**Date**: 2026-09-21
**Auditor**: AI Senior Engineer

---

## 1. Critical Findings (Fixed)

### P0: Hardcoded Credentials
- `server/database/client.ts`: `root:rootpassword` hardcoded as fallback
- `server/database/migrate.ts`: Same hardcoded credentials
- `drizzle.config.ts`: Same hardcoded credentials
- **Fix**: All files now read from `process.env.DATABASE_URL`. Removed hardcoded fallbacks. `.env` added to `.gitignore`.

### P0: Authentication
- Entire app relied on `X-User-Id` header (no real auth)
- **Fix**: JWT authentication implemented with login, middleware, HttpOnly cookies

### P1: Type Mismatches
- `AuditEntry` interface had `actor_id`, `actor_name`, `timestamp` but serializer outputs `performed_by`, `performed_by_name`, `performed_at`
- `audit_trail` field in `Ticket` type was always empty (no DB column)
- Subcategory `category_id` vs Drizzle `categoryId` caused empty dropdown
- **Fix**: Created `AuditLog` type matching serializer. Removed `audit_trail`. Created serializer layer for all entities.

### P1: Duplicate CSS
- `nuxt.config.ts` had both `tailwindcss.cssPath` and `css: []` pointing to same file
- **Fix**: Kept both (needed for Tailwind processing + Nuxt inclusion)

## 2. Security Findings (Fixed)

### Authentication
- Added bcrypt password hashing for all users
- JWT with expiration (configurable via `JWT_EXPIRES_IN`)
- HttpOnly secure cookies for token storage
- Auth middleware for all API routes
- Login/logout endpoints

### Password Security
- All seed users have bcrypt-hashed passwords (`password123`)
- Password hash never exposed via API

### Hardcoded Secrets
- `JWT_SECRET` moved to environment variable
- `.env` file excluded from git via `.gitignore`

## 3. Architectural Findings

### Database
- JSON columns `supporting_members` and `supporting_member_details` removed
- Relational `ticket_members` table created
- All sub-entities (worklogs, comments, internal_notes, audit_logs, attachments) are proper relational tables
- Foreign keys correctly defined

### API Layer
- All responses serialized via `server/utils/serialize.ts`
- Drizzle camelCase → Frontend snake_case mapping
- DTO validation via zod schemas
- Transaction support in `stages/complete` endpoint

### Ticket Lifecycle
- Valid transitions enforced server-side
- `PATCH /status` validates transitions
- `PUT /tickets/:id` restricted to editable fields only
- `stages/complete` validates and updates in atomic operation

## 4. Dead Code Removed
- `services/storage.ts` (client-side localStorage wrapper)
- `utils/mockData.ts` (frontend mock data, no longer used)
- `--host/` directory (artifact)
- `migration_manual.sql` and `migration_manual_v2.sql` (obsolete)
- Unused dependencies: `@google/genai`, `@lucide/vue`, `express`, `vite`

## 5. Remaining Items
- Attachments: Frontend file upload integration incomplete
- Testing: No automated tests
- Documentation: Contract matrix and endpoint matrix pending
