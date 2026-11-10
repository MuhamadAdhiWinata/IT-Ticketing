# PRD: Revisi Besar 06112026

**Sumber:** `docs/06112026.md` (issue 001-011)
**Branch:** `dev`
**Diperbarui:** 10 November 2026
**Stack:** Nuxt 4 + Nitro + Drizzle + MariaDB (dokumen sumber menyebut NestJS DTO/Multer; itu tidak berlaku, padanannya zod + `parseMultipart`).

Legenda status: **ADA** = selesai dan terverifikasi, **SEBAGIAN** = ada tapi ada celah, **BELUM** = tidak ada.
Legenda keputusan: **KERJAKAN** = spesifikasi pasti, **HOLD** = menunggu keterangan dari pemilik produk.

## 1. Ringkasan

| Status awal | Jumlah issue |
|-------------|--------------|
| ADA | 3 (003, 004, 005) |
| SEBAGIAN | 3 (001, 002, 006) |
| BELUM | 5 (007-011) |

Spesifikasi 35 field sudah diberikan (10 November 2026) dan seluruh item 007-010 dikerjakan. Lihat bagian 4 untuk pemetaan field.

Keputusan desain: prioritas tetap 4 level di DB (`LOW/MEDIUM/HIGH/CRITICAL`). P1-P4 dipetakan P1=CRITICAL, P2=HIGH, P3=MEDIUM, P4=LOW agar `categories.sla_*` tidak berubah. Status alur DB tetap `DRAFT/PROCESS/DELEGASI/SELESAI`; label spesifikasi (Baru, Diakui, Ditriase, Dikerjakan, Menunggu Pemohon, Selesai, Ditutup, Dialihkan) diturunkan di `status_label`.

## 2. Status per issue (kondisi awal vs sekarang)

| Kode | Kebutuhan | Awal | Sekarang | Keputusan |
|------|-----------|------|----------|-----------|
| 001a | CRITICAL wajib lampiran | SEBAGIAN (client bisa memalsukan `attachmentCount`) | SEBAGIAN: server kini menolak `DRAFT>PROCESS` CRITICAL tanpa berkas di tabel `files` | Sisa: tiket dibuat sebelum upload, belum ada rollback. KERJAKAN nanti |
| 001b | Log tiket masuk IT terlihat user | SEBAGIAN (user hanya lihat miliknya) | ADA: ringkasan hari/7 hari/bulan kini memuat semua tiket; daftar log tetap milik sendiri | Selesai |
| 002 | Aplikasi/Project + Sub Modul bertingkat | SEBAGIAN | SEBAGIAN | Label "Project/Kendala" belum jadi "Aplikasi/Project", server belum memeriksa submodul milik project. HOLD sampai ada keputusan penamaan |
| 003 | Menu Tiket Saya | ADA | ADA (`GET /api/tickets` sengaja tetap menampilkan semua tiket ke semua role) | Selesai |
| 004 | Lokasi disembunyikan untuk IT Programmer | ADA | ADA | Selesai |
| 005 | Perusahaan/Divisi | ADA fungsional, API tanpa guard | ADA: API users/companies/divisions kini wajib SYSTEM_ADMIN untuk tulis | Selesai |
| 006 | Gambar inline di komentar | SEBAGIAN | SEBAGIAN: `GET comments` kini cek akses tiket; tautan `comment_files` untuk gambar inline belum | `/api/upload` belum validasi tipe/akses tiket. KERJAKAN nanti |
| 007 | Form PIC 12 field | BELUM | ADA: field 1-12 di form, validasi zod server (judul 120, cara lain bersyarat, bukti minimal salah satu) | Selesai |
| 008 | Role PM / Duty Engineer, Kanal Asal | BELUM | ADA: role `PM`, `DUTY_ENGINEER`; Kanal Asal dan Buat atas nama untuk PM/Duty/Admin; unit + label PIC di master user | Selesai |
| 009 | Matriks Dampak x Urgensi, `/accept`, `/acknowledge`, Jenis Tiket | BELUM | ADA: `/triage`, `/acknowledge`, `/accept`, `/duty-confirm`, `/close`; matriks di `utils/ticketSpec.ts` | Selesai. Nilai matriks adalah usulan, perlu persetujuan PM |
| 010a | Pelaksana tunggal | BELUM (backend ada, UI tidak) | ADA: dropdown Pelaksana di detail tiket untuk SYSTEM_ADMIN memakai `/assignee` | Selesai |
| 010b | Tertahan Oleh, Tujuan Pengalihan, PL Data, Duplikat dari | BELUM | ADA: `/execution` (Tertahan Oleh, Menunggu Pemohon, Task Odoo), pengalihan + Duplikat via `/triage`, PL Data wajib persetujuan PIC | Selesai |
| 011a | Solusi Penyelesaian (ringkasan + jenis) | BELUM | ADA: jenis Panduan / Data atau Konfigurasi / Perbaikan Kode / Solusi Sementara | Selesai |
| 011b | Tautan utang teknis wajib untuk Solusi Sementara; Task Odoo diisi Engineer | BELUM | ADA: divalidasi server (http/https saja) dan di form | Selesai |
| 011c | Counter buka ulang | BELUM | ADA: `reopen_count` naik setiap `SELESAI>PROCESS`, tampil di detail | Selesai |

## 3. Tabel keputusan

### 3.1 Dikerjakan sekarang (spesifikasi pasti)

| # | Pekerjaan | Issue | Status |
|---|-----------|-------|--------|
| 1 | Guard `requireRole('SYSTEM_ADMIN')` untuk tulis users/companies/divisions (celah keamanan: user biasa bisa mengubah role) | 005 | [x] |
| 2 | `GET /api/tickets` TIDAK difilter: halaman utama menampilkan semua pekerjaan IT agar user tahu beban kerja IT | 003 | dibatalkan (disengaja) |
| 3 | `GET /api/tickets/[id]/comments` cek akses tiket | 006 | [x] |
| 4 | CRITICAL wajib lampiran dihitung server dari tabel `files` saat mulai proses | 001a | [x] |
| 5 | Ringkasan incoming log mencakup semua tiket | 001b | [x] |
| 6 | Migrasi `0004_ticket_triage_fields` (7 kolom `tickets`) + seeder | 009-011 | [x] |
| 7 | `reopen_count` bertambah saat buka ulang | 011c | [x] |
| 8 | Solusi penyelesaian + tautan Odoo/utang teknis (server, form, tampilan) | 011a/b | [x] |
| 9 | Dropdown Pelaksana | 010a | [x] |
| 10 | Test integrasi (solusi, reopen, CRITICAL) | - | [x] |
| 11 | Migrasi `0005_ticket_intake_triage` (22 kolom `tickets`, `users.unit`, `users.is_pic`) + seeder | 007-010 | [x] |
| 12 | Formulir pemohon 12 field + validasi server | 007 | [x] |
| 13 | Role `PM`, `DUTY_ENGINEER`, Kanal Asal, Buat atas nama | 008 | [x] |
| 14 | Triase PM, matriks P1-P4, Akui, Terima, konfirmasi Duty Engineer P1/P2 | 009 | [x] |
| 15 | Eksekusi Pelaksana, pengalihan, Duplikat, PL Data, Tutup | 010b | [x] |
| 16 | Test: validasi form, matriks, triase, Duty, eksekusi (122 test) | - | [x] |

### 3.2 Hold atau ditunda

| # | Pekerjaan | Issue | Alasan |
|---|-----------|-------|--------|
| H1-H4 | Form PIC, role PM/Duty, matriks + Akui/Terima, Tertahan Oleh/pengalihan/PL Data/Duplikat | 007-010 | Dikerjakan 10 November 2026 (lihat bagian 3.1 #11-16) |
| H5 | Rename "Project/Kendala" ke "Aplikasi/Project", validasi submodul milik project | 002 | Perlu keputusan penamaan dan dampak ke data lama |
| H6 | Rollback tiket CRITICAL bila upload gagal | 001a | Perlu desain ulang alur buat tiket + upload |
| H7 | Tautan `comment_files` untuk gambar inline, validasi tipe dan akses di `/api/upload` | 006 | Pekerjaan terpisah |

## 4. Perubahan teknis

- Skema `tickets`: `reopen_count`, `resolution_summary`, `solution_type`, `odoo_task_url`, `tech_debt_url`, `acknowledged_at`, `accepted_at` (migrasi `drizzle/0004_ticket_triage_fields.sql`).
- API: `POST /api/tickets/:id/stages/complete` menerima `solution` (`{ type, summary, odoo_task_url?, tech_debt_url? }`), hanya untuk transisi ke `SELESAI`.
- Serialisasi tiket: `reopen_count`, `solution_type`, `resolution_summary`, `odoo_task_url`, `tech_debt_url`, `acknowledged_at`, `accepted_at`.
- Seeder: 4 tiket SELESAI berisi solusi; satu memakai solusi sementara dengan tautan, satu dengan `reopen_count = 1`.

## 5. Risiko dan catatan

- Daftar tiket penuh terlihat semua role secara sengaja (transparansi beban kerja IT). Akses detail, komentar, dan aksi tetap dibatasi per tiket.
- Menu Master Data untuk non-admin memang sudah tersembunyi; guard server kini sejalan.
- Migrasi `0004` dan `0005` harus dijalankan (`npx drizzle-kit migrate`) sebelum kode ini dideploy.
- Matriks Dampak x Urgensi belum ada angkanya di spesifikasi. Nilai awal: Luas/Tinggi=P1, Luas/Sedang=P2, Sedang/Tinggi=P2, Luas/Rendah=P3, Sedang/Sedang=P3, Terbatas/Tinggi=P3, sisanya P4. Ubah di `utils/ticketSpec.ts`.
- Prioritas P1-P4 hanya untuk Insiden; jenis lain tidak punya prioritas dan memakai nilai bawaan form.
- Tiket lama tidak punya field baru (kolom nullable); tampil kosong.
- Peran `PM` dan `DUTY_ENGINEER` dianggap tim IT (akses sama dengan IT_WORKER); PM dan SYSTEM_ADMIN boleh triase.

## 6. Sisa pekerjaan

1. Persetujuan nilai matriks Dampak x Urgensi oleh PM.
2. Countdown SLA berdasarkan P1-P4 (SLA kategori lama masih dipakai).
3. H5 validasi server submodul milik aplikasi, H6 rollback upload CRITICAL, H7 `comment_files` untuk gambar inline.
4. Uji visual UI di browser (formulir pemohon, panel triase) belum dilakukan; yang diuji adalah API dan type check.
