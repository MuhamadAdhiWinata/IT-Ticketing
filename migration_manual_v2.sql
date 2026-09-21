-- Hapus kolom JSON lama dari tickets jika masih ada
ALTER TABLE `tickets` DROP COLUMN IF EXISTS `worklogs`;
ALTER TABLE `tickets` DROP COLUMN IF EXISTS `comments`;
ALTER TABLE `tickets` DROP COLUMN IF EXISTS `internal_notes`;
ALTER TABLE `tickets` DROP COLUMN IF EXISTS `audit_logs`;
ALTER TABLE `tickets` DROP COLUMN IF EXISTS `attachments`;

-- Tabel worklogs
CREATE TABLE IF NOT EXISTS `worklogs` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`stage_key` varchar(50) NOT NULL,
	`worker_id` varchar(50) NOT NULL,
	`worker_name` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`start_at` varchar(5) NOT NULL,
	`finish_at` varchar(5) NOT NULL,
	`duration_minutes` int unsigned DEFAULT 0,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `worklogs_id` PRIMARY KEY(`id`),
    CONSTRAINT `worklogs_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_worklogs_ticket` ON `worklogs` (`ticket_id`);
CREATE INDEX IF NOT EXISTS `idx_worklogs_worker` ON `worklogs` (`worker_id`);
CREATE INDEX IF NOT EXISTS `idx_worklogs_date` ON `worklogs` (`date`);

-- Tabel comments
CREATE TABLE IF NOT EXISTS `comments` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`user_name` varchar(255) NOT NULL,
	`user_role` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`),
    CONSTRAINT `comments_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_comments_ticket` ON `comments` (`ticket_id`);

-- Tabel internal_notes
CREATE TABLE IF NOT EXISTS `internal_notes` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`author_id` varchar(50) NOT NULL,
	`author_name` varchar(255) NOT NULL,
	`note` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `internal_notes_id` PRIMARY KEY(`id`),
    CONSTRAINT `notes_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_notes_ticket` ON `internal_notes` (`ticket_id`);

-- Tabel audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`action` varchar(255) NOT NULL,
	`performed_at` timestamp NOT NULL,
	`performed_by` varchar(50) NOT NULL,
	`performed_by_name` varchar(255) NOT NULL,
	`detail` text,
	`notes` text,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`),
    CONSTRAINT `audit_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_audit_ticket` ON `audit_logs` (`ticket_id`);

-- Tabel attachments
CREATE TABLE IF NOT EXISTS `attachments` (
	`id` varchar(50) NOT NULL,
	`ticket_id` varchar(50) NOT NULL,
	`stage` varchar(50) NOT NULL,
	`visibility` varchar(50) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` varchar(50),
	`file_path` varchar(500),
	`uploaded_by` varchar(50) NOT NULL,
	`uploaded_by_name` varchar(255) NOT NULL,
	`uploaded_at` timestamp NOT NULL,
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`),
    CONSTRAINT `attach_ticket_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_attachments_ticket` ON `attachments` (`ticket_id`);
