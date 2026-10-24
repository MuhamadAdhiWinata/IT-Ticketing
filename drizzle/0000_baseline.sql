CREATE TABLE `attachments` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`stage` varchar(50) NOT NULL,
	`visibility` varchar(50) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` varchar(50),
	`file_path` varchar(500),
	`uploaded_by` varchar(50) NOT NULL,
	`uploaded_at` timestamp NOT NULL,
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`action` varchar(255) NOT NULL,
	`performed_at` timestamp NOT NULL,
	`performed_by` varchar(50) NOT NULL,
	`detail` text,
	`notes` text,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`sla_critical` int DEFAULT 1,
	`sla_high` int DEFAULT 4,
	`sla_medium` int DEFAULT 8,
	`sla_low` int DEFAULT 24,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`user_name` varchar(255) NOT NULL,
	`user_role` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` varchar(50) NOT NULL,
	`company_name` varchar(255) NOT NULL DEFAULT 'Percetakan Integral Offset',
	`logo_url` text,
	`primary_color` varchar(7) DEFAULT '#026bb1',
	`primary_hover_color` varchar(7) DEFAULT '#025790',
	`primary_active_color` varchar(7) DEFAULT '#014674',
	`primary_muted_color` varchar(7) DEFAULT '#e6f1f8',
	`primary_foreground_color` varchar(7) DEFAULT '#ffffff',
	`secondary_color` varchar(7) DEFAULT '#475569',
	`secondary_hover_color` varchar(7) DEFAULT '#334155',
	`secondary_foreground_color` varchar(7) DEFAULT '#ffffff',
	`accent_color` varchar(7) DEFAULT '#0ea5e9',
	`accent_foreground_color` varchar(7) DEFAULT '#ffffff',
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `company_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `divisions` (
	`id` varchar(50) NOT NULL,
	`company_id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `divisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_notes` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`author_id` varchar(50) NOT NULL,
	`author_name` varchar(255) NOT NULL,
	`note` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `internal_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`ticket_id` varchar(50),
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`is_read` int unsigned DEFAULT 0,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_kendala` (
	`id` varchar(50) NOT NULL,
	`category_id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `project_kendala_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submodules` (
	`id` varchar(50) NOT NULL,
	`project_kendala_id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `submodules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_members` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `ticket_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`project_kendala` varchar(100),
	`submodule` varchar(100),
	`location` varchar(500) NOT NULL,
	`priority` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`created_by` varchar(50) NOT NULL,
	`created_by_dept` varchar(255) NOT NULL,
	`created_by_admin_id` varchar(50),
	`requested_by` varchar(50) NOT NULL,
	`requested_by_dept` varchar(255) NOT NULL,
	`assigned_to` varchar(50),
	`delegation_type` varchar(50),
	`vendor_id` varchar(50),
	`vendor_name` varchar(255),
	`technician_id` varchar(50),
	`technician_name` varchar(255),
	`reference_no` varchar(100),
	`delegation_notes` text,
	`delegated_at` timestamp,
	`returned_at` timestamp,
	`returned_notes` text,
	`referenced_ticket_id` varchar(50),
	`created_at` timestamp NOT NULL,
	`ticket_number` varchar(50),
	`issued_at` timestamp,
	`process_started_at` timestamp,
	`completed_at` timestamp,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` varchar(50) NOT NULL,
	`dark_mode` int unsigned DEFAULT 0,
	CONSTRAINT `user_preferences_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` text,
	`role` varchar(50) NOT NULL,
	`department` varchar(255) NOT NULL,
	`company_id` varchar(50),
	`division_id` varchar(50),
	`avatar_url` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_name` varchar(255),
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendors_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `worklogs` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`stage_key` varchar(50) NOT NULL,
	`worker_id` varchar(50) NOT NULL,
	`date` varchar(10) NOT NULL,
	`start_at` varchar(5) NOT NULL,
	`finish_at` varchar(5) NOT NULL,
	`duration_minutes` int unsigned DEFAULT 0,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `worklogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_performed_by_users_id_fk` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `divisions` ADD CONSTRAINT `divisions_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internal_notes` ADD CONSTRAINT `internal_notes_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `internal_notes` ADD CONSTRAINT `internal_notes_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_kendala` ADD CONSTRAINT `project_kendala_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submodules` ADD CONSTRAINT `submodules_project_kendala_id_project_kendala_id_fk` FOREIGN KEY (`project_kendala_id`) REFERENCES `project_kendala`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_members` ADD CONSTRAINT `ticket_members_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_members` ADD CONSTRAINT `ticket_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_requested_by_users_id_fk` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_division_id_divisions_id_fk` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worklogs` ADD CONSTRAINT `worklogs_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worklogs` ADD CONSTRAINT `worklogs_worker_id_users_id_fk` FOREIGN KEY (`worker_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_attachments_ticket` ON `attachments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_ticket` ON `audit_logs` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_comments_ticket` ON `comments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_division_company` ON `divisions` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_internal_notes_ticket` ON `internal_notes` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_notif_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notif_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_project_kendala_category` ON `project_kendala` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_submodule_project_kendala` ON `submodules` (`project_kendala_id`);--> statement-breakpoint
CREATE INDEX `idx_tm_ticket` ON `ticket_members` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_tm_user` ON `ticket_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_created_by` ON `tickets` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_tickets_assigned_to` ON `tickets` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `idx_tickets_created_at` ON `tickets` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_users_company` ON `users` (`company_id`);--> statement-breakpoint
CREATE INDEX `idx_users_division` ON `users` (`division_id`);--> statement-breakpoint
CREATE INDEX `idx_worklogs_ticket` ON `worklogs` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_worklogs_worker` ON `worklogs` (`worker_id`);--> statement-breakpoint
CREATE INDEX `idx_worklogs_date` ON `worklogs` (`date`);