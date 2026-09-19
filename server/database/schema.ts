import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  json,
  int,
  index,
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
});

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const subcategories = mysqlTable('subcategories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  categoryId: varchar('category_id', { length: 50 }).notNull().references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
}, (table) => ({
  idxCategory: index('idx_subcategory_category').on(table.categoryId),
}));

export const vendors = mysqlTable('vendors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 500 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
});

export const technicians = mysqlTable('technicians', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  specialty: varchar('specialty', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
});

export const tickets = mysqlTable('tickets', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }).notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),

  createdBy: varchar('created_by', { length: 50 }).notNull(),
  createdByName: varchar('created_by_name', { length: 255 }).notNull(),
  createdByDept: varchar('created_by_dept', { length: 255 }).notNull(),
  createdByAdminId: varchar('created_by_admin_id', { length: 50 }),
  createdByAdminName: varchar('created_by_admin_name', { length: 255 }),

  requestedBy: varchar('requested_by', { length: 50 }).notNull(),
  requestedByName: varchar('requested_by_name', { length: 255 }).notNull(),
  requestedByDept: varchar('requested_by_dept', { length: 255 }).notNull(),

  primaryWorkerId: varchar('primary_worker_id', { length: 50 }),
  primaryWorkerName: varchar('primary_worker_name', { length: 255 }),
  assignedTo: varchar('assigned_to', { length: 50 }),
  assignedToName: varchar('assigned_to_name', { length: 255 }),

  supportingMembers: json('supporting_members').$type<string[]>(),
  supportingMemberDetails: json('supporting_member_details').$type<{ id: string; name: string }[]>(),

  delegationType: varchar('delegation_type', { length: 50 }),
  vendorId: varchar('vendor_id', { length: 50 }),
  vendorName: varchar('vendor_name', { length: 255 }),
  technicianId: varchar('technician_id', { length: 50 }),
  technicianName: varchar('technician_name', { length: 255 }),
  referenceNo: varchar('reference_no', { length: 100 }),
  delegationNotes: text('delegation_notes'),
  delegatedAt: timestamp('delegated_at', { mode: 'string' }),
  returnedAt: timestamp('returned_at', { mode: 'string' }),
  returnedNotes: text('returned_notes'),

  referencedTicketId: varchar('referenced_ticket_id', { length: 50 }),

  worklogs: json('worklogs').$type<any[]>(),
  comments: json('comments').$type<any[]>(),
  internalNotes: json('internal_notes').$type<any[]>(),
  auditLogs: json('audit_logs').$type<any[]>(),
  attachments: json('attachments').$type<any[]>(),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  ticketNumber: varchar('ticket_number', { length: 50 }),
  issuedAt: timestamp('issued_at', { mode: 'string' }),
  processStartedAt: timestamp('process_started_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  resolutionSummary: text('resolution_summary'),
  confirmedByUser: int('confirmed_by_user', { unsigned: true }).default(0),
}, (table) => ({
  idxStatus: index('idx_tickets_status').on(table.status),
  idxCreatedBy: index('idx_tickets_created_by').on(table.createdBy),
  idxCreatedAt: index('idx_tickets_created_at').on(table.createdAt),
}));

export const userPreferences = mysqlTable('user_preferences', {
  userId: varchar('user_id', { length: 50 }).primaryKey().references(() => users.id),
  darkMode: int('dark_mode', { unsigned: true }).default(0),
});
