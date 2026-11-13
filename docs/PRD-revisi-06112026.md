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

Keputusan desain: prioritas tetap 4 level di DB (`LOW/MEDIUM/HIGH/CRITICAL`). P1-P4 dipetakan P1=CRITICAL, P2=HIGH, P3=MEDIUM, P4=LOW agar `categories.sla_*` tidak berubah. Status alur DB tetap `DRAFT/PROCESS/DELEGASI/SELESAI`; fase tampilan diturunkan di `status_phase`: Baru, Diakui, Ditriase, Dikerjakan, Menunggu Pemohon, Selesai. "Selesai" satu fase akhir dengan tiga hasil (`status_outcome`): Selesai, Ditutup, Dialihkan. `status_label` = hasil akhir bila sudah di fase akhir, selain itu fase. Alur tombol di detail tiket: Baru (tombol Akui) > Diakui (tombol Mulai Triase, `POST /api/tickets/:id/start-triage`, kolom `triaged_at`) > Ditriase (PM mengisi seluruh isian triase) > Dikerjakan > Menunggu Pemohon > Selesai. Stepper detail tiket hanya menampilkan fase ini (stepper 4 tahap lama dihapus). Jenis, dampak, urgensi, dan prioritas diisi PM pada fase Ditriase.

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

## Matriks kepatuhan 35 field

Lihat [spesifikasi-field-tiket.csv](./spesifikasi-field-tiket.csv): tiap field dipetakan ke kolom DB, endpoint, dan UI. Kanban/filter Dashboard dan Laporan memakai fase (Baru, Diakui, Ditriase, Dikerjakan, Menunggu Pemohon, Selesai dengan hasil Selesai/Ditutup/Dialihkan). Pelaksana dapat ditunjuk PM/Admin dari detail tiket.


## Hak akses dinamis (RBAC)

Peran, klaim, dan menu sidebar disimpan di DB (`roles`, `permissions`, `role_permissions`, `menus`; migrasi 0007) dan hanya SYSTEM_ADMIN yang dapat mengubahnya lewat menu **Hak Akses**. `users.role` menyimpan `roles.id`.

- Klaim aksi: `it.access` (tim IT), `ticket.triage`, `ticket.duty`, `ticket.intake`, `ticket.delete`, `worklog.view_all`, `master.manage`, `settings.manage`. Klaim menu: `menu.<id>`.
- SYSTEM_ADMIN superuser untuk klaim sistem (tidak dapat diubah, menu Hak Akses tidak dapat dinonaktifkan) agar admin tidak mengunci dirinya sendiri. Klaim operasional tiket (`ticket.triage`, `ticket.duty`) TIDAK otomatis dimiliki admin: peran PM dan Administrator terpisah.
- Server: `requireClaim(event, CLAIM.x)`; service memakai `isITRole`/`canTriageRole`/dst yang membaca matriks di memori (disegarkan dari DB tiap 5 detik dan seketika setelah admin menyimpan). Klien: `GET /api/rbac/me` (klaim + menu), admin: `/api/rbac`, `/api/rbac/roles[/:id]`, `/api/rbac/menus[/:id]`.
- Seeder `seedRbac()` idempoten (jalan saat start server, `seed`, `seed:demo`); tidak menimpa perubahan admin. Menu baru murni (halaman baru) tetap butuh kode; admin mengatur label, ikon, seksi, urutan, dan aktif.
- Peran bawaan: USER_NON_IT, IT_WORKER, PM, DUTY_ENGINEER, SYSTEM_ADMIN (tidak dapat dihapus). Peran kustom dapat ditambah dan dihapus bila tidak dipakai pengguna.


## Aturan ambil tiket dan penugasan

- Fase Baru, Diakui, Ditriase adalah pekerjaan PM (klaim `ticket.triage`): Akui, Mulai Triase, isi triase, Mulai Dikerjakan. Admin tidak dapat melakukannya.
- Pelaksana tidak lagi dipilih di form triase. Ambil Tiket (worker, untuk dirinya, bila belum ada Pelaksana) dan Tugaskan Pelaksana (PM) hanya di fase Dikerjakan; di fase lain server menolak dengan 409. Berlaku juga untuk endpoint `/assignee`, `/members`, dan tool MCP `assign_ticket`, `add_ticket_members`.
- Membuat tiket tidak lagi menawarkan "Simpan & Assign". Kartu kanban Dashboard bisa diseret antar fase, maju maupun mundur, lewat `POST /api/tickets/:id/move-phase` `{to, notes?}` (klaim `it.access`). Setiap perpindahan tercatat di audit log sebagai `FASE_DIPINDAHKAN` (detail `Fase asal -> Fase tujuan`). Dari/ke Baru, Diakui, Ditriase hanya PM; masuk ke Dikerjakan dari fase awal tetap butuh triase terisi dan konfirmasi Duty Engineer untuk Insiden P1/P2.
- Semua daftar tiket (Tiket Saya, Pekerjaan Saya, Dashboard, Laporan, CSV) menampilkan fase/hasil akhir (`status_label`), bukan DRAFT/PROCESS/DELEGASI/SELESAI.

## Auto-Rotate Duty Engineer Shift

Pemilik jadwal shift aktif otomatis mendapat klaim peran `DUTY_ENGINEER` di atas klaim perannya sendiri, dicabut sendiri saat shift berakhir. `users.role` tidak berubah, tanpa cron, tanpa klaim duty di JWT (migrasi 0008).

- Tabel `duty_schedules` (`user_id`, `start_at`/`end_at` UTC `datetime`, `status`, `notes`, `created_by`; indeks `(user_id, start_at, end_at)`). Status `ACTIVE`/`COMPLETED` dihitung dari waktu; hanya `CANCELLED` yang disimpan eksplisit.
- Tiap request terautentikasi: `server/middleware/auth.ts` memanggil `getDutyState(userId)` (jadwal bukan `CANCELLED` dan `start_at <= UTC_NOW < end_at`), hasilnya di-cache per user maksimal 60 detik atau sampai `end_at`/awal jadwal berikutnya, dan dibersihkan tiap jadwal berubah. Hasil: `user.dutyActive`. `requireClaim`, `Actor.dutyActive` (juga untuk MCP), dan `roleHas/claimsOf/menuAllowed(…, dutyActive)` menggabungkan klaim `DUTY_ENGINEER`.
- API (klaim `duty.manage`, default PM; daftar butuh `it.access`): `GET/POST /api/duty-schedules`, `PUT/DELETE /api/duty-schedules/:id` (DELETE = batalkan), `POST /api/duty-schedules/swap` `{schedule_id, new_user_id, notes}` (jadwal lama berakhir sekarang, pengganti bertugas sekarang sampai `end_at` asli). Overlap per user ditolak 409. Waktu di API: ISO 8601 UTC.
- `GET /api/rbac/me` menambah `active_permissions`, `is_duty_active`, `current_duty_end_at`, `next_duty_start_at` (jadwal mulai dalam 24 jam).
- Audit: kolom `on_duty` di `audit_logs` dan `worklogs` bernilai 1 bila penulisnya sedang ON DUTY; UI menampilkan label "On Duty" di riwayat dan aktivitas.
- UI: menu **Jadwal Duty** (input `datetime-local` dikonversi ke ISO UTC sebelum dikirim), `stores/duty.ts` memasang satu `setTimeout` ke batas shift terdekat (hanya bila selisih < 24 jam) dan ambil ulang `/api/rbac/me`, plus ulang saat `visibilitychange`. Navbar menampilkan badge "ON DUTY s/d HH:mm".

## Master Dampak, Urgensi, dan Prioritas (P1-P4)

Dampak, Urgensi, label Prioritas, dan matriks Dampak x Urgensi menjadi Prioritas disimpan di DB (migrasi 0009: `impacts`, `urgencies`, `priority_levels`, `priority_matrix`), diisi nilai awal otomatis saat server start (hanya bila kosong).

- Master Data > **Prioritas & Triase** (klaim `master.manage`): tambah/ubah/urut/nonaktifkan Dampak dan Urgensi, ubah label dan deskripsi P1-P4, isi matriks. Simpan satu kali (`PUT /api/triage-master`, satu transaksi). `GET /api/triage-master` untuk semua pengguna login.
- Himpunan P tetap P1-P4 karena terhubung ke SLA kategori (P1=CRITICAL, P2=HIGH, P3=MEDIUM, P4=LOW); tidak bisa ditambah/dihapus.
- Dampak/Urgensi yang masih dipakai tiket tidak dapat dihapus (409); nonaktifkan saja (tidak muncul di form triase, tiket lama tetap terbaca).
- Triase memvalidasi Dampak/Urgensi terhadap master, dan saran prioritas Insiden memakai matriks dari DB.
- Dashboard (kanban, tabel), Tiket Saya, Pekerjaan Saya, detail, dan Laporan menampilkan badge `P1 · Kritis` plus Urgensi dan Dampak, bukan lagi Low/Medium/High/Critical. Dashboard punya filter Prioritas (P1-P4), Urgensi, dan Dampak.

## Master SLA dan field Tally (workbook "SLA Tiket HO")

Sumber: `ISSUE/Copy of SLA Tiket HO.xlsx` (sheet SLA Configuration, Tally_Raw, Panduan, Uji).

- Master SLA (migrasi 0010, tabel `sla_targets` dan `sla_settings`, diedit di Master Data tab SLA, klaim `master.manage`): target respon/resolusi P1 sampai P4 + Default, cakupan 24/7 atau Jam Kerja, jam kerja per hari (9), jam mulai (08:00 WIB), ambang berisiko (80%). Nilai awal = sheet.
- Engine `utils/slaCalc.ts` (fungsi murni, diuji dengan 6 kasus tab Uji): jam layanan Senin sampai Sabtu 08-17 WIB, Minggu tidak dihitung kecuali 24/7. Target P1 sampai P4 hanya untuk Insiden; jenis lain dan tiket belum ditriase memakai Default.
- Respon = masuk sampai diakui. Resolusi neto = jam layanan dikurangi jeda Menunggu Pemohon. `first_completed_at` (selesai pertama) tidak ditimpa saat dibuka ulang. Dialihkan tidak dihitung selesai. Status: Sesuai SLA, Berisiko, Lewat SLA, On Track.
- Dasar kolom `categories.sla_*` lama tidak dipakai lagi.
- Field formulir baru dari Tally_Raw: Kontak yang dapat dihubungi (`tickets.contact`, wajib), Cabang atau bagian (dipakai kolom Lokasi, opsional untuk IT Programmer), opsi "Belum tahu" pada Pekerjaan masih bisa berjalan (tetap perlu triase, bukan default P4).
- Triase PM: "Data lengkap saat masuk" Ya/Tidak/Belum dinilai (`tickets.data_complete`).
- Belum dikerjakan: banyak interval Jeda Pemohon (hanya satu tersimpan), metrik Review Mingguan (median/P90 respon, kepatuhan %), daftar hari libur.
