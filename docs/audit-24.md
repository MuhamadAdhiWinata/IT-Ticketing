# Laporan Cleanup Master (prompt-24)

Tanggal: 2026-10-24. Awal: branch `main`, HEAD `399038d`, tree bersih. Tidak ada commit, push, atau deploy.

## 1. Ringkasan

| Task | Status |
|---|---|
| 1 Tema terang default | PASS (browser) |
| 2 Responsif | PASS 72/72 sel; tap target di 375: 0 elemen di bawah 40px di 10 halaman |
| 3 Hapus `verification/` | PASS |
| 4 Bersih repo | PASS (sebagian, lihat bagian 4) |
| 5 Migrasi Drizzle | PASS di DB sekali pakai; baseline prod NOT TESTED |
| 6 Audit tambahan | 3 dari 6 temuan diperbaiki dan diuji; sisanya perlu keputusan pengguna |
| 7 Tes akhir | vitest PASS, build PASS, lint dan typecheck BLOCKED |

## 2. Task 1: Tema

- `nuxt.config.ts`: skrip inline di `<head>` (prioritas critical) menambah `dark` hanya bila `localStorage.darkMode === '1'`.
- `plugins/theme.client.ts`: `prefers-color-scheme` diabaikan.
- `stores/app.ts`: preferensi server `null` berarti terang.
- Bukti (Playwright, `colorScheme: 'dark'`, port 4100): storage kosong, `dark=false` sebelum dan sesudah hydration, latar `rgb(248,250,252)`. Tersimpan `1`: gelap sebelum hydration, tanpa kedipan. Tersimpan `0`: terang. 0 page error. Skrip ada di HTML SSR.
- Klik-tembus 375px: toggle Mode Gelap menyimpan `1`, reload tetap gelap; Mode Terang menyimpan `0`, reload terang. Modal sukses, halaman buat tiket, sidebar, dan state kosong ("Belum ada tiket masuk") terlihat di tema terang.
- NOT TESTED: state error toast (tidak ada jalur error yang dipicu).

## 3. Task 2: Responsif

Rute nyata: `/login`, `/`, 404. Tampilan lain adalah state store (`?tab=`, `?view=`). Matriks 12 rute x 6 viewport (320x720, 375x812, 430x932, 768x1024, 1366x768, 1920x1080), login `sysadmin@company.co.id` di DB lokal `ticket_resp`.

Temuan dan perbaikan:

| Temuan | Penyebab | Perbaikan |
|---|---|---|
| 768: dashboard lebar dokumen 785 | Kanban `md:grid-cols-4` padahal sidebar permanen sudah muncul di `md` | `ITDashboard.vue`: kanban `md:` jadi `lg:` |
| 768: daily-work lebar 897 | Anak flex tanpa `min-w-0` | `DailyWorkView.vue`: `min-w-0` pada dua `flex-1` |
| 768: kartu KPI memotong label | `md:grid-cols-4` | `ITDashboard.vue`: `lg:grid-cols-4` |
| Tombol "Hapus" Master Data terpotong di 375 | grup kiri kartu kategori tanpa `min-w-0`, tombol tanpa `shrink-0`, nama `truncate` jadi "I…" | `AdminMasterView.vue`: `min-w-0`, `shrink-0`, nama membungkus (`break-words`) |
| Judul navbar menempel ke tombol refresh di 320 | tanpa gap dan `min-w-0` | `Navbar.vue`: gap, `min-w-0`, `truncate`, `shrink-0` |
| Tap target kurang dari 44px (mobile) | tombol 28-34px di hampir semua halaman | Per komponen: `Navbar.vue`, `Sidebar.vue`, `RefreshButton.vue`, `login.vue`, `TicketIncomingLog.vue`, `TrackingView.vue`, `AdminMasterView.vue`. Sisanya satu aturan global di `app/globals.css`: `@media (max-width: 767px)` `:where(button, select, textarea, input)` `min-height: 2.75rem` dan `button` `min-width: 2.75rem` (specificity 0, kelas komponen tetap menang). Desktop tidak berubah (screenshot 1366 dashboard). Lama: `Navbar.vue`, `Sidebar.vue`, `RefreshButton.vue`, `login.vue`, `TicketIncomingLog.vue`, `TrackingView.vue`: `min-h-11`/`w-11` hanya di bawah `md`, desktop tidak berubah |

Hasil akhir: 72/72 sel tanpa scroll horizontal dan tanpa elemen keluar layar. Tidak ada `overflow-x: hidden`. 0 error console. Probe tap target 375 (tombol, tautan, input, select, textarea di bawah 40px) pada 10 halaman termasuk Admin: 0 elemen. Checkbox login 16px (labelnya 44px). Tautan teks "Hapus"/"Edit" di sub-tab Admin selain Kategori dan Perusahaan memakai `button` sehingga ikut aturan global.

Catatan metode: probe overflow mengabaikan elemen yang terpotong di dalam kontainer overflow; cacat KPI dan "Hapus" ditemukan lewat screenshot, bukan probe.

Tidak teruji: tampilan visual sub-tab Admin Prioritas, Perusahaan & Divisi, Master Account di mobile (hanya probe angka). Android install, iOS, dan akun prod NOT TESTED.

## 4. Task 3 dan 4: Hapus file

Dihapus lewat `git rm` (belum commit):

| File | Bukti aman |
|---|---|
| `verification/` (37 file, 5,3 MB) | hanya dirujuk `scripts/clickthrough.ts` (membuat ulang) dan dokumen audit lama. `/verification/` ditambah ke `.gitignore` |
| `public/images/icon neutron.png` | md5 sama dengan `public/icons/icon-neutron.png`; nol referensi |
| `metadata.json` | nol referensi; sisa scaffold AI Studio |
| `migrate.sql`, `scripts/apply-{discussion,master,org,project-kendala}-migration.ts` | nol referensi dari kode, package.json, Dockerfile, deploy; diganti migrasi Drizzle (bagian 5) |

Dipertahankan: `artifacts/pwa-audit/` (bukti audit PWA sebelumnya, 684 KB, tidak dirujuk kode; hapus bila tidak dibutuhkan), `public/images/IO.png` (dipakai `TrackingView.vue`), `deploy.sh` (dipakai webhook). `anti-slop/audit-001-*.md` masih menyebut `verification/` sebagai sejarah.

## 5. Task 5: Drizzle

Kondisi awal: `drizzle/` ada di `.gitignore` (nol file terlacak). Lokal ada `0000` (12 tabel, memuat `technicians`, `subcategories`) dan `0001_company_settings` yang tidak terdaftar di journal; tidak ada `ticket_members`, `companies`, dll. Migrasi dari kosong hanya menghasilkan 13 tabel, bukan 17.

Perubahan:
- `drizzle/` dihapus dari `.gitignore` (`.dockerignore` tetap). Salinan lama: `/tmp/opencode/drizzle-old/`.
- Dibuat ulang satu baseline `drizzle/0000_baseline.sql` dari `schema.ts` (17 tabel) lewat `drizzle-kit generate`. Alasan: riwayat lama tidak pernah konsisten dengan prod maupun `schema.ts` dan tidak pernah terlacak, jadi tidak ada riwayat valid yang hilang.
- README: `drizzle-kit push` jadi `drizzle-kit migrate`.

Validasi (MariaDB 10.10 lokal, DB sekali pakai `ticket_mig`, sudah dihapus):
- `drizzle-kit check`: "Everything's fine".
- `drizzle-kit migrate` dari kosong: sukses, 17 tabel + `__drizzle_migrations` (1 baris).
- Jalan ulang: sukses, tidak ada duplikat.
- Perbandingan kolom, indeks, FK, collation dengan `ticket_resp` (hasil `push` dari `schema.ts`): beda hanya tabel `__drizzle_migrations`.

Prosedur baseline prod (belum dijalankan, prod tidak disentuh): prod `ticketing_db` sudah dimigrasi manual dan tidak punya `__drizzle_migrations`. Skema prod harus dibandingkan dulu dengan `schema.ts` (sebelumnya 0 beda), lalu `__drizzle_migrations` dibuat dan diisi satu baris untuk `0000_baseline` (hash dari `drizzle/meta/_journal.json`/isi file) tanpa menjalankan SQL-nya. Jangan jalankan `drizzle-kit migrate` di prod sebelum baris itu ada, karena `CREATE TABLE` akan gagal. Status: NOT TESTED (butuh persetujuan).

Pengungkapan: sebelum prompt ini, atas permintaan pengguna, DB prod dimigrasi manual dari `/tmp/opencode/migrate-prod.sql` (salinan di `~/backups/migrate-prod-*.sql` server; backup `~/backups/ticketing_db-20261024-111824-pre-migrate.sql`). Rename `subcategories` jadi `project_kendala`; tambah kolom SLA, `submodules`, `companies`, `divisions`, `vendors`, `notifications`, dan kolom `users.company_id/division_id`. Tidak ada perubahan prod selama prompt-24.

## 6. Task 6: Temuan tambahan

Diperbaiki dan diuji:
1. `pages/login.vue`: akun demo dan isian otomatis hanya saat `import.meta.dev`. Image Docker produksi: `/login` 200, 0 kemunculan `password123` dan `Demo Akun`. PASS.
2. `server/utils/auth.ts`: throw `JWT_SECRET wajib diisi di production` bila `NODE_ENV=production` tanpa secret. Image produksi: gagal start tanpa secret, jalan dengan secret. PASS. Prod `.env` sudah punya `JWT_SECRET` (53 karakter). Catatan: `NODE_ENV` tidak ada di `.env` prod; compose meneruskan nilai kosong, jadi image prod mengandalkan `NODE_ENV=production` dari build Nitro atau env. Cek setelah deploy bahwa guard aktif (NOT TESTED di prod).
3. `Dockerfile`: `corepack` pnpm 10.28.1, `pnpm install --frozen-lockfile`, `pnpm run build`. Build image lokal sukses.

Belum diperbaiki (butuh keputusan pengguna, prod tidak disentuh):
4. Port DB 3306 terbuka dan `root@%` di server prod.
5. Semua akun seed prod memakai `password123` (perlu rotasi).
6. Typecheck dan lint tanpa tooling (`vue-tsc`, `@nuxt/eslint` tidak terpasang); tidak menambah dependensi tanpa diminta.

## 7. Task 7: Tes

| Cek | Hasil |
|---|---|
| `npx vitest run` | PASS, 6 file, 61 tes |
| `npx nuxt build` | PASS |
| `npx nuxt typecheck` | BLOCKED: `vue-tsc` belum terpasang |
| `npx nuxt lint` | BLOCKED: perintah `lint` tidak ada (`@nuxt/eslint` belum terpasang) |
| Matriks responsif 72 sel | PASS (dijalankan ulang setelah semua edit, termasuk aturan tap target global) |
| Probe tap target 375, 10 halaman | PASS, 0 elemen di bawah 40px |
| Build image Docker (pnpm) dan jalan produksi | PASS |
| Migrasi dari kosong, ulang, check | PASS |
| Klik-tembus mobile 375 | PASS, 0 page error |

## 8. File berubah

Termodifikasi: `.gitignore`, `README.md`, `nuxt.config.ts`, `plugins/theme.client.ts`, `stores/app.ts`, `server/api/user/preferences.ts`, `pages/login.vue`, `server/utils/auth.ts`, `Dockerfile`, `app/globals.css`, `components/views/AdminMasterView.vue`, `components/RefreshButton.vue`, `components/common/TicketIncomingLog.vue`, `components/dashboard/{ITDashboard,DailyWorkView}.vue`, `components/global/{Navbar,Sidebar}.vue`, `components/views/TrackingView.vue`. Baru: `drizzle/` (3 file), `docs/audit-24.md`. Terhapus: lihat bagian 4. Total diff terhadap HEAD: 58 file.

## 9. Risiko dan langkah berikut

1. Baseline prod harus ditandai sebelum deploy yang memakai `drizzle-kit migrate`.
2. Putuskan temuan 4 dan 5 bagian 6 (port 3306, rotasi password seed).
3. Setelah deploy, pastikan app prod tetap start (guard `JWT_SECRET`) dan login tanpa akun demo.
4. Pasang `vue-tsc` dan `@nuxt/eslint` bila ingin gerbang typecheck/lint.
5. Review diff, lalu commit manual. Tidak ada yang di-commit di sesi ini.
