import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  json,
  index,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ── Users ──
export const users = mysqlTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 50 }).notNull(),
  department: varchar('department', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
});

export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  memberships: many(ticketMembers),
}));

// ── Categories & Subcategories ──
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

// ── Tickets ──
export const tickets = mysqlTable('tickets', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }).notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),

  // Creator
  createdBy: varchar('created_by', { length: 50 }).notNull().references(() => users.id),
  createdByDept: varchar('created_by_dept', { length: 255 }).notNull(),
  createdByAdminId: varchar('created_by_admin_id', { length: 50 }),

  // Requester
  requestedBy: varchar('requested_by', { length: 50 }).notNull().references(() => users.id),
  requestedByDept: varchar('requested_by_dept', { length: 255 }).notNull(),

  // Assignee (main worker)
  assignedTo: varchar('assigned_to', { length: 50 }).references(() => users.id),

  // Delegation
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

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  ticketNumber: varchar('ticket_number', { length: 50 }),
  issuedAt: timestamp('issued_at', { mode: 'string' }),
  processStartedAt: timestamp('process_started_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
}, (table) => ({
  idxStatus: index('idx_tickets_status').on(table.status),
  idxCreatedBy: index('idx_tickets_created_by').on(table.createdBy),
  idxAssignedTo: index('idx_tickets_assigned_to').on(table.assignedTo),
  idxCreatedAt: index('idx_tickets_created_at').on(table.createdAt),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, { fields: [tickets.createdBy], references: [users.id] }),
  requester: one(users, { fields: [tickets.requestedBy], references: [users.id] }),
  assignee: one(users, { fields: [tickets.assignedTo], references: [users.id] }),
  worklogs: many(worklogs),
  attachments: many(attachments),
  auditLogs: many(auditLogs),
  members: many(ticketMembers),
}));

// ── Ticket Members (workers per ticket) ──
export const ticketMembers = mysqlTable('ticket_members', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  userId: varchar('user_id', { length: 50 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_tm_ticket').on(table.ticketId),
  idxUser: index('idx_tm_user').on(table.userId),
}));

export const ticketMembersRelations = relations(ticketMembers, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMembers.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketMembers.userId], references: [users.id] }),
}));

// ── Worklogs ──
export const worklogs = mysqlTable('worklogs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  stageKey: varchar('stage_key', { length: 50 }).notNull(),
  workerId: varchar('worker_id', { length: 50 }).notNull().references(() => users.id),
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
  ticket: one(tickets, { fields: [worklogs.ticketId], references: [tickets.id] }),
  worker: one(users, { fields: [worklogs.workerId], references: [users.id] }),
}));

// ── Audit Logs ──
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  action: varchar('action', { length: 255 }).notNull(),
  performedAt: timestamp('performed_at', { mode: 'string' }).notNull(),
  performedBy: varchar('performed_by', { length: 50 }).notNull().references(() => users.id),
  detail: text('detail'),
  notes: text('notes'),
}, (table) => ({
  idxTicket: index('idx_audit_ticket').on(table.ticketId),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  ticket: one(tickets, { fields: [auditLogs.ticketId], references: [tickets.id] }),
  actor: one(users, { fields: [auditLogs.performedBy], references: [users.id] }),
}));

// ── Attachments ──
export const attachments = mysqlTable('attachments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().references(() => tickets.id),
  stage: varchar('stage', { length: 50 }).notNull(),
  visibility: varchar('visibility', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: varchar('file_size', { length: 50 }),
  filePath: varchar('file_path', { length: 500 }),
  uploadedBy: varchar('uploaded_by', { length: 50 }).notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { mode: 'string' }).notNull(),
}, (table) => ({
  idxTicket: index('idx_attachments_ticket').on(table.ticketId),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  ticket: one(tickets, { fields: [attachments.ticketId], references: [tickets.id] }),
  uploader: one(users, { fields: [attachments.uploadedBy], references: [users.id] }),
}));

// ── User Preferences ──
export const userPreferences = mysqlTable('user_preferences', {
  userId: varchar('user_id', { length: 50 }).primaryKey().references(() => users.id),
  darkMode: int('dark_mode', { unsigned: true }).default(0),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

// ── Company Settings (profile + theme) ──
export const companySettings = mysqlTable('company_settings', {
  id: varchar('id', { length: 50 }).primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull().default('Percetakan Integral Offset'),
  logoUrl: text('logo_url'),

  // Theme — brand colors
  primaryColor: varchar('primary_color', { length: 7 }).default('#026bb1'),
  primaryHoverColor: varchar('primary_hover_color', { length: 7 }).default('#025790'),
  primaryActiveColor: varchar('primary_active_color', { length: 7 }).default('#014674'),
  primaryMutedColor: varchar('primary_muted_color', { length: 7 }).default('#e6f1f8'),
  primaryForegroundColor: varchar('primary_foreground_color', { length: 7 }).default('#ffffff'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#475569'),
  secondaryHoverColor: varchar('secondary_hover_color', { length: 7 }).default('#334155'),
  secondaryForegroundColor: varchar('secondary_foreground_color', { length: 7 }).default('#ffffff'),
  accentColor: varchar('accent_color', { length: 7 }).default('#0ea5e9'),
  accentForegroundColor: varchar('accent_foreground_color', { length: 7 }).default('#ffffff'),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
});
