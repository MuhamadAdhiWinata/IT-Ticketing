# IT Ticketing & Work Monitoring System

Sistem informasi tiket dan monitoring pekerjaan IT — mencakup pembuatan tiket, pelacakan progres, pencatatan kerja harian, dan laporan ekspor.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.5.2 | Framework full-stack |
| Vue | 3.5 | Frontend |
| Tailwind CSS | 3.x | Styling |
| Pinia | 4.x | State management |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | 0.45.x | Database ORM |
| MariaDB | 10.10 | Database |
| bcryptjs | 3.x | Password hashing |
| jsonwebtoken | 9.x | JWT authentication |
| formidable | 3.x | File upload |

## Fitur Utama

- **Ticket Management** — Buat, lacak, dan kelola tiket IT dengan stepper progres
- **Kanban Board** — Drag & drop antar status (DRAFT → PROCESS → SELESAI → DELEGASI)
- **Worklog & Daily Work** — Pencatatan aktivitas harian dengan timeline dan KPI
- **Laporan & Export** — Rekapitulasi tiket, log pekerjaan, ringkasan per teknisi (Excel & PDF)
- **Admin Master Data** — Kelola kategori, subkategori, dan user
- **JWT Authentication** — Login/logout dengan password hash & token
- **Mobile-First Responsive** — Desain optimal untuk mobile dan desktop
- **Dark/Light Mode** — Toggle tema gelap/terang

## Roles

| Role | Deskripsi |
|------|-----------|
| `USER_NON_IT` | Karyawan pelapor — buat tiket, lacak progres |
| `IT_WORKER` | Teknisi IT — kerjakan tiket, catat worklog |
| `SYSTEM_ADMIN` | Admin — akses penuh + buat tiket atas nama user lain |

## Project Structure

```
├── components/              # Vue components (views, dashboard, global)
├── composables/             # useToast, useModal, useConfirmModal
├── layouts/                 # default, flat
├── pages/                   # index (SPA), login
├── server/
│   ├── api/                 # Nitro API routes
│   │   ├── auth/            # login, logout, me
│   │   ├── tickets/         # CRUD + sub-entities
│   │   ├── categories/      # CRUD
│   │   ├── subcategories/   # CRUD
│   │   ├── users/           # CRUD
│   │   ├── reports/         # Reports endpoints
│   │   ├── dashboard/       # Dashboard endpoints
│   │   ├── user/            # Preferences
│   │   └── upload/          # File upload
│   ├── database/
│   │   ├── schema.ts        # Drizzle schema (8 tabel)
│   │   ├── client.ts        # Database connection
│   │   ├── seed.ts          # Seed data functions
│   │   └── run-seed.ts      # Seed runner script
│   ├── services/storage/    # Local file storage abstraction
│   ├── utils/               # serialize, tickets, auth, etc.
│   ├── middleware/           # Auth middleware
│   └── uploads/             # Uploaded files (gitignored)
├── stores/                  # Pinia stores (app.ts, auth.ts)
├── types/                   # TypeScript interfaces
├── utils/                   # export helpers, ticketHelpers
├── docs/                    # Documentation
├── Dockerfile
├── docker-compose.yml
└── drizzle.config.ts
```

## Database Schema

8 tabel relasional:

| Tabel | Kolom Utama |
|-------|-------------|
| `users` | id, name, email, password_hash, role, department, avatar_url |
| `categories` | id, name |
| `subcategories` | id, category_id (FK→categories), name |
| `tickets` | 38 kolom (title, status, priority, delegation, timestamps) |
| `ticket_members` | id, ticket_id (FK→tickets), user_id (FK→users), created_at |
| `worklogs` | id, ticket_id, stage_key, worker_id, date, start/finish, duration, description |
| `audit_logs` | id, ticket_id, action, performed_at, performed_by, detail, notes |
| `attachments` | id, ticket_id, stage, visibility, file_name, file_size, file_path, uploaded_by |

## Migration & Seed

### Persiapan

```bash
# Pastikan MariaDB running (Docker)
docker ps | grep mariadb_local

# Copy .env.example ke .env
cp .env.example .env
```

### Setup Database (Fresh)

```bash
# 1. Reset database (jika perlu)
docker exec -i mariadb_local mariadb -u root -prootpassword ticket_db -e \
  "DROP DATABASE IF EXISTS ticket_db; CREATE DATABASE ticket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Push schema ke database
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" npx drizzle-kit push

# 3. Seed data
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" pnpm seed
```

### Atau satu perintah (reset total)

```bash
docker exec -i mariadb_local mariadb -u root -prootpassword ticket_db -e \
  "DROP DATABASE IF EXISTS ticket_db; CREATE DATABASE ticket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" && \
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" npx drizzle-kit push && \
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" pnpm seed
```

### Verifikasi

```bash
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" npx tsx -r dotenv/config -e "
import { db } from './server/database/client.ts';
import { users, tickets, worklogs } from './server/database/schema.ts';
async function v() {
  const u = (await db.select().from(users)).length;
  const t = (await db.select().from(tickets)).length;
  const w = (await db.select().from(worklogs)).length;
  console.log('Users:', u, 'Tickets:', t, 'Worklogs:', w);
}
v().then(() => process.exit(0));
"
```

### Data yang Di-seed

| Tabel | Jumlah | Keterangan |
|-------|--------|------------|
| users | 10 | 4 USER_NON_IT, 5 IT_WORKER, 1 SYSTEM_ADMIN |
| categories | 2 | Support IT, IT Programmer |
| subcategories | 28 | 12 Support IT, 16 IT Programmer |
| tickets | 10 | Status: DRAFT, PROCESS, SELESAI, DELEGASI |
| worklogs | 4 | Log kerja dari IT workers |
| audit_logs | 5 | Audit trail tiket |
| ticket_members | 4 | Daftar anggota tiket |

### Default Credentials

| Email | Password | Role |
|-------|----------|------|
| sysadmin@company.co.id | password123 | SYSTEM_ADMIN |
| budi.santoso@it.company.co.id | password123 | IT_WORKER |
| rina.wulandari@company.co.id | password123 | USER_NON_IT |

## Docker

### Build & Run

```bash
# Build & jalankan
docker compose up --build -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f

# Stop
docker compose down
```

### Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `DATABASE_URL` | `mysql2://root:rootpassword@172.23.0.2:3306/ticket_db` | Database URL (override untuk Docker) |
| `UPLOAD_DIR` | `./server/uploads` | Direktori upload file |
| `JWT_SECRET` | dari .env | Secret key JWT |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token |
| `NODE_ENV` | `production` | Environment mode |

### Development

```bash
DATABASE_URL="mysql2://root:rootpassword@localhost:3306/ticket_db" pnpm run dev
```

Buka http://localhost:3000

### Build

```bash
pnpm run build
```

### Preview

```bash
pnpm run preview
```

### Tests

```bash
pnpm vitest run
```

## Status Tiket

```
DRAFT → PROCESS → SELESAI
                ↘ DELEGASI
DELEGASI → PROCESS
SELESAI → PROCESS (reopen)
```

## License

Proprietary — Internal Use Only
