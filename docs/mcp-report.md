# MCP IT-Ticketing: laporan

Endpoint: `POST /mcp` (Streamable HTTP, stateless, Bearer token). Logika bisnis di `server/services/ticketing/`, dipakai bersama oleh handler web dan tool MCP.

## 1. Matriks

Role: **IT** = `IT_WORKER` atau `SYSTEM_ADMIN`. **Pihak tiket** = IT, atau pemohon/pembuat tiket.
Test = nomor poin di `server/__tests__/mcp/mcp.integration.test.ts`.

| Fitur UI existing | MCP tool | Hak akses | Test | Status |
|---|---|---|---|---|
| Daftar tiket saya / dashboard | `list_my_tickets` | Semua user login (IT: assigned + member, pemohon: miliknya) | 1 | Selesai |
| Cari tiket / tracking | `search_tickets` | Semua user login (non-IT hanya tiket miliknya) | 1 | Selesai |
| Detail tiket | `get_ticket` | Pihak tiket; lampiran INTERNAL_ONLY disembunyikan dari non-IT | 1, 6, 14 | Selesai |
| Daftar aktivitas | `list_ticket_activities` | Pihak tiket | 2-5 | Selesai |
| Kirim aktivitas (tombol "Kirim") | `add_ticket_activity` | IT | 2-5, 10, 11, 12 | Selesai |
| Log Harian (DailyWorkView) | `log_work_time` | IT, tiket bukan DRAFT, jam tidak tumpang tindih | 10, 11 | Selesai |
| Komentar diskusi | `list_ticket_comments`, `add_comment` | Pihak tiket | 6 | Selesai |
| Catatan internal | `list_internal_notes`, `add_internal_note` | IT | 6, 10 | Selesai |
| Audit trail / riwayat | `get_ticket_history` | Pihak tiket | 7-9, 14 | Selesai |
| Lampiran | `list_ticket_attachments`, `add_attachment` | List: pihak tiket (sesuai visibilitas). Tambah: IT | 10, 13 | Selesai |
| Mulai Proses, Selesaikan, Delegasi, Draft, Kembali dari Delegasi | `transition_ticket_status` | IT | 7-9, 12, 13 | Selesai |
| Buka ulang tiket SELESAI | `reopen_ticket` | IT | 7-9 | Selesai |
| Ambil Tiket / tugaskan | `assign_ticket` | IT; worker hanya diri sendiri, `SYSTEM_ADMIN` boleh IT lain; terkunci saat SELESAI | 10 | Selesai |
| Tambah member | `add_ticket_members` | Pihak tiket, target harus IT, terkunci saat SELESAI | 10 | Selesai |
| Pilih worker / vendor | `list_workers`, `list_vendors` | IT | 10 | Selesai |
| Aksi yang boleh sekarang | `get_allowed_actions` | Semua user login | 7-9 | Selesai |
| Idempotensi semua tool tulis | parameter `idempotencyKey` | Sama dengan tool terkait | 12, 15 | Selesai |
| Rollback tanpa state parsial | semua tool tulis (transaksi) | - | 13 | Selesai |
| UI membaca data hasil MCP | - | - | 14 | Selesai |
| Daftar tool == matriks | - | - | 15 | Selesai |

Total 20 tool. Tidak ada tool generik (`execute_sql`, `update_any_table`, `run_arbitrary_action`); test 15 memastikannya.

## 2. Workflow

Sumber: `server/utils/ticket-lifecycle.ts` (`VALID_TRANSITIONS`), tidak ada transisi baru.

- DRAFT -> PROCESS
- PROCESS -> DRAFT / SELESAI / DELEGASI
- DELEGASI -> PROCESS
- SELESAI -> PROCESS (buka ulang)

Aturan yang ditegakkan server:
- Aktivitas baru selalu record baru di `worklogs`, tidak menimpa, tidak mengubah status (Rule 18).
- Tahap aktivitas: `ASSIGN` selalu; `IN_PROGRESS` hanya saat PROCESS; `COMPLETION` hanya saat SELESAI.
- Komentar (`comments`), aktivitas (`worklogs`), catatan internal (`internal_notes`) entitas terpisah.
- Assignment dan member terkunci saat SELESAI (Rule 06/07).
- Transisi ke DELEGASI wajib membawa data delegasi; vendor_id harus ada.
- Identitas pencatat selalu dari token. Tidak ada parameter author/worker di skema tool.
- Setiap tulis dalam satu transaksi. File yang sudah tertulis dihapus bila transaksi gagal.
- `idempotencyKey` disimpan di `mcp_idempotency` dalam transaksi yang sama; gagal = kunci tidak terpakai. Key dipisah per user dan terikat ke satu tool.
- Server memvalidasi ulang semua input. Konfirmasi worker oleh klien AI diminta lewat `instructions` server dan deskripsi tool, tetapi tidak dipaksakan server.

## 3. File berubah

Baru:
- `server/services/ticketing/` (`common`, `permissions`, `idempotency`, `activities`, `discussion`, `assignment`, `workflow`, `attachments`, `queries`, `mcp-auth`)
- `server/mcp/server.ts`, `server/routes/mcp.ts`, `scripts/mcp-token.ts`
- `drizzle/0001_mcp_tokens.sql` (+ meta), tabel `mcp_tokens`, `mcp_idempotency`
- `server/__tests__/mcp/` (`global-setup`, `env`, `helpers`, `mcp.integration.test.ts`)

Diubah:
- Handler web, sekarang memanggil service: `worklogs`, `worklogs/custom`, `status`, `stages/complete`, `assignee`, `members/index`, `members/[userId]`, `comments`, `internal-notes`, `reopen`
- Guard role: `attachments` (POST), `tickets/[id]` (PUT IT, DELETE `SYSTEM_ADMIN`)
- `server/utils/{ticket-lifecycle,upload,notifications}.ts`, `server/database/schema.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`, `package.json` (`@modelcontextprotocol/sdk`, `h3`)

## 4. Logika yang dipakai ulang

`getTicketById` (bentuk data identik dengan UI), `VALID_TRANSITIONS`/`isValidTransition`/`getTargetStatus`, serializer, `CommentSchema`/`NoteSchema`, `createNotification`, `fileStorage`, `sanitizeFilename`. Handler web dan MCP memanggil fungsi service yang sama.

## 5. Hasil test

- `npx vitest run server/__tests__`: 7 file, 87 test lulus (termasuk 16 test `lifecycle` yang sudah ada dan 26 test MCP).
- Test MCP hanya jalan di `DATABASE_URL_TEST`. `global-setup.ts` menolak jalan bila variabel kosong, sama dengan `DATABASE_URL`, atau nama DB tidak memuat "test". Skema direset dan dimigrasi tiap run.
- Smoke test HTTP nyata (`nuxt dev` + curl): tanpa token 401, GET 405, `initialize`, `tools/list` (20 tool), `tools/call` berhasil. `/api/*` tetap 401 tanpa login.
- `nuxt typecheck`: tidak ada error di file baru/diubah.

## 6. Tidak diekspos

| Fitur | Alasan |
|---|---|
| Hapus tiket | Destruktif; UI tidak punya tombol; hanya `SYSTEM_ADMIN` via web |
| Buat tiket | Bukan aksi worker; milik alur pemohon |
| Recall | UI tidak punya tombol; perilaku sekarang berbeda dari PRD Rule 10-12. Perlu keputusan produk dulu |
| Hapus member | Tidak ada di alur worker UI; tetap endpoint web khusus IT |
| Edit field tiket (`PUT`) | UI tidak punya tombol edit |
| Master data (kategori, vendor, user, company) dan laporan | Fungsi admin, bukan aktivitas worker |

## 7. Konfigurasi klien MCP

Buat token (tampil sekali, hanya hash disimpan):

```
npx tsx -r dotenv/config scripts/mcp-token.ts create <userId> "nama klien"
npx tsx -r dotenv/config scripts/mcp-token.ts list
npx tsx -r dotenv/config scripts/mcp-token.ts revoke <tokenId>
```

OpenCode (`opencode.json`):

```json
{
  "mcp": {
    "it-ticketing": {
      "type": "remote",
      "url": "https://<host>/mcp",
      "headers": { "Authorization": "Bearer itk_..." }
    }
  }
}
```

Claude Code:

```
claude mcp add --transport http it-ticketing https://<host>/mcp --header "Authorization: Bearer itk_..."
```

## 8. Risiko dan sisa pekerjaan

- Perubahan perilaku web (lebih ketat): `USER_NON_IT` kini 403 pada `PATCH /assignee`, `/status`, `/stages/complete`, `PUT` tiket, POST lampiran. `DELETE` tiket hanya `SYSTEM_ADMIN`. Assignment/member terkunci saat SELESAI.
- `IT_WORKER` boleh bertindak pada tiket mana pun, bukan hanya yang ditugaskan. Perlu keputusan bila ingin dibatasi ke assignee/member.
- Konfirmasi worker bergantung pada klien AI; server tidak bisa memaksa.
- Lampiran lewat base64 (batas 50 MB per file) memakan memori dan konteks klien.
- Token tidak punya masa berlaku; hanya bisa dicabut. Belum ada rate limit.
- ID memakai `Date.now()` + acak 4 karakter (skema lama); tabrakan sangat kecil tapi mungkin.
- `GET /api/tickets/:id` (web) belum menyaring lampiran `INTERNAL_ONLY` per role. MCP sudah menyaring.
- Migrasi `0001_mcp_tokens` harus dijalankan di produksi sebelum deploy.
- Belum diuji manual di UI: alur kanban, "Ambil Tiket", `CreateTicketView` (member), `DailyWorkView` setelah handler diubah.
