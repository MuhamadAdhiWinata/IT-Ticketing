import { describe, it, expect } from 'vitest';
import { priorityFromMatrix, priorityToP, needsDutyConfirm, deriveStatusLabel, derivePhase, deriveOutcome } from '../../utils/ticketSpec';

describe('ticketSpec', () => {
  it('matrix maps impact x urgency to P1-P4', () => {
    expect(priorityFromMatrix('LUAS', 'TINGGI')).toBe('P1');
    expect(priorityFromMatrix('SEDANG', 'SEDANG')).toBe('P3');
    expect(priorityFromMatrix('TERBATAS', 'RENDAH')).toBe('P4');
    expect(priorityFromMatrix(null, 'TINGGI')).toBeNull();
  });
  it('priority <-> P level', () => {
    expect(priorityToP('CRITICAL')).toBe('P1');
    expect(priorityToP('LOW')).toBe('P4');
  });
  it('duty confirm needed only for Insiden P1/P2', () => {
    expect(needsDutyConfirm('INSIDEN', 'CRITICAL')).toBe(true);
    expect(needsDutyConfirm('INSIDEN', 'HIGH')).toBe(true);
    expect(needsDutyConfirm('INSIDEN', 'MEDIUM')).toBe(false);
    expect(needsDutyConfirm('PL_DATA', 'CRITICAL')).toBe(false);
  });
  it('derives status label', () => {
    expect(deriveStatusLabel({ status: 'DRAFT' })).toBe('Baru');
    expect(deriveStatusLabel({ status: 'DRAFT', acknowledgedAt: 'x' })).toBe('Diakui');
    expect(deriveStatusLabel({ status: 'DRAFT', acknowledgedAt: 'x', triagedAt: 'y' })).toBe('Ditriase');
    expect(deriveStatusLabel({ status: 'PROCESS' })).toBe('Dikerjakan');
    expect(deriveStatusLabel({ status: 'PROCESS', waitingStartedAt: 'x' })).toBe('Menunggu Pemohon');
    expect(deriveStatusLabel({ status: 'PROCESS', waitingStartedAt: 'x', waitingEndedAt: 'y' })).toBe('Dikerjakan');
    expect(deriveStatusLabel({ status: 'SELESAI' })).toBe('Selesai');
    expect(deriveStatusLabel({ status: 'SELESAI', closedAt: 'x' })).toBe('Ditutup');
    expect(deriveStatusLabel({ status: 'SELESAI', transferTarget: 'DUPLIKAT' })).toBe('Dialihkan');
  });
  it('fase akhir tunggal dengan tiga hasil', () => {
    expect(derivePhase({ status: 'SELESAI' })).toBe('Selesai');
    expect(derivePhase({ status: 'SELESAI', closedAt: 'x' })).toBe('Selesai');
    expect(derivePhase({ status: 'SELESAI', transferTarget: 'DUPLIKAT' })).toBe('Selesai');
    expect(deriveOutcome({ status: 'SELESAI' })).toBe('Selesai');
    expect(deriveOutcome({ status: 'SELESAI', closedAt: 'x' })).toBe('Ditutup');
    expect(deriveOutcome({ status: 'SELESAI', transferTarget: 'DUPLIKAT' })).toBe('Dialihkan');
    expect(deriveOutcome({ status: 'PROCESS' })).toBeNull();
  });
});
