# IT Ticketing & Work Monitoring System

Sistem informasi tiket dan monitoring pekerjaan IT: pembuatan tiket, pelacakan progres, pencatatan kerja harian, diskusi tiket dengan editor rich text, dan laporan ekspor.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Nuxt | 4.5.x | Framework full-stack |
| Vue | 3.5 | Frontend |
| Tailwind CSS | 3.x | Styling |
| Pinia | 4.x | State management |
| TypeScript | 5.x | Type safety |
| Drizzle ORM + drizzle-kit | 0.45.x / 0.31.x | ORM dan migrasi |
| MariaDB | 10.10 | Database |
| Tiptap + DOMPurify | 3.x / 3.x | Editor rich text dan sanitasi HTML |
| AWS SDK S3 | 3.x | Penyimpanan file S3/MinIO (opsional) |
| MCP SDK | 1.x | Server MCP untuk worker (`/mcp`) |
| zod | 4.x | Validasi |
| bcryptjs, jsonwebtoken | 3.x / 9.x | Password hash dan JWT |
| formidable | 3.x | Upload multipart |
| vitest | 5.x | Test |

## Fitur Utama

- **Ticket Management**: buat, lacak, dan kelola tiket dengan stepper progres, delegasi ke vendor atau teknisi, dan buka ulang tiket
- **Diskusi dan Worklog**: komentar dan catatan kerja dengan editor rich text (format, link, gambar inline), tampilan ala chat (milik sendiri di kanan)
- **Catatan Internal**: khusus IT, tidak terlihat oleh pelapor
- **Kanban Board**: pindah status antar kolom
- **Laporan dan Export**: rekap tiket, log pekerjaan, ringkasan per teknisi (Excel dan PDF)
- **Master Data**: kategori, project/kendala, submodul, vendor, perusahaan, divisi, user
- **Notifikasi** dan SLA per kategori
- **Pengaturan Perusahaan**: nama, logo, dan warna tema
- **Token MCP**: token API per user untuk memakai tool MCP
- **Penyimpanan file**: disk lokal atau S3/MinIO, dipilih lewat environment
- **Dark/Light Mode** dan layout responsif

## Roles

| Role | Deskripsi |
|------|-----------|
| `USER_NON_IT` | Karyawan pelapor: buat tiket, lacak progres, ikut diskusi |
| `IT_WORKER` | Teknisi IT: kerjakan tiket, catat worklog, catatan internal |
| `SYSTEM_ADMIN` | Admin: akses penuh dan membuat tiket atas nama user lain |
| `PM` | Triase tiket (jenis, dampak, urgensi, prioritas, katalog, pelaksana, pengalihan), menutup tiket, membuat tiket atas nama dengan Kanal Asal |
| `DUTY_ENGINEER` | Tim IT; mengonfirmasi Insiden P1/P2 sebelum diproses; membuat tiket atas nama dengan Kanal Asal |

## Project Structure

```
├── components/              # Vue components (views, common, dashboard, global, ui)
├── composables/             # useToast, useModal, useConfirmModal
├── layouts/                 # default, flat
├── pages/                   # index (SPA dengan tab), login
├── drizzle/                 # Migrasi SQL + meta (dihasilkan drizzle-kit)
├── server/
│   ├── api/                 # Rute Nitro (auth, tickets, users, companies, divisions,
│   │                        #   vendors, categories, project-kendala, submodules,
│   │                        #   notifications, reports, settings, mcp-tokens, upload, uploads)
│   ├── database/
│   │   ├── schema.ts        # Skema Drizzle (21 tabel), sumber kebenaran skema
│   │   ├── client.ts        # Koneksi database
│   │   ├── seed-production.ts # Seeder production: admin + company_settings + 2 kategori (pnpm seed)
│   │   ├── run-seed.ts      # Seeder demo/dev, MENGHAPUS data (pnpm seed:demo)
│   │   ├── seed.ts          # Salinan lama, tidak dipakai
│   │   └── migrate.ts       # Skrip lama pemindah data JSON ke tabel, bukan migrasi skema
│   ├── services/
│   │   ├── ticketing/       # Logika tiket (dipakai UI dan MCP)
│   │   └── storage/         # Penyimpanan file: local.ts, s3.ts, index.ts (pemilih)
│   ├── mcp/                 # Definisi tool MCP
│   ├── utils/               # serialize, auth, org, notifications, dll.
│   └── __tests__/           # Test vitest (integrasi butuh DB terpisah)
├── scripts/                 # Webhook deploy, cleanup, utilitas
├── stores/                  # Pinia stores
├── types/                   # TypeScript interfaces
├── utils/                   # export helpers, richText (sanitasi HTML)
├── docs/                    # Dokumentasi (CI-CD-WEBHOOK.md, audit-24.md, dll.)
├── Dockerfile
├── docker-compose.yml       # app, plus minio (profile s3)
└── drizzle.config.ts
```

## Database Schema

21 tabel (ditambah `__drizzle_migrations` milik drizzle-kit). Definisi lengkap ada di `server/database/schema.ts`.

| Kelompok | Tabel |
|----------|-------|
| Organisasi | `companies`, `divisions`, `users` (company_id, division_id), `user_preferences`, `company_settings` |
| Master | `categories` (SLA per prioritas), `project_kendala`, `submodules`, `vendors` |
| Tiket | `tickets`, `ticket_members`, `audit_logs`, `notifications` |
| Aktivitas | `worklogs`, `comments`, `internal_notes` |
| Berkas | `files`, `worklog_files` (pivot), `comment_files` (pivot) |
| MCP | `mcp_tokens` (hash dan token terenkripsi), `mcp_idempotency` |

Catatan:
- `files` menggantikan `attachments`. Berkas ditautkan ke worklog atau komentar lewat tabel pivot (many-to-many). `files.stage` boleh null untuk berkas yang hanya lewat pivot.
- Isi `comments.message` dan `worklogs.description` berupa HTML dari editor. Data polos lama tetap terbaca. HTML disanitasi saat ditampilkan.
- `files.file_path` berisi URL `/api/uploads/...`, sama untuk backend disk maupun S3.
- `company_settings` memakai satu baris dengan `id = 'default'`. Tanpa baris itu UI memakai tema bawaan kode (biru, "Percetakan Integral Offset").

## Migration & Seed

Migrasi memakai **drizzle-kit** dan **dijalankan manual dari luar container**. Image Docker hanya menjalankan `node .output/server/index.mjs`, tidak ada migrasi saat start, dan `deploy.sh` tidak menjalankannya. Seeder juga manual.

Kedua perintah membaca `DATABASE_URL` dari environment, atau dari `.env` bila tidak diset. Format: `mysql2://user:password@host:3306/nama_db`.

### Persiapan

```bash
cp .env.example .env     # lalu isi DATABASE_URL dan JWT_SECRET
pnpm install
```

Buat database kosong dengan charset `utf8mb4` dan collation `utf8mb4_general_ci` (sama dengan staging):

```bash
mariadb -u root -p -e "CREATE DATABASE ticketing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
```

### Setup database baru

```bash
# 1. Terapkan semua migrasi di drizzle/
DATABASE_URL="mysql2://root:PASSWORD@localhost:3306/ticketing_db" npx drizzle-kit migrate

# 2. Production: admin + company_settings + 2 kategori (tidak menghapus apa pun)
DATABASE_URL="mysql2://root:PASSWORD@localhost:3306/ticketing_db" pnpm seed

# 2'. Dev/staging: data demo lengkap (MENGHAPUS data yang ada)
DATABASE_URL="mysql2://root:PASSWORD@localhost:3306/ticketing_db" pnpm seed:demo
```

Migrasi bisa diulang: yang sudah tercatat di `__drizzle_migrations` dilewati.

### Reset total (hanya untuk DB dev/staging)

```bash
mariadb -u root -p -e "DROP DATABASE IF EXISTS ticketing_db; CREATE DATABASE ticketing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
DATABASE_URL="..." npx drizzle-kit migrate && DATABASE_URL="..." pnpm seed:demo
```

Reset menghapus semua data, termasuk token MCP. Buat ulang token di menu Token MCP. Ambil backup dulu kalau isinya masih berharga:

```bash
mysqldump -u root -p --single-transaction --routines --triggers ticketing_db > backup.sql
```

### Mengubah skema

1. Ubah `server/database/schema.ts`.
2. `npx drizzle-kit generate --name=nama_perubahan` membuat file SQL baru di `drizzle/`. Bila ada tabel atau kolom yang diganti nama, drizzle-kit bertanya apakah itu rename atau tabel baru: jawab sesuai maksud agar data tidak hilang.
3. Periksa SQL hasilnya, lalu commit `drizzle/*.sql` dan `drizzle/meta/`.
4. Jalankan `npx drizzle-kit migrate` ke setiap database **sebelum** men-deploy kode baru. Deploy otomatis tidak menerapkan migrasi, jadi kode baru bisa error bila skema belum dimigrasi.

Jangan membuat SQL migrasi manual di luar drizzle-kit: nama FK, index, dan collation akan berbeda dari skema.

### Database lama tanpa `__drizzle_migrations` (mis. produksi)

Jangan jalankan `drizzle-kit migrate` di database yang tabelnya sudah ada tetapi belum punya `__drizzle_migrations`: `0000_baseline` akan gagal karena `CREATE TABLE`. Database seperti itu harus di-baseline dulu (buat `__drizzle_migrations` dan isi hash migrasi yang sudah setara tanpa menjalankan SQL-nya). Rincian dan alasannya ada di `docs/audit-24.md`. Selalu backup sebelum menyentuhnya.

### Seeder

Dua seeder, pilih sesuai lingkungan. Skema harus sudah dimigrasi lebih dulu.

| Perintah | File | Untuk | Menghapus data? |
|----------|------|-------|-----------------|
| `pnpm seed` | `server/database/seed-production.ts` | Production, data kosong | Tidak. Aman diulang |
| `pnpm seed:demo` | `server/database/run-seed.ts` | Dev/staging, data demo | **Ya**, semua tabel yang ia isi |

#### `pnpm seed` (production)

Hanya membuat tiga hal, sisanya kosong dan diisi admin lewat menu Master Data:

- Akun `sysadmin@company.co.id` (`SYSTEM_ADMIN`, id `ADMIN-001`). Bila akun sudah ada, dilewati dan password tidak diubah.
- Baris `company_settings` `default` (nama "Neutron", warna primer merah). **Wajib**, dibaca oleh `GET /api/settings/company` (halaman login).
- Kategori `Support IT` dan `IT Programmer`. **Wajib**, form tiket mencari kategori dengan nama persis ini.

Password admin: dari env `ADMIN_PASSWORD` bila diisi, kalau tidak dibuat acak dan dicetak **sekali** di output. Catat lalu ganti setelah login pertama.

```bash
ADMIN_PASSWORD="isi-password-kuat" DATABASE_URL="mysql2://..." pnpm seed
```

Data awal dari file (opsional): isi `SEED_DIR` dengan folder berisi `<dataset>.csv` memakai format template menu Import (`companies`, `divisions`, `users`, `categories`, `projectKendala`, `submodules`, `vendors`). Diimpor berurutan dengan aturan yang sama dengan UI (id baru dibuat, id lama diperbarui, satu file salah = file itu tidak tertulis dan seeder berhenti). Password sementara akun baru tanpa kolom `password` dicetak sekali.

```bash
SEED_DIR=./seed-data DATABASE_URL="mysql2://..." pnpm seed
```

#### Import / template CSV (Master Data > Import / Template)

Klaim `master.import` (bawaan hanya `SYSTEM_ADMIN`, bisa diberikan ke peran lain di Hak Akses). Dataset: Perusahaan, Divisi, Pengguna, Kategori, Aplikasi/Kendala, Modul, Vendor.

- Unduh template per dataset (`GET /api/import/template/:dataset`) atau data saat ini (`GET /api/import/export/:dataset`, format sama, siap diedit lalu diimpor ulang; password pengguna tidak diekspor).
- Unggah lewat `POST /api/import/:dataset` body `{ csv, dryRun }`. `dryRun: true` hanya memeriksa.
- Kunci baris = `id`: id baru dibuat, id lama diperbarui. Satu baris salah = tidak ada yang tersimpan (semua-atau-tidak). Induk (perusahaan, divisi, kategori, aplikasi) diacu lewat id atau nama.
- Akun baru tanpa `password` diberi password acak, ditampilkan sekali. Akun lama tanpa `password` tidak diubah.
- Format CSV (bukan `.xlsx`; Excel membukanya langsung, pemisah koma atau titik koma). Maks 2 MB dan 5000 baris per file.

#### `pnpm seed:demo` (dev/staging)

**Menghapus data semua tabel yang ia isi, lalu mengisi ulang.** Jangan dijalankan di database yang berisi data nyata. ID bersifat tetap (mis. `TCK-202609-001`, `WL-001`, `CMT-001`), jadi seed ulang menghasilkan data identik.

| Tabel | Jumlah | Keterangan |
|-------|--------|------------|
| companies | 2 | |
| divisions | 9 | Terhubung ke company |
| users | 12 | 4 USER_NON_IT (unit LNY/IIE/REN/Holding), 5 IT_WORKER, 1 SYSTEM_ADMIN, 1 PM, 1 DUTY_ENGINEER, semua punya company dan divisi |
| user_preferences | 10 | 3 user memakai dark mode |
| company_settings | 1 | Baris `default` (nama "Neutron", warna primer merah). **Wajib**, dibaca oleh `GET /api/settings/company` |
| categories | 2 | Support IT, IT Programmer |
| project_kendala | 28 | 12 Support IT, 16 IT Programmer |
| submodules | 9 | |
| vendors | 4 | Dipakai delegasi vendor |
| tickets | 15 | 2 DRAFT, 7 PROCESS, 2 DELEGASI, 4 SELESAI. Termasuk delegasi vendor dan teknisi, delegasi yang sudah dikembalikan, draft atas nama user, dan tiket yang mereferensikan tiket lain |
| ticket_members | 14 | |
| worklogs | 18 | HTML: list, kode, kutipan, link, dan gambar inline |
| comments | 15 | HTML, termasuk satu dengan gambar inline |
| internal_notes | 4 | Khusus IT |
| files | 8 | Tahap dan visibilitas bervariasi. `file_path` kosong (tidak ada berkas fisik) |
| worklog_files, comment_files | 1 dan 1 | Contoh tautan pivot |
| audit_logs | 50 | Dihasilkan dari data tiket agar cocok dengan status dan waktu |
| notifications | 14 | Campuran sudah dibaca dan belum |

Tidak di-seed: `mcp_tokens` dan `mcp_idempotency`. Token berisi rahasia dan dibuat pemilik lewat menu Token MCP.

### Verifikasi

```bash
mariadb -u root -p ticketing_db -e "SELECT COUNT(*) AS migrasi FROM __drizzle_migrations; SELECT status, COUNT(*) FROM tickets GROUP BY status; SELECT id, company_name FROM company_settings;"
```

Hasil yang diharapkan setelah setup baru: 5 migrasi dan satu baris `default` di `company_settings`. Tiket: 0 setelah `pnpm seed`, 15 setelah `pnpm seed:demo`.

### Default Credentials (hanya `pnpm seed:demo`)

| Email | Password | Role |
|-------|----------|------|
| sysadmin@company.co.id | password123 | SYSTEM_ADMIN |
| budi.santoso@it.company.co.id | password123 | IT_WORKER |
| maria.anggraini@it.company.co.id | password123 | PM |
| yoga.prakoso@it.company.co.id | password123 | DUTY_ENGINEER |
| rina.wulandari@company.co.id | password123 | USER_NON_IT |

Semua user demo memakai password `password123`. Jangan dipakai di production: `pnpm seed` membuat admin dengan password sendiri.

## Docker

### Build & Run

```bash
docker compose up --build -d    # app saja (port host 8080 -> container 3000)
docker compose ps
docker compose logs -f app
docker compose down
```

Container membaca `.env` lewat `env_file`. Database tidak ada di compose: `DATABASE_URL` harus menunjuk ke database yang sudah dimigrasi (dari container gunakan `host.docker.internal` bila DB ada di host).

### Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `DATABASE_URL` | - | Wajib. URL database, mis. `mysql2://root:PASSWORD@host.docker.internal:3306/ticketing_db` |
| `JWT_SECRET` | - | Wajib di production. Juga dipakai MCP untuk mengenkripsi token: bila diganti, token MCP lama tidak bisa ditampilkan lagi (login lewat hash tetap jalan) |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token login |
| `NODE_ENV` | - | Isi `production` di server |
| `NUXT_PUBLIC_APP_ENV` | `production` | `production` menyembunyikan akun demo di halaman login; `staging` atau `development` menampilkannya. Cukup restart container |
| `UPLOAD_DIR` | `./server/uploads` | Direktori file bila S3 tidak dipakai |
| `S3_ENDPOINT` | kosong | Bila diisi, file disimpan di S3/MinIO. Kosong = disk (`UPLOAD_DIR`) |
| `S3_BUCKET` | - | Wajib bila `S3_ENDPOINT` diisi. Dibuat otomatis bila belum ada |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | - | Wajib bila `S3_ENDPOINT` diisi. Compose MinIO memakai nilai yang sama sebagai kunci root |
| `S3_REGION` | `us-east-1` | Region S3 |
| `S3_FORCE_PATH_STYLE` | `true` | `true` untuk MinIO, `false` untuk AWS S3 |
| `ADMIN_PASSWORD` | acak | Password awal `sysadmin@company.co.id`, hanya dibaca `pnpm seed` saat admin belum ada. Kosong = acak, dicetak sekali di output seeder |
| `DATABASE_URL_TEST` | - | DB terpisah untuk test integrasi (nama harus memuat "test") |

### Penyimpanan File (disk atau S3/MinIO)

Backend dipilih dari environment saat app start. URL di DB selalu `/api/uploads/...` dan diunduh lewat API (perlu login), jadi bucket tidak perlu publik dan data lama tetap valid. Bila S3 aktif, file lama di `UPLOAD_DIR` tetap terbaca (fallback ke disk) tetapi tidak dipindahkan otomatis ke bucket. Bila `S3_ENDPOINT` diisi tetapi bucket atau kunci kosong, app gagal start.

Server S3 boleh di host lain: isi `S3_ENDPOINT` dengan URL-nya (sebaiknya HTTPS) dan pastikan kunci punya izin `ListBucket`, `GetObject`, `PutObject`, `DeleteObject`. Setelah mengubah `.env`, jalankan `docker compose up -d app`.

MinIO lokal lewat compose (profile `s3`, tidak ikut `docker compose up` biasa):

```bash
S3_ACCESS_KEY=... S3_SECRET_KEY=... docker compose --profile s3 up -d minio
# API 127.0.0.1:9100, konsol 127.0.0.1:9101 (akses jarak jauh lewat SSH tunnel)
```

`S3_ENDPOINT=http://minio:9000` bila app jalan di compose yang sama, `http://localhost:9100` bila memakai `pnpm dev`. Image `minio/minio` di Docker Hub sudah tidak tersedia, jadi compose memakai `cgr.dev/chainguard/minio`. Data MinIO ada di volume `minio_data`; backup volume belum diatur. Cek manual backend: `npx tsx server/services/storage/storage.check.ts` (dengan atau tanpa `S3_*`).

### Deploy otomatis

Push ke `main` memicu webhook yang menjalankan `deploy.sh` (reset ke `origin/main`, lalu `docker compose up -d --build app`). Rinciannya ada di `docs/CI-CD-WEBHOOK.md`. Deploy tidak menjalankan migrasi dan tidak menyentuh MinIO atau `.env`: jalankan `drizzle-kit migrate` lebih dulu bila rilis menambah migrasi.

### Development

```bash
pnpm install
DATABASE_URL="mysql2://root:PASSWORD@localhost:3306/ticketing_db" pnpm run dev
```

Buka http://localhost:3000

### Build & Preview

```bash
pnpm run build
pnpm run preview
```

### Tests

```bash
# Test integrasi menghapus semua tabel di DATABASE_URL_TEST lalu memigrasinya.
# Pakai database khusus test, jangan DATABASE_URL.
DATABASE_URL_TEST="mysql2://root:PASSWORD@localhost:3306/ticket_db_test" pnpm vitest run
```

## Status Tiket

```
DRAFT    → PROCESS
PROCESS  → DRAFT (ditarik pemohon) | SELESAI | DELEGASI
DELEGASI → PROCESS
SELESAI  → PROCESS (buka ulang oleh IT)
```

Tiket `SELESAI` terkunci: penugasan dan anggota tidak bisa diubah sampai dibuka ulang.

## License

Proprietary: Internal Use Only
