import { describe, it, expect } from 'vitest';
import {
  serializeTicket,
  serializeWorklog,
  serializeAuditLog,
  serializeAttachment,
  serializeSubcategory,
  serializeTicketMember,
} from '../utils/serialize';

describe('Serializers', () => {
  describe('serializeTicket', () => {
    it('maps camelCase DB fields to snake_case frontend fields', () => {
      const dbTicket = {
        id: 'TCK-001',
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        subcategory: 'Printer',
        location: 'L1',
        priority: 'MEDIUM',
        status: 'PROCESS',
        createdBy: 'USR-001',
        createdByName: 'Rina',
        createdByDept: 'Finance',
        createdByAdminId: null,
        createdByAdminName: null,
        requestedBy: 'USR-001',
        requestedByName: 'Rina',
        requestedByDept: 'Finance',
        assignedTo: 'IT-001',
        assignedToName: 'Budi',
        members: [],
        delegationType: null,
        vendorId: null,
        vendorName: null,
        technicianId: null,
        technicianName: null,
        referenceNo: null,
        delegationNotes: null,
        delegatedAt: null,
        returnedAt: null,
        returnedNotes: null,
        referencedTicketId: null,
        attachments: [],
        worklogs: [],
        comments: [],
        internal_notes: [],
        auditLogs: [],
        createdAt: '2026-09-21 10:00:00',
        ticketNumber: 'TIKSP-123456',
        issuedAt: null,
        processStartedAt: null,
        completedAt: null,
        resolutionSummary: null,
        confirmedByUser: 0,
      };

      const result = serializeTicket(dbTicket);

      expect(result.id).toBe('TCK-001');
      expect(result.created_by).toBe('USR-001');
      expect(result.created_at).toBe('2026-09-21 10:00:00');
      expect(result.ticket_number).toBe('TIKSP-123456');
      expect(result.members).toEqual([]);
      expect(result).not.toHaveProperty('supporting_members');
      expect(result).not.toHaveProperty('audit_trail');
    });

    it('reconstructs delegation from flat columns', () => {
      const dbTicket = {
        id: 'TCK-002',
        title: 'Test',
        description: 'Desc',
        category: 'Support IT',
        subcategory: 'Printer',
        location: 'L1',
        priority: 'MEDIUM',
        status: 'DELEGASI',
        createdBy: 'USR-001',
        createdByName: 'Rina',
        createdByDept: 'Finance',
        createdByAdminId: null,
        createdByAdminName: null,
        requestedBy: 'USR-001',
        requestedByName: 'Rina',
        requestedByDept: 'Finance',
        assignedTo: 'IT-001',
        assignedToName: 'Budi',
        members: [],
        delegationType: 'DELEGASI_VENDOR',
        vendorId: 'VND-01',
        vendorName: 'PT Mitra',
        technicianId: null,
        technicianName: null,
        referenceNo: 'REF-001',
        delegationNotes: 'Test delegation',
        delegatedAt: '2026-09-21 10:00:00',
        returnedAt: null,
        returnedNotes: null,
        referencedTicketId: null,
        attachments: [],
        worklogs: [],
        auditLogs: [],
        createdAt: '2026-09-21 10:00:00',
        ticketNumber: 'TIKSP-123456',
        issuedAt: null,
        processStartedAt: null,
        completedAt: null,
      };

      const result = serializeTicket(dbTicket);
      expect(result.delegation).toEqual({
        type: 'DELEGASI_VENDOR',
        vendor_id: 'VND-01',
        vendor_name: 'PT Mitra',
        technician_id: null,
        technician_name: null,
        reference_no: 'REF-001',
        notes: 'Test delegation',
        delegated_at: '2026-09-21 10:00:00',
        returned_at: null,
        returned_notes: null,
      });
    });
  });

  describe('serializeSubcategory', () => {
    it('maps categoryId to category_id', () => {
      const result = serializeSubcategory({ id: 'SUB-001', categoryId: 'CAT-01', name: 'Printer' });
      expect(result).toEqual({ id: 'SUB-001', category_id: 'CAT-01', name: 'Printer' });
    });
  });

  describe('serializeWorklog', () => {
    it('maps all fields correctly', () => {
      const result = serializeWorklog({
        id: 'WL-001', ticketId: 'TCK-001', stageKey: 'IN_PROGRESS',
        workerId: 'IT-001', workerName: 'Budi', date: '2026-09-21',
        startAt: '09:00', finishAt: '10:00', durationMinutes: 60,
        description: 'Working', createdAt: '2026-09-21 10:00:00',
      });
      expect(result.worker_id).toBe('IT-001');
      expect(result.worker_name).toBe('Budi');
      expect(result.start_at).toBe('09:00');
      expect(result.duration_minutes).toBe(60);
    });
  });

  describe('serializeTicketMember', () => {
    it('maps fields correctly', () => {
      const result = serializeTicketMember({
        id: 'TM-001', ticketId: 'TCK-001', userId: 'IT-001', userName: 'Budi', createdAt: '2026-09-21',
      });
      expect(result.user_id).toBe('IT-001');
      expect(result.user_name).toBe('Budi');
      expect(result.created_at).toBe('2026-09-21');
    });
  });
});
