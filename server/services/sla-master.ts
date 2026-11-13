import { count, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '~/server/database/client';
import { slaSettings, slaTargets } from '~/server/database/schema';
import { DEFAULT_SLA_SETTINGS, DEFAULT_SLA_TARGETS, SLA_KEYS, type SlaMaster, type SlaSettings, type SlaTarget } from '~/utils/slaCalc';
import { parse } from './ticketing/common';

// Benih nilai awal (sheet "SLA Configuration"), hanya saat kedua tabel masih kosong; tidak menimpa perubahan admin.
export async function seedSlaMaster() {
  const [[t], [s]] = await Promise.all([db.select({ n: count() }).from(slaTargets), db.select({ n: count() }).from(slaSettings)]);
  if (!t?.n) {
    await db.insert(slaTargets).values(DEFAULT_SLA_TARGETS.map(x => ({
      priorityId: x.priority_id, responseHours: x.response_hours, resolutionHours: x.resolution_hours, coverage: x.coverage,
    }))).onDuplicateKeyUpdate({ set: { priorityId: sql`priority_id` } });
  }
  if (!s?.n) {
    await db.insert(slaSettings).values(Object.entries(DEFAULT_SLA_SETTINGS).map(([key, value]) => ({ key, value })))
      .onDuplicateKeyUpdate({ set: { key: sql`\`key\`` } });
  }
}

// Cache memori singkat; saveSlaMaster membersihkannya seketika.
let cache: { at: number; value: SlaMaster } | null = null;
let seeded = false;

export async function getSlaMaster(): Promise<SlaMaster> {
  if (cache && Date.now() - cache.at < 5000) return cache.value;
  if (!seeded) { await seedSlaMaster(); seeded = true; }
  const [targets, settings] = await Promise.all([db.select().from(slaTargets), db.select().from(slaSettings)]);
  const kv = Object.fromEntries(settings.map(r => [r.key, r.value]));
  const value: SlaMaster = {
    targets: SLA_KEYS.map(k => targets.find(x => x.priorityId === k)).filter((x): x is NonNullable<typeof x> => !!x).map(x => ({
      priority_id: x.priorityId, response_hours: x.responseHours, resolution_hours: x.resolutionHours, coverage: x.coverage as SlaTarget['coverage'],
    })),
    // Nilai yang hilang dari tabel jatuh ke bawaan agar hitungan SLA tidak pernah NaN.
    settings: {
      work_hours_per_day: kv.work_hours_per_day ?? DEFAULT_SLA_SETTINGS.work_hours_per_day,
      work_day_start: kv.work_day_start ?? DEFAULT_SLA_SETTINGS.work_day_start,
      at_risk_threshold: kv.at_risk_threshold ?? DEFAULT_SLA_SETTINGS.at_risk_threshold,
    },
  };
  cache = { at: Date.now(), value };
  return value;
}

const Hours = z.number().positive('Jam harus lebih dari 0').max(10000);
const SaveSchema = z.object({
  targets: z.array(z.object({
    priority_id: z.enum(SLA_KEYS),
    response_hours: Hours,
    resolution_hours: Hours,
    coverage: z.enum(['ALWAYS', 'BUSINESS']),
  })).length(SLA_KEYS.length, 'Target harus lengkap: P1, P2, P3, P4, dan Default'),
  settings: z.object({
    work_hours_per_day: z.number().min(1).max(24),
    work_day_start: z.number().min(0).max(23.99),
    at_risk_threshold: z.number().gt(0).lte(1, 'Ambang risiko antara 1% dan 100%'),
  }),
}).superRefine((v, ctx) => {
  if (new Set(v.targets.map(t => t.priority_id)).size !== SLA_KEYS.length) ctx.addIssue({ code: 'custom', message: 'Prioritas target tidak boleh ganda', path: ['targets'] });
  if (v.settings.work_day_start + v.settings.work_hours_per_day > 24) ctx.addIssue({ code: 'custom', message: 'Jam mulai + jam kerja per hari tidak boleh melewati tengah malam', path: ['settings'] });
  for (const t of v.targets) if (t.response_hours > t.resolution_hours) ctx.addIssue({ code: 'custom', message: `${t.priority_id}: target respon tidak boleh lebih lama dari resolusi`, path: ['targets'] });
});

export async function saveSlaMaster(input: unknown): Promise<SlaMaster> {
  const v = parse(SaveSchema, input);
  await db.transaction(async (tx) => {
    for (const t of v.targets) {
      await tx.insert(slaTargets).values({ priorityId: t.priority_id, responseHours: t.response_hours, resolutionHours: t.resolution_hours, coverage: t.coverage })
        .onDuplicateKeyUpdate({ set: { responseHours: t.response_hours, resolutionHours: t.resolution_hours, coverage: t.coverage } });
    }
    for (const [key, value] of Object.entries(v.settings) as [keyof SlaSettings, number][]) {
      await tx.insert(slaSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    }
  });
  cache = null;
  return getSlaMaster();
}
