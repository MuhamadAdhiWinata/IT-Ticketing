import { describe, it, expect } from 'vitest';
import { validate, LoginSchema, CreateTicketSchema, StatusUpdateSchema, CompleteStageSchema } from '../utils/validate';

describe('Validation', () => {
  describe('LoginSchema', () => {
    it('accepts valid login', () => {
      const result = validate(LoginSchema, { email: 'test@company.co.id', password: 'pass' });
      expect(result.success).toBe(true);
    });

    it('rejects missing email', () => {
      const result = validate(LoginSchema, { password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = validate(LoginSchema, { email: 'not-email', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = validate(LoginSchema, { email: 'test@company.co.id', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateTicketSchema', () => {
    const base = {
      title: 'Test',
      description: 'Terjadi error',
      expected_behavior: 'Seharusnya normal',
      category: 'IT Programmer',
      project_kendala: 'Aplikasi A',
      priority: 'MEDIUM',
      since_at: '2026-11-06T09:00',
      affected_scope: 'SATU_PENGGUNA',
      work_status: 'DAPAT_MENUNGGU',
      evidence_steps: '1. buka halaman',
    };
    const err = (o: object) => {
      const r = validate(CreateTicketSchema, { ...base, ...o });
      return r.success ? null : r.error;
    };

    it('accepts valid ticket', () => expect(err({})).toBeNull());
    it('accepts Support IT with location', () => expect(err({ category: 'Support IT', location: 'L1' })).toBeNull());
    it('rejects missing location for Support IT', () => expect(err({ category: 'Support IT' })).toContain('Lokasi wajib diisi'));
    it('rejects empty location for Support IT', () => expect(err({ category: 'Support IT', location: '' })).toContain('Lokasi wajib diisi'));
    it('rejects missing project_kendala', () => expect(err({ project_kendala: '' })).not.toBeNull());
    it('rejects missing title', () => expect(err({ title: '' })).not.toBeNull());
    it('rejects title over 120 chars', () => expect(err({ title: 'x'.repeat(121) })).toContain('120'));
    it('accepts title of 120 chars', () => expect(err({ title: 'x'.repeat(120) })).toBeNull());
    it('rejects invalid category', () => expect(err({ category: 'Invalid' })).not.toBeNull());
    it('rejects invalid priority', () => expect(err({ priority: 'URGENT' })).not.toBeNull());
    it('requires expected_behavior', () => expect(err({ expected_behavior: '' })).not.toBeNull());
    it('requires since_at and affected_scope', () => {
      expect(err({ since_at: '' })).not.toBeNull();
      expect(err({ affected_scope: 'X' })).not.toBeNull();
      expect(err({ work_status: undefined })).not.toBeNull();
    });
    it('requires workaround only for TERGANGGU', () => {
      expect(err({ work_status: 'TERGANGGU' })).toContain('Cara lain');
      expect(err({ work_status: 'TERGANGGU', workaround: 'pakai Excel' })).toBeNull();
      expect(err({ work_status: 'BERHENTI_TOTAL' })).toBeNull();
    });
    it('requires evidence: file count or steps', () => {
      expect(err({ evidence_steps: '' })).toContain('Bukti wajib');
      expect(err({ evidence_steps: '', attachmentCount: 1 })).toBeNull();
    });
  });

  describe('StatusUpdateSchema', () => {
    it('accepts valid status', () => {
      const result = validate(StatusUpdateSchema, { status: 'PROCESS' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = validate(StatusUpdateSchema, { status: 'CLOSED' });
      expect(result.success).toBe(false);
    });
  });

  describe('CompleteStageSchema', () => {
    it('accepts valid stage completion', () => {
      const result = validate(CompleteStageSchema, {
        stageKey: 'START_WORK',
        notes: 'Starting work',
        targetStatus: 'PROCESS',
      });
      expect(result.success).toBe(true);
    });

    it('accepts delegation', () => {
      const result = validate(CompleteStageSchema, {
        stageKey: 'IN_PROGRESS',
        notes: 'Delegating',
        targetStatus: 'DELEGASI',
        delegation: {
          type: 'DELEGASI_VENDOR',
          vendor_name: 'PT Test',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid stageKey', () => {
      const result = validate(CompleteStageSchema, {
        stageKey: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });
});
