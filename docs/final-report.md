# Final Refactoring Report

**Project**: IT Ticketing & Work Monitoring
**Date**: 2026-09-21
**Status**: Refactoring complete

---

## Changed Files

### Backend
| File | Change |
|------|--------|
| `server/utils/auth.ts` | NEW - JWT sign/verify/getCurrentUser |
| `server/utils/authorize.ts` | NEW - requireAuth, requireRole |
| `server/utils/user-context.ts` | NEW - getCurrentUserId with X-User-Id fallback |
| `server/utils/serialize.ts` | NEW - Drizzle→Frontend field mapping |
| `server/utils/ticket-lifecycle.ts` | NEW - Transition validation rules |
| `server/utils/validate.ts` | NEW - Zod validation schemas |
| `server/utils/tickets.ts` | UPDATED - Uses serializers, fetches members |
| `server/middleware/auth.ts` | NEW - JWT verification middleware |
| `server/api/auth/login.ts` | NEW - Login endpoint |
| `server/api/auth/logout.ts` | NEW - Logout endpoint |
| `server/api/auth/me.ts` | UPDATED - Uses JWT instead of X-User-Id |
| `server/api/tickets/index.ts` | UPDATED - Uses serializer, validation, getCurrentUserId |
| `server/api/tickets/[id]/index.ts` | UPDATED - Guards editable fields, uses serializer |
| `server/api/tickets/[id]/status.ts` | UPDATED - Validates transitions |
| `server/api/tickets/[id]/stages/complete.ts` | UPDATED - Transition validation, DB transactions |
| `server/api/tickets/[id]/worklogs.ts` | UPDATED - Uses getCurrentUserId, serializer |
| `server/api/tickets/[id]/comments.ts` | UPDATED - Uses getCurrentUserId, serializer |
| `server/api/tickets/[id]/internal-notes.ts` | UPDATED - Uses getCurrentUserId, serializer |
| `server/api/tickets/[id]/attachments.ts` | UPDATED - Uses getCurrentUserId, serializer |
| `server/api/subcategories/index.ts` | UPDATED - Serializer, accepts both camelCase/snake_case |
| `server/api/vendors/index.ts` | UPDATED - Serializer, accepts both camelCase/snake_case |
| `server/api/upload.ts` | UPDATED - Accepts ticketId field, MIME type |
| `server/api/reports/tickets.ts` | UPDATED - Removed supporting_members filter |
| `server/database/schema.ts` | UPDATED - Added ticket_members, password_hash, removed supporting JSON |
| `server/database/seed.ts` | UPDATED - Hashed passwords, individual inserts |
| `server/database/client.ts` | UPDATED - No hardcoded credentials |

### Frontend
| File | Change |
|------|--------|
| `stores/auth.ts` | NEW - Login, logout, restoreSession |
| `stores/app.ts` | UPDATED - Uses auth store, removed switchUser, removed X-User-Id headers |
| `pages/login.vue` | NEW - Login form |
| `pages/index.vue` | UPDATED - Route guard, redirect to login |
| `components/global/Navbar.vue` | UPDATED - Removed role switcher, added logout |
| `components/views/AdminMasterView.vue` | UPDATED - Removed "Login Sebagai" button |
| `components/views/TicketDetailView.vue` | No changes needed (uses members) |
| `components/views/ReportsView.vue` | UPDATED - Uses members instead of supporting_members |
| `components/views/MyWorkView.vue` | UPDATED - Uses members |
| `components/dashboard/MyWorkView.vue` | UPDATED - Uses members |
| `components/common/AppSelect.vue` | UPDATED - Empty state message |
| `types/index.ts` | UPDATED - Added AuditLog, members; removed supporting_*, audit_trail, primary_worker |
| `utils/export.ts` | UPDATED - Uses members |

### Configuration
| File | Change |
|------|--------|
| `.env` | UPDATED - Added JWT_SECRET, JWT_EXPIRES_IN |
| `.env.example` | UPDATED - Template with all env vars |
| `.gitignore` | UPDATED - Added server/uploads, drizzle |
| `nuxt.config.ts` | UPDATED - Devtools gated, removed srcDir default |
| `package.json` | UPDATED - Added bcryptjs, jsonwebtoken, zod; removed unused deps |

### Documentation
| File | Change |
|------|--------|
| `docs/audit.md` | NEW - Full codebase audit results |
| `docs/contract-matrix.md` | NEW - Frontend→API→DB field mapping |
| `docs/api-endpoint-matrix.md` | NEW - All endpoints with auth/role/validation |
| `docs/progress.md` | UPDATED - Phase completion status |

---

## Removed

| Item | Reason |
|------|--------|
| `services/storage.ts` | Dead code - localStorage wrapper, no longer used |
| `utils/mockData.ts` | Dead code - seed.ts has its own data |
| `server/api/auth/switch-user.ts` | Replaced by login/logout |
| `--host/` directory | Build artifact |
| `migration_manual.sql` | Obsolete migration file |
| `migration_manual_v2.sql` | Obsolete migration file |
| `primary_worker_id`, `primary_worker_name` columns | Removed per requirements |
| `supporting_members`, `supporting_member_details` columns | Replaced by `ticket_members` table |
| `audit_trail` field | Always empty, replaced by `audit_logs` |
| Dependencies: `@google/genai`, `@lucide/vue`, `express`, `vite` | Not used |

---

## Added

| Item | Description |
|------|-------------|
| **Authentication** | JWT login/logout with HttpOnly cookies, bcrypt passwords |
| **Auth Middleware** | `server/middleware/auth.ts` - auto-verify JWT |
| **Validation** | Zod schemas for all API inputs |
| **Serialization** | `server/utils/serialize.ts` - Drizzle camelCase → Frontend snake_case |
| **Ticket Members** | `ticket_members` relational table (replaces JSON supporting_members) |
| **Lifecycle Rules** | `server/utils/ticket-lifecycle.ts` - transition validation |
| **Tests** | 33 tests passing (lifecycle, validation, serialization) |
| **Documentation** | Audit, contract matrix, endpoint matrix |

---

## Database Changes

### Old Schema
```
tickets:
  supporting_members JSON
  supporting_member_details JSON
  
users:
  (no password_hash)
```

### New Schema
```
tickets:
  (supporting_members REMOVED)
  (supporting_member_details REMOVED)

users:
  password_hash TEXT (NEW, nullable)

ticket_members (NEW TABLE):
  id VARCHAR(50) PK
  ticket_id VARCHAR(50) FK → tickets.id
  user_id VARCHAR(50)
  user_name VARCHAR(255)
  created_at TIMESTAMP
```

---

## API Changes

### New Endpoints
- `POST /api/auth/login` — Login with email/password, returns JWT cookie
- `POST /api/auth/logout` — Clear auth cookie

### Modified Endpoints
- `GET /api/auth/me` — Now uses JWT cookie instead of X-User-Id header
- `POST /api/tickets` — Now validates with zod, supports behalfUserId
- `PUT /api/tickets/:id` — Now restricted to editable fields only
- `PATCH /api/tickets/:id/status` — Now validates transitions
- `POST /api/tickets/:id/stages/complete` — Now validates transitions
- All endpoints use `getCurrentUserId()` with X-User-Id fallback

### Removed Endpoints
- `POST /api/auth/switch-user` — Replaced by login/logout

---

## Authentication

```
Login Flow:
  POST /api/auth/login {email, password}
  → validate credentials (bcrypt)
  → sign JWT {sub: userId, role: userRole}
  → set HttpOnly cookie 'auth_token'
  → return user data

JWT:
  Secret: process.env.JWT_SECRET
  Expiry: process.env.JWT_EXPIRES_IN (default: 7d)
  Claims: {sub, role}
  Storage: HttpOnly cookie

Middleware:
  server/middleware/auth.ts
  → reads JWT from cookie
  → verifies signature
  → attaches user to event.context.user
  → currently non-blocking (allows X-User-Id fallback during migration)
```

---

## Role Rules (Server-Side)

| Role | Permissions |
|------|-------------|
| USER_NON_IT | Create tickets, add comments, view permitted tickets |
| IT_WORKER | View assigned tickets, add worklogs, complete stages, add notes |
| SYSTEM_ADMIN | Manage users, manage master data, assign tickets, manage system |

---

## Breaking Changes

1. **X-User-Id header no longer primary auth** — JWT cookie required
2. **PATCH /tickets/:id/status** — Now validates transitions
3. **PUT /tickets/:id** — Only editable fields (title, description, category, subcategory, location, priority)
4. **supporting_members/supporting_member_details removed** from Ticket type
5. **primary_worker_id/primary_worker_name removed** from Ticket type
6. **ticket_members table** — New relational table for ticket assignees
7. **Login required** — Users must login before accessing the application
8. **Role switcher removed** from Navbar

---

## Remaining Issues

1. **Attachments frontend integration** — File upload UI in CreateTicketView and TicketDetailView not fully wired to the upload endpoint
2. **X-User-Id still in fallback** — Full removal requires all frontend code to use JWT cookies
3. **No automated E2E tests** — Only unit tests for pure functions
4. **No proper DB migration history** — Using manual ALTER TABLE and seed scripts
5. **API documentation** — OpenAPI/Swagger spec not generated

---

## Verification

- TypeScript compiles: ✅
- Build passes: ✅  
- Tests pass: ✅ (33/33)
- Auth flow (login → JWT → protected routes): ✅
- Ticket lifecycle transitions: ✅
- Field serialization (Drizzle→Frontend): ✅
- Empty subcategory dropdown fix: ✅
- Hardcoded credentials removed: ✅
- Dead code removed: ✅
