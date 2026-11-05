# PRD: Revisi Besar 06112026

**Sumber:** `docs/06112026.md` (issue 001-011)
**Branch:** `dev`
**Diperbarui:** 6 November 2026
**Stack:** Nuxt 4 + Nitro + Drizzle + MariaDB (dokumen sumber menyebut NestJS DTO/Multer; itu tidak berlaku, padanannya zod + `parseMultipart`).

Legenda status: **ADA** = selesai dan terverifikasi, **SEBAGIAN** = ada tapi ada celah, **BELUM** = tidak ada.
Legenda keputusan: **KERJAKAN** = spesifikasi pasti, **HOLD** = menunggu keterangan dari pemilik produk.

## 1. Ringkasan

| Status awal | Jumlah issue |
|-------------|--------------|
| ADA | 3 (003, 004, 005) |
| SEBAGIAN | 3 (001, 002, 006) |
| BELUM | 5 (007-011) |

Alasan HOLD utama: 35 "Point" field form PIC (issue 007-011) tidak didefinisikan di repo maupun di `docs/06112026.md`. Setiap item yang bergantung pada nama, jenis, atau aturan field itu tidak bisa dibangun tanpa menebak.

Keputusan desain: prioritas tetap 4 level (`LOW/MEDIUM/HIGH/CRITICAL`). P1-P4 dipetakan ke level itu agar `categories.sla_*` tidak berubah.

## 2. Status per issue (kondisi awal vs sekarang)

| Kode | Kebutuhan | Awal | Sekarang | Keputusan |
|------|-----------|------|----------|-----------|
| 001a | CRITICAL wajib lampiran | SEBAGIAN (client bisa memalsukan `attachmentCount`) | SEBAGIAN: server kini menolak `DRAFT>PROCESS` CRITICAL tanpa berkas di tabel `files` | Sisa: tiket dibuat sebelum upload, belum ada rollback. KERJAKAN nanti |
| 001b | Log tiket masuk IT terlihat user | SEBAGIAN (user hanya lihat miliknya) | ADA: ringkasan hari/7 hari/bulan kini memuat semua tiket; daftar log tetap milik sendiri | Selesai |
| 002 | Aplikasi/Project + Sub Modul bertingkat | SEBAGIAN | SEBAGIAN | Label "Project/Kendala" belum jadi "Aplikasi/Project", server belum memeriksa submodul milik project. HOLD sampai ada keputusan penamaan |
| 003 | Menu Tiket Saya | ADA | ADA (+ `GET /api/tickets` kini difilter untuk USER_NON_IT) | Selesai |
| 004 | Lokasi disembunyikan untuk IT Programmer | ADA | ADA | Selesai |
| 005 | Perusahaan/Divisi | ADA fungsional, API tanpa guard | ADA: API users/companies/divisions kini wajib SYSTEM_ADMIN untuk tulis | Selesai |
| 006 | Gambar inline di komentar | SEBAGIAN | SEBAGIAN: `GET comments` kini cek akses tiket; tautan `comment_files` untuk gambar inline belum | `/api/upload` belum validasi tipe/akses tiket. KERJAKAN nanti |
| 007 | Form PIC 12 field | BELUM | BELUM | HOLD (butuh daftar Point) |
| 008 | Role PM / Duty Engineer, Kanal Asal | BELUM | BELUM | HOLD |
| 009 | Matriks Dampak x Urgensi, `/accept`, `/acknowledge`, Jenis Tiket | BELUM | BELUM. Kolom `acknowledged_at`, `accepted_at` sudah disiapkan di skema | HOLD (bergantung role 008) |
| 010a | Pelaksana tunggal | BELUM (backend ada, UI tidak) | ADA: dropdown Pelaksana di detail tiket untuk SYSTEM_ADMIN memakai `/assignee` | Selesai |
| 010b | Tertahan Oleh, Tujuan Pengalihan, PL Data, Duplikat dari | BELUM | BELUM | HOLD (butuh definisi Point; kolom `referenced_ticket_id` sudah ada) |
| 011a | Solusi Penyelesaian (ringkasan + jenis) | BELUM | ADA: wajib diisi saat menyelesaikan tiket | Selesai |
| 011b | Tautan Odoo + utang teknis wajib untuk Solusi Sementara | BELUM | ADA: divalidasi server (http/https saja) dan di form | Selesai |
| 011c | Counter buka ulang | BELUM | ADA: `reopen_count` naik setiap `SELESAI>PROCESS`, tampil di detail | Selesai |

## 3. Tabel keputusan

### 3.1 Dikerjakan sekarang (spesifikasi pasti)

| # | Pekerjaan | Issue | Status |
|---|-----------|-------|--------|
| 1 | Guard `requireRole('SYSTEM_ADMIN')` untuk tulis users/companies/divisions (celah keamanan: user biasa bisa mengubah role) | 005 | [x] |
| 2 | `GET /api/tickets` hanya tiket milik sendiri untuk USER_NON_IT | 003 | [x] |
| 3 | `GET /api/tickets/[id]/comments` cek akses tiket | 006 | [x] |
| 4 | CRITICAL wajib lampiran dihitung server dari tabel `files` saat mulai proses | 001a | [x] |
| 5 | Ringkasan incoming log mencakup semua tiket | 001b | [x] |
| 6 | Migrasi `0004_ticket_triage_fields` (7 kolom `tickets`) + seeder | 009-011 | [x] |
| 7 | `reopen_count` bertambah saat buka ulang | 011c | [x] |
| 8 | Solusi penyelesaian + tautan Odoo/utang teknis (server, form, tampilan) | 011a/b | [x] |
| 9 | Dropdown Pelaksana | 010a | [x] |
| 10 | Test integrasi (solusi, reopen, CRITICAL) | - | [x] |

### 3.2 Hold atau ditunda

| # | Pekerjaan | Issue | Alasan |
|---|-----------|-------|--------|
| H1 | 12 field form PIC, field kondisional | 007 | Daftar Point tidak ada |
| H2 | Role PM / Duty Engineer, Kanal Asal, "Buat atas nama" untuk PM | 008 | Hak akses dan nama role belum jelas |
| H3 | Matriks Dampak x Urgensi, endpoint `/accept` dan `/acknowledge`, Jenis Tiket, konfirmasi Duty Engineer P1/P2, countdown SLA | 009 | Bergantung H2 dan definisi matriks |
| H4 | Tertahan Oleh, Tujuan Pengalihan, PL Data, Duplikat dari | 010b | Definisi Point |
| H5 | Rename "Project/Kendala" ke "Aplikasi/Project", validasi submodul milik project | 002 | Perlu keputusan penamaan dan dampak ke data lama |
| H6 | Rollback tiket CRITICAL bila upload gagal | 001a | Perlu desain ulang alur buat tiket + upload |
| H7 | Tautan `comment_files` untuk gambar inline, validasi tipe dan akses di `/api/upload` | 006 | Pekerjaan terpisah |

## 4. Perubahan teknis

- Skema `tickets`: `reopen_count`, `resolution_summary`, `solution_type`, `odoo_task_url`, `tech_debt_url`, `acknowledged_at`, `accepted_at` (migrasi `drizzle/0004_ticket_triage_fields.sql`).
- API: `POST /api/tickets/:id/stages/complete` menerima `solution` (`{ type, summary, odoo_task_url?, tech_debt_url? }`), hanya untuk transisi ke `SELESAI`.
- Serialisasi tiket: `reopen_count`, `solution_type`, `resolution_summary`, `odoo_task_url`, `tech_debt_url`, `acknowledged_at`, `accepted_at`.
- Seeder: 4 tiket SELESAI berisi solusi; satu memakai solusi sementara dengan tautan, satu dengan `reopen_count = 1`.

## 5. Risiko dan catatan

- Perubahan perilaku: USER_NON_IT tidak lagi melihat tiket orang lain dari `GET /api/tickets`. Halaman yang bergantung pada daftar penuh (mis. pelacakan) kini hanya menampilkan tiket miliknya.
- Menu Master Data untuk non-admin memang sudah tersembunyi; guard server kini sejalan.
- `acknowledged_at` dan `accepted_at` belum terisi sampai H3 dikerjakan.
- Migrasi `0004` harus dijalankan (`npx drizzle-kit migrate`) sebelum kode ini dideploy.

## 6. Yang dibutuhkan untuk membuka HOLD

1. Daftar lengkap 35 Point form PIC: nama, tipe, wajib atau tidak, aturan kondisional.
2. Nama dan hak akses role PM dan Duty Engineer.
3. Aturan matriks Dampak x Urgensi dan pemetaan P1-P4 ke prioritas.
4. Keputusan penamaan "Aplikasi/Project".
