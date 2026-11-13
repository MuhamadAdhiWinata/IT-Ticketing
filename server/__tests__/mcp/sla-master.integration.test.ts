import { afterAll, describe, expect, it } from 'vitest';
import { getSlaMaster, saveSlaMaster } from '~/server/services/sla-master';
import { DEFAULT_SLA_SETTINGS, DEFAULT_SLA_TARGETS } from '~/utils/slaCalc';
import { closeAll } from './helpers';

afterAll(async () => {
  await saveSlaMaster({ targets: DEFAULT_SLA_TARGETS, settings: DEFAULT_SLA_SETTINGS });
  await closeAll();
});

describe('master SLA', () => {
  it('benih nilai awal sama dengan sheet SLA Configuration', async () => {
    const m = await getSlaMaster();
    expect(m.targets.map(t => t.priority_id)).toEqual(['P1', 'P2', 'P3', 'P4', 'DEFAULT']);
    expect(m.targets[0]).toMatchObject({ response_hours: 0.5, resolution_hours: 24, coverage: 'ALWAYS' });
    expect(m.targets[4]).toMatchObject({ response_hours: 8, resolution_hours: 120, coverage: 'BUSINESS' });
    expect(m.settings).toEqual({ work_hours_per_day: 9, work_day_start: 8, at_risk_threshold: 0.8 });
  });

  it('validasi: target kurang, respon > resolusi, ambang > 100%, jam lewat tengah malam', async () => {
    const ok = { targets: DEFAULT_SLA_TARGETS, settings: DEFAULT_SLA_SETTINGS };
    await expect(saveSlaMaster({ ...ok, targets: ok.targets.slice(0, 4) })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveSlaMaster({ ...ok, targets: ok.targets.map(t => t.priority_id === 'P2' ? { ...t, response_hours: 99 } : t) })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveSlaMaster({ ...ok, settings: { ...ok.settings, at_risk_threshold: 1.5 } })).rejects.toMatchObject({ statusCode: 400 });
    await expect(saveSlaMaster({ ...ok, settings: { ...ok.settings, work_day_start: 20 } })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('simpan mengubah nilai dan langsung terbaca', async () => {
    const targets = DEFAULT_SLA_TARGETS.map(t => t.priority_id === 'P3' ? { ...t, response_hours: 3, coverage: 'ALWAYS' as const } : t);
    await saveSlaMaster({ targets, settings: { ...DEFAULT_SLA_SETTINGS, at_risk_threshold: 0.7 } });
    const m = await getSlaMaster();
    expect(m.targets.find(t => t.priority_id === 'P3')).toMatchObject({ response_hours: 3, coverage: 'ALWAYS' });
    expect(m.settings.at_risk_threshold).toBe(0.7);
  });
});
