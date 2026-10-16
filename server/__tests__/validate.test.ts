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
    it('accepts valid ticket', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        aplikasiProject: 'Printer',
        submodule: 'Inkjet Lantai 2',
        location: 'L1',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid ticket without submodule and location for IT Programmer', () => {
      const payload = {
        title: 'Programmer Request',
        description: 'Need new feature',
        category: 'IT Programmer',
        aplikasiProject: 'Development Sistem Baru',
        priority: 'MEDIUM',
        submodule: null,
        location: null,
      };
      const result = validate(CreateTicketSchema, payload);
      if (!result.success) console.log('DEBUG VALIDATE ERROR:', result.error);
      expect(result.success).toBe(true);
    });

    it('accepts valid ticket with empty location for IT Programmer', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Programmer Request',
        description: 'Need new feature',
        category: 'IT Programmer',
        aplikasiProject: 'Development Sistem Baru',
        priority: 'MEDIUM',
        location: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing location for Support IT', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        aplikasiProject: 'Printer',
        submodule: 'Inkjet Lantai 2',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Lokasi wajib diisi');
    });

    it('rejects empty location for Support IT', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        aplikasiProject: 'Printer',
        submodule: 'Inkjet Lantai 2',
        location: '',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Lokasi wajib diisi');
    });

    it('rejects missing aplikasiProject', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        location: 'L1',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing title', () => {
      const result = validate(CreateTicketSchema, {
        description: 'Desc',
        category: 'Support IT',
        aplikasiProject: 'Printer',
        submodule: 'Inkjet Lantai 2',
        location: 'L1',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Invalid',
        aplikasiProject: 'Printer',
        location: 'L1',
        priority: 'MEDIUM',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid priority', () => {
      const result = validate(CreateTicketSchema, {
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        aplikasiProject: 'Printer',
        submodule: 'Inkjet Lantai 2',
        location: 'L1',
        priority: 'URGENT',
      });
      expect(result.success).toBe(false);
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
