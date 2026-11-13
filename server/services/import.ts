import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { db } from '~/server/database/client';
import { companies, divisions, users, categories, projectKendala, submodules, vendors, roles } from '~/server/database/schema';
import { parseCsv, toCsv } from '~/utils/csv';
import { IMPORT_LIST, type ImportKey } from '~/utils/importSpec';
import { ADMIN_ROLE } from '~/utils/permissions';
import { UNITS } from '~/utils/ticketSpec';
import { fail } from './ticketing/common';

// Import / ekspor master data dari CSV. Aturan: kunci baris = id (id baru dibuat, id lama diperbarui),
// semua-atau-tidak (satu baris salah = tidak ada yang tertulis), referensi induk dicocokkan lewat id atau nama.
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_ERRORS = 200;

export interface ImportResult {
  dataset: ImportKey;
  dryRun: boolean;
  applied: boolean;
  total: number;
  created: number;
  updated: number;
  errorCount: number;
  errors: { line: number; message: string }[];
  passwords: { id: string; email: string; password: string }[];
}

type Row = Record<string, string>;
interface Built { values: Record<string, unknown>; password?: string }
interface Named { id: string; name: string }

// ponytail: tabel drizzle diketik longgar (any) agar satu jalur tulis melayani 7 tabel; ceiling: validasi kolom ada di builder, bukan di tipe.
const TABLES: Record<ImportKey, any> = { companies, divisions, users, categories, projectKendala, submodules, vendors };

async function loadCtx() {
  const [co, dv, ca, pk, sm, vn, us, ro] = await Promise.all([
    db.select({ id: companies.id, name: companies.name }).from(companies),
    db.select({ id: divisions.id, name: divisions.name, companyId: divisions.companyId }).from(divisions),
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ id: projectKendala.id, name: projectKendala.name }).from(projectKendala),
    db.select({ id: submodules.id }).from(submodules),
    db.select({ id: vendors.id, name: vendors.name }).from(vendors),
    db.select({ id: users.id, email: users.email }).from(users),
    db.select({ id: roles.id }).from(roles),
  ]);
  return { co, dv, ca, pk, sm, vn, us, roleIds: new Set(ro.map(r => r.id)) };
}
type Ctx = Awaited<ReturnType<typeof loadCtx>>;

// Referensi induk: id persis dulu, lalu nama (tanpa beda huruf besar/kecil). Nama kembar = ambigu.
function pick<T extends Named>(list: T[], value: string, label: string, e: (m: string) => void): T | null {
  const byId = list.filter(x => x.id === value);
  const hits = byId.length ? byId : list.filter(x => x.name.toLowerCase() === value.toLowerCase());
  if (hits.length === 1) return hits[0]!;
  e(hits.length ? `${label} "${value}" ambigu (${hits.length} nama sama), pakai id` : `${label} "${value}" tidak ditemukan`);
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const YES = ['ya', 'y', 'yes', 'true', '1'];
const NO = ['tidak', 'tdk', 'n', 'no', 'false', '0', ''];

interface Spec {
  ids: (c: Ctx) => string[];
  // Kolom yang harus unik (selain id) dan daftar nilai yang sudah ada.
  unique?: { field: 'nama' | 'email'; existing: (c: Ctx) => { id: string; value: string }[] };
  build: (r: Row, c: Ctx, e: (m: string) => void, actorId: string | null) => Built | null;
}

const SPECS: Record<ImportKey, Spec> = {
  companies: {
    ids: c => c.co.map(x => x.id),
    unique: { field: 'nama', existing: c => c.co.map(x => ({ id: x.id, value: x.name })) },
    build: r => ({ values: { id: r.id, name: r.nama } }),
  },
  divisions: {
    ids: c => c.dv.map(x => x.id),
    build: (r, c, e) => {
      const co = pick(c.co, r.perusahaan!, 'Perusahaan', e);
      return co ? { values: { id: r.id, companyId: co.id, name: r.nama } } : null;
    },
  },
  users: {
    ids: c => c.us.map(x => x.id),
    unique: { field: 'email', existing: c => c.us.map(x => ({ id: x.id, value: x.email })) },
    build: (r, c, e, actorId) => {
      const email = r.email!.toLowerCase();
      if (!EMAIL.test(email)) e(`Email "${r.email}" tidak valid`);
      if (!c.roleIds.has(r.peran!)) e(`Peran "${r.peran}" tidak ada`);
      if (actorId && r.id === actorId && r.peran !== ADMIN_ROLE) e('Peran akun Anda sendiri tidak boleh diturunkan lewat import');
      const co = r.perusahaan ? pick(c.co, r.perusahaan, 'Perusahaan', e) : null;
      let dv: (typeof c.dv)[number] | null = null;
      if (r.divisi) {
        const pool = co ? c.dv.filter(d => d.companyId === co.id) : c.dv;
        dv = pick(pool, r.divisi, co ? `Divisi di ${co.name}` : 'Divisi', e);
      }
      const department = dv?.name ?? r.departemen ?? '';
      if (!department) e('departemen wajib diisi bila divisi kosong');
      let unit: string | null = null;
      if (r.unit) {
        unit = UNITS.find(u => u.toLowerCase() === r.unit!.toLowerCase()) ?? null;
        if (!unit) e(`Unit "${r.unit}" tidak dikenal (${UNITS.join(', ')})`);
      }
      const pic = (r.pic ?? '').toLowerCase();
      if (!YES.includes(pic) && !NO.includes(pic)) e(`pic "${r.pic}" harus YA atau TIDAK`);
      if (r.password && r.password.length < 8) e('password minimal 8 karakter');
      return {
        values: { id: r.id, name: r.nama, email, role: r.peran, department, companyId: co?.id ?? dv?.companyId ?? null, divisionId: dv?.id ?? null, unit, isPic: YES.includes(pic) ? 1 : 0 },
        password: r.password || undefined,
      };
    },
  },
  categories: {
    ids: c => c.ca.map(x => x.id),
    unique: { field: 'nama', existing: c => c.ca.map(x => ({ id: x.id, value: x.name })) },
    build: r => ({ values: { id: r.id, name: r.nama } }),
  },
  projectKendala: {
    ids: c => c.pk.map(x => x.id),
    build: (r, c, e) => {
      const ca = pick(c.ca, r.kategori!, 'Kategori', e);
      return ca ? { values: { id: r.id, categoryId: ca.id, name: r.nama } } : null;
    },
  },
  submodules: {
    ids: c => c.sm.map(x => x.id),
    build: (r, c, e) => {
      const pk = pick(c.pk, r.aplikasi!, 'Aplikasi/Kendala', e);
      return pk ? { values: { id: r.id, projectKendalaId: pk.id, name: r.nama } } : null;
    },
  },
  vendors: {
    ids: c => c.vn.map(x => x.id),
    unique: { field: 'nama', existing: c => c.vn.map(x => ({ id: x.id, value: x.name })) },
    build: (r, _c, e) => {
      if (r.email && !EMAIL.test(r.email)) e(`Email "${r.email}" tidak valid`);
      return { values: { id: r.id, name: r.nama, contactName: r.kontak || null, email: r.email || null, phone: r.telepon || null, address: r.alamat || null } };
    },
  },
};

export const datasetOf = (key: string) => {
  const d = IMPORT_LIST.find(x => x.key === key);
  if (!d) fail(400, `dataset: ${key} tidak dikenal (${IMPORT_LIST.map(x => x.key).join(', ')})`);
  return d;
};

export async function importDataset(
  key: string, csv: string, opts: { dryRun?: boolean; actorId?: string | null } = {},
): Promise<ImportResult> {
  const ds = datasetOf(key);
  const spec = SPECS[ds.key];
  if (Buffer.byteLength(csv) > MAX_BYTES) fail(400, 'File melebihi 2 MB');

  let table: string[][];
  try { table = parseCsv(csv); } catch (err: any) { fail(400, err.message); }
  if (table.length < 2) fail(400, 'File kosong: butuh baris header dan minimal satu baris data');
  if (table.length - 1 > MAX_ROWS) fail(400, `Maksimal ${MAX_ROWS} baris per import`);

  // Header dicocokkan tanpa beda huruf besar/kecil; kolom yang tidak dikenal diabaikan.
  const header = table[0]!.map(h => h.trim().toLowerCase());
  const missing = ds.columns.filter(c => c.required && !header.includes(c.name));
  if (missing.length) fail(400, `Kolom wajib tidak ada di header: ${missing.map(c => c.name).join(', ')}. Unduh template untuk format yang benar.`);

  const ctx = await loadCtx();
  const existingIds = new Set(spec.ids(ctx));
  const owners = new Map((spec.unique?.existing(ctx) ?? []).map(x => [x.value.toLowerCase(), x.id]));

  const errors: ImportResult['errors'] = [];
  let errorCount = 0;
  const seenIds = new Set<string>();
  const built: { b: Built; isNew: boolean }[] = [];

  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    let bad = false;
    const e = (message: string) => { bad = true; errorCount++; if (errors.length < MAX_ERRORS) errors.push({ line, message }); };
    const r: Row = {};
    header.forEach((h, ci) => { r[h] = (cells[ci] ?? '').trim(); });

    for (const c of ds.columns) if (c.required && !r[c.name]) e(`kolom ${c.name} wajib diisi`);
    if (r.id) {
      if (r.id.length > 50) e('id maksimal 50 karakter');
      if (seenIds.has(r.id)) e(`id "${r.id}" muncul dua kali di file`);
    }
    if (bad) return;
    seenIds.add(r.id!);

    const uniq = spec.unique;
    if (uniq) {
      const v = (uniq.field === 'email' ? r.email! : r.nama!).toLowerCase();
      const owner = owners.get(v);
      if (owner && owner !== r.id) e(`${uniq.field} "${r[uniq.field]}" sudah dipakai ${owner}`);
      else owners.set(v, r.id!);
    }
    const out = spec.build(r, ctx, e, opts.actorId ?? null);
    if (!bad && out) built.push({ b: out, isNew: !existingIds.has(r.id!) });
  });

  const created = built.filter(x => x.isNew).length;
  const result: ImportResult = {
    dataset: ds.key, dryRun: !!opts.dryRun, applied: false, total: table.length - 1,
    created, updated: built.length - created, errorCount, errors, passwords: [],
  };
  if (errorCount || opts.dryRun) return result;

  // Password dihitung di luar transaksi (bcrypt lambat). Akun baru tanpa password diberi password acak, ditampilkan sekali.
  const prepared = await Promise.all(built.map(async ({ b, isNew }) => {
    if (ds.key !== 'users') return { b, isNew, hash: undefined as string | undefined };
    const plain = b.password ?? (isNew ? randomBytes(9).toString('base64url') : undefined);
    if (plain && isNew && !b.password) result.passwords.push({ id: String(b.values.id), email: String(b.values.email), password: plain });
    return { b, isNew, hash: plain ? await bcrypt.hash(plain, 10) : undefined };
  }));

  const t = TABLES[ds.key];
  await db.transaction(async (tx) => {
    for (const { b, isNew, hash } of prepared) {
      const values = hash ? { ...b.values, passwordHash: hash } : b.values;
      if (isNew) await tx.insert(t).values(values);
      else {
        const { id, ...rest } = values;
        await tx.update(t).set(rest).where(eq(t.id, id));
      }
    }
  });
  result.applied = true;
  return result;
}

// Template: header + satu baris contoh. Petunjuk tiap kolom ditampilkan di UI.
export function templateCsv(key: string): string {
  const ds = datasetOf(key);
  return toCsv(ds.columns.map(c => c.name), [ds.example]);
}

// Ekspor data saat ini dalam format yang sama dengan template (referensi memakai id), jadi bisa diedit lalu diimpor ulang.
export async function exportCsv(key: string): Promise<string> {
  const ds = datasetOf(key);
  const cols = ds.columns.map(c => c.name);
  let rows: (string | number | null)[][] = [];
  if (ds.key === 'companies') rows = (await db.select().from(companies).orderBy(companies.id)).map(x => [x.id, x.name]);
  if (ds.key === 'divisions') rows = (await db.select().from(divisions).orderBy(divisions.id)).map(x => [x.id, x.companyId, x.name]);
  if (ds.key === 'users') {
    rows = (await db.select().from(users).orderBy(users.id)).map(x => [x.id, x.name, x.email, x.role, x.companyId, x.divisionId, x.department, x.unit, x.isPic ? 'YA' : 'TIDAK', '']);
  }
  if (ds.key === 'categories') rows = (await db.select().from(categories).orderBy(categories.id)).map(x => [x.id, x.name]);
  if (ds.key === 'projectKendala') rows = (await db.select().from(projectKendala).orderBy(projectKendala.id)).map(x => [x.id, x.categoryId, x.name]);
  if (ds.key === 'submodules') rows = (await db.select().from(submodules).orderBy(submodules.id)).map(x => [x.id, x.projectKendalaId, x.name]);
  if (ds.key === 'vendors') rows = (await db.select().from(vendors).orderBy(vendors.id)).map(x => [x.id, x.name, x.contactName, x.email, x.phone, x.address]);
  return toCsv(cols, rows);
}
