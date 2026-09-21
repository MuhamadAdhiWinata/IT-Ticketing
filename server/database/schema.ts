import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  json,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const categories = mysqlTable('categories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

export const subcategories = mysqlTable('subcategories', {
  id: varchar('id', { length: 50 }).primaryKey(),
  categoryId: varchar('category_id', { length: 50 }).notNull().references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
}, (table) => ({
  idxCategory: index('idx_subcategory_category').on(table.categoryId),
}));

export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
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

export const ticketsRelations = relations(tickets, ({ many }) => ({
  worklogs: many(worklogs),
  comments: many(comments),
  internalNotes: many(internalNotes),
  auditLogs: many(auditLogs),
  attachments: many(attachments),
}));

export const worklogs = mysqlTable('worklogs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  stageKey: varchar('stage_key', { length: 50 }).notNull(),
  workerId: varchar('worker_id', { length: 50 }).notNull(),
  workerName: varchar('worker_name', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  startAt: varchar('start_at', { length: 5 }).notNull(),
  finishAt: varchar('finish_at', { length: 5 }).notNull(),
  durationMinutes: int('duration_minutes', { unsigned: true }).default(0),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_worklogs_ticket').on(table.ticketId),
  idxWorker: index('idx_worklogs_worker').on(table.workerId),
  idxDate: index('idx_worklogs_date').on(table.date),
}));

export const worklogsRelations = relations(worklogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [worklogs.ticketId],
    references: [tickets.id],
  }),
}));

export const comments = mysqlTable('comments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  userId: varchar('user_id', { length: 50 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userRole: varchar('user_role', { length: 50 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_comments_ticket').on(table.ticketId),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
}));

export const internalNotes = mysqlTable('internal_notes', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  authorId: varchar('author_id', { length: 50 }).notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_notes_ticket').on(table.ticketId),
}));

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
  ticket: one(tickets, {
    fields: [internalNotes.ticketId],
    references: [tickets.id],
  }),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  action: varchar('action', { length: 255 }).notNull(),
  performedAt: timestamp('performed_at', { mode: 'string' }).notNull(),
  performedBy: varchar('performed_by', { length: 50 }).notNull(),
  performedByName: varchar('performed_by_name', { length: 255 }).notNull(),
  detail: text('detail'),
  notes: text('notes'),
}, (table) => ({
  idxTicket: index('idx_audit_ticket').on(table.ticketId),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [auditLogs.ticketId],
    references: [tickets.id],
  }),
}));

export const attachments = mysqlTable('attachments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  stage: varchar('stage', { length: 50 }).notNull(),
  visibility: varchar('visibility', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }),
  filePath: varchar('file_path', { length: 500 }),
  uploadedBy: varchar('uploaded_by', { length: 50 }).notNull(),
  uploadedByName: varchar('uploaded_by_name', { length: 255 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_attachments_ticket').on(table.ticketId),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
}));

export const userPreferences = mysqlTable('user_preferences', {
  userId: varchar('user_id', { length: 50 }).primaryKey().references(() => users.id),
  darkMode: int('dark_mode', { unsigned: true }).default(0),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

