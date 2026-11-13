import { count, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~/server/database/client';
import { impacts, urgencies, priorityLevels, priorityMatrix, tickets } from '~/server/database/schema';
import { DEFAULT_MATRIX, IMPACTS, PLEVELS, PRIORITY_LEVELS, URGENCIES } from '~/utils/ticketSpec';
import { fail, parse } from './ticketing/common';

export interface MasterItem { id: string; label: string; is_active: boolean }
export interface TriageMaster {
  impacts: MasterItem[];
  urgencies: MasterItem[];
  priorities: { id: string; label: string; description: string | null }[];
  matrix: Record<string, Record<string, string>>; // matrix[impactId][urgencyId] = 'P1'..'P4'
}

// Benih nilai awal, hanya saat semua tabel master masih kosong (tidak menimpa perubahan admin).
export async function seedTriageMaster() {
  const counts = await Promise.all([impacts, urgencies, priorityLevels].map(t => db.select({ n: count() }).from(t)));
  if (counts.some(([r]) => r?.n)) return;
  const noop = (col: any) => ({ set: { id: sql`${col}` } });
  await db.insert(impacts).values(IMPACTS.map((o, i) => ({ id: o.value, label: o.label, sortOrder: i + 1 }))).onDuplicateKeyUpdate(noop(impacts.id));
  await db.insert(urgencies).values(URGENCIES.map((o, i) => ({ id: o.value, label: o.label, sortOrder: i + 1 }))).onDuplicateKeyUpdate(noop(urgencies.id));
  await db.insert(priorityLevels).values(PRIORITY_LEVELS.map((p, i) => ({ ...p, sortOrder: i + 1 }))).onDuplicateKeyUpdate(noop(priorityLevels.id));
  const cells = Object.entries(DEFAULT_MATRIX).flatMap(([impactId, row]) => Object.entries(row).map(([urgencyId, priorityId]) => ({ impactId, urgencyId, priorityId })));
  await db.insert(priorityMatrix).values(cells).onDuplicateKeyUpdate({ set: { priorityId: sql`priority_id` } });
}

// Cache memori singkat; penulisan lewat saveTriageMaster membersihkannya seketika.
let cache: { at: number; value: TriageMaster } | null = null;
let seeded = false;

export async function getTriageMaster(): Promise<TriageMaster> {
  if (cache && Date.now() - cache.at < 5000) return cache.value;
  if (!seeded) { await seedTriageMaster(); seeded = true; }
  const [imp, urg, pri, mx] = await Promise.all([
    db.select().from(impacts).orderBy(impacts.sortOrder),
    db.select().from(urgencies).orderBy(urgencies.sortOrder),
    db.select().from(priorityLevels).orderBy(priorityLevels.sortOrder),
    db.select().from(priorityMatrix),
  ]);
  const item = (r: { id: string; label: string; isActive: number }): MasterItem => ({ id: r.id, label: r.label, is_active: !!r.isActive });
  const matrix: TriageMaster['matrix'] = {};
  for (const c of mx) (matrix[c.impactId] ??= {})[c.urgencyId] = c.priorityId;
  const value: TriageMaster = {
    impacts: imp.map(item),
    urgencies: urg.map(item),
    priorities: pri.map(p => ({ id: p.id, label: p.label, description: p.description })),
    matrix,
  };
  cache = { at: Date.now(), value };
  return value;
}

const Id = z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,19}$/, 'ID: huruf besar, angka, underscore (2-20 karakter)');
const Item = z.object({ id: Id, label: z.string().trim().min(1, 'Label wajib diisi').max(100), is_active: z.boolean().optional() });
const SaveSchema = z.object({
  impacts: z.array(Item).min(1, 'Minimal satu Dampak'),
  urgencies: z.array(Item).min(1, 'Minimal satu Urgensi'),
  priorities: z.array(z.object({
    id: z.enum(PLEVELS), label: z.string().trim().min(1, 'Label prioritas wajib diisi').max(100), description: z.string().trim().max(255).nullish(),
  })).length(4, 'Prioritas harus P1 sampai P4'),
  matrix: z.record(z.string(), z.record(z.string(), z.enum(PLEVELS).nullish())),
});

const dupes = (ids: string[]) => ids.find((id, i) => ids.indexOf(id) !== i);

// Simpan seluruh master sekaligus (satu transaksi). Dampak/Urgensi yang dihapus tetapi masih dipakai tiket ditolak.
export async function saveTriageMaster(input: unknown): Promise<TriageMaster> {
  const v = parse(SaveSchema, input);
  for (const [name, list] of [['Dampak', v.impacts], ['Urgensi', v.urgencies]] as const) {
    const d = dupes(list.map(x => x.id));
    if (d) fail(400, `${name}: ID ${d} dipakai dua kali`);
  }
  if (new Set(v.priorities.map(p => p.id)).size !== 4) fail(400, 'Prioritas harus P1 sampai P4, masing-masing satu');

  const impactIds = new Set(v.impacts.map(x => x.id));
  const urgencyIds = new Set(v.urgencies.map(x => x.id));
  const cells = Object.entries(v.matrix).flatMap(([impactId, row]) => Object.entries(row).map(([urgencyId, priorityId]) => ({ impactId, urgencyId, priorityId })))
    .filter((c): c is { impactId: string; urgencyId: string; priorityId: (typeof PLEVELS)[number] } => !!c.priorityId);
  for (const c of cells) {
    if (!impactIds.has(c.impactId) || !urgencyIds.has(c.urgencyId)) fail(400, `Matriks: ${c.impactId} x ${c.urgencyId} tidak ada di master`);
  }

  const old = await getTriageMaster();
  for (const [col, name, before, next] of [[tickets.impact, 'Dampak', old.impacts, impactIds], [tickets.urgency, 'Urgensi', old.urgencies, urgencyIds]] as const) {
    const removed = before.map(x => x.id).filter(id => !next.has(id));
    if (!removed.length) continue;
    const [used] = await db.select({ n: count() }).from(tickets).where(inArray(col, removed));
    if (used?.n) fail(409, `${name} ${removed.join(', ')} masih dipakai ${used.n} tiket; nonaktifkan saja, jangan dihapus`);
  }

  await db.transaction(async (tx) => {
    for (const t of [priorityMatrix, impacts, urgencies, priorityLevels]) await tx.delete(t);
    await tx.insert(impacts).values(v.impacts.map((x, i) => ({ id: x.id, label: x.label, sortOrder: i + 1, isActive: x.is_active === false ? 0 : 1 })));
    await tx.insert(urgencies).values(v.urgencies.map((x, i) => ({ id: x.id, label: x.label, sortOrder: i + 1, isActive: x.is_active === false ? 0 : 1 })));
    await tx.insert(priorityLevels).values(v.priorities.map((p, i) => ({ id: p.id, label: p.label, description: p.description || null, sortOrder: i + 1 })));
    if (cells.length) await tx.insert(priorityMatrix).values(cells);
  });
  cache = null;
  return getTriageMaster();
}
