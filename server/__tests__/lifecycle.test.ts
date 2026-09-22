import { describe, it, expect } from 'vitest';
import { isValidTransition, getTargetStatus, EDITABLE_TICKET_FIELDS, WORKFLOW_CONTROLLED_FIELDS } from '../utils/ticket-lifecycle';

describe('Ticket Lifecycle', () => {
  describe('isValidTransition', () => {
    it('allows DRAFT -> PROCESS', () => {
      expect(isValidTransition('DRAFT', 'PROCESS')).toBe(true);
    });

    it('rejects DRAFT -> SELESAI', () => {
      expect(isValidTransition('DRAFT', 'SELESAI')).toBe(false);
    });

    it('allows PROCESS -> IN_PROGRESS', () => {
      expect(isValidTransition('PROCESS', 'IN_PROGRESS')).toBe(true);
    });

    it('allows PROCESS -> DELEGASI', () => {
      expect(isValidTransition('PROCESS', 'DELEGASI')).toBe(true);
    });

    it('allows PROCESS -> SELESAI (direct completion)', () => {
      expect(isValidTransition('PROCESS', 'SELESAI')).toBe(true);
    });

    it('allows IN_PROGRESS -> SELESAI', () => {
      expect(isValidTransition('IN_PROGRESS', 'SELESAI')).toBe(true);
    });

    it('allows IN_PROGRESS -> DELEGASI', () => {
      expect(isValidTransition('IN_PROGRESS', 'DELEGASI')).toBe(true);
    });

    it('allows DELEGASI -> PROCESS', () => {
      expect(isValidTransition('DELEGASI', 'PROCESS')).toBe(true);
    });

    it('allows SELESAI -> PROCESS (reopen)', () => {
      expect(isValidTransition('SELESAI', 'PROCESS')).toBe(true);
    });

    it('rejects SELESAI -> SELESAI', () => {
      expect(isValidTransition('SELESAI', 'SELESAI')).toBe(false);
    });
  });

  describe('getTargetStatus', () => {
    it('returns PROCESS for ASSIGN', () => {
      expect(getTargetStatus('ASSIGN')).toBe('PROCESS');
    });

    it('returns SELESAI for IN_PROGRESS', () => {
      expect(getTargetStatus('IN_PROGRESS')).toBe('SELESAI');
    });

    it('returns SELESAI for COMPLETION', () => {
      expect(getTargetStatus('COMPLETION')).toBe('SELESAI');
    });

    it('returns DELEGASI for DELEGATION', () => {
      expect(getTargetStatus('DELEGATION')).toBe('DELEGASI');
    });
  });

  describe('Field separation', () => {
    it('editable fields do not overlap with workflow fields', () => {
      const overlap = EDITABLE_TICKET_FIELDS.filter(f => WORKFLOW_CONTROLLED_FIELDS.includes(f));
      expect(overlap).toEqual([]);
    });
  });
});
