import { describe, it, expect } from 'vitest';
import { validate, CommentSchema, NoteSchema } from '../utils/validate';
import { serializeComment, serializeInternalNote } from '../utils/serialize';

describe('Diskusi Tiket (Komentar & Internal Note)', () => {
  describe('CommentSchema', () => {
    it('menerima pesan normal dan hasilnya sudah trim', () => {
      const result = validate(CommentSchema, { message: '  Printer belum bisa print  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.message).toBe('Printer belum bisa print');
    });

    it('menolak pesan kosong atau hanya spasi', () => {
      expect(validate(CommentSchema, { message: '' }).success).toBe(false);
      expect(validate(CommentSchema, { message: '   ' }).success).toBe(false);
      expect(validate(CommentSchema, {}).success).toBe(false);
    });

    it('menolak pesan lebih dari 2000 karakter', () => {
      expect(validate(CommentSchema, { message: 'x'.repeat(2001) }).success).toBe(false);
      expect(validate(CommentSchema, { message: 'x'.repeat(2000) }).success).toBe(true);
    });
  });

  describe('NoteSchema', () => {
    it('menolak catatan kosong dan menerima catatan normal', () => {
      expect(validate(NoteSchema, { note: ' ' }).success).toBe(false);
      const result = validate(NoteSchema, { note: '  Kemungkinan driver corrupt.  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.note).toBe('Kemungkinan driver corrupt.');
    });
  });

  describe('serializeComment', () => {
    it('memetakan baris drizzle (camelCase) ke bentuk frontend (snake_case)', () => {
      const out = serializeComment({
        id: 'CMT-1',
        ticketId: 'TCK-1',
        userId: 'USR-001',
        userName: 'Rina',
        userRole: 'USER_NON_IT',
        message: 'Halo',
        createdAt: '2026-10-19 10:00:00',
      });
      expect(out).toEqual({
        id: 'CMT-1',
        ticket_id: 'TCK-1',
        user_id: 'USR-001',
        user_name: 'Rina',
        user_role: 'USER_NON_IT',
        message: 'Halo',
        created_at: '2026-10-19 10:00:00',
      });
    });
  });

  describe('serializeInternalNote', () => {
    it('memetakan baris drizzle (camelCase) ke bentuk frontend (snake_case)', () => {
      const out = serializeInternalNote({
        id: 'NOTE-1',
        ticketId: 'TCK-1',
        authorId: 'IT-001',
        authorName: 'Budi',
        note: 'Driver corrupt',
        createdAt: '2026-10-19 10:00:00',
      });
      expect(out).toEqual({
        id: 'NOTE-1',
        ticket_id: 'TCK-1',
        author_id: 'IT-001',
        author_name: 'Budi',
        note: 'Driver corrupt',
        created_at: '2026-10-19 10:00:00',
      });
    });
  });
});
