CREATE TABLE `comment_files` (
	`id` varchar(50) NOT NULL,
	`comment_id` varchar(50) NOT NULL,
	`file_id` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `comment_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `worklog_files` (
	`id` varchar(50) NOT NULL,
	`worklog_id` varchar(50) NOT NULL,
	`file_id` varchar(50) NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `worklog_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
RENAME TABLE `attachments` TO `files`;--> statement-breakpoint
ALTER TABLE `files` DROP FOREIGN KEY `attachments_ticket_id_tickets_id_fk`;
--> statement-breakpoint
ALTER TABLE `files` DROP FOREIGN KEY `attachments_uploaded_by_users_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_attachments_ticket` ON `files`;--> statement-breakpoint
ALTER TABLE `files` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `files` MODIFY COLUMN `stage` varchar(50);--> statement-breakpoint
ALTER TABLE `files` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `comment_files` ADD CONSTRAINT `comment_files_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comment_files` ADD CONSTRAINT `comment_files_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worklog_files` ADD CONSTRAINT `worklog_files_worklog_id_worklogs_id_fk` FOREIGN KEY (`worklog_id`) REFERENCES `worklogs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worklog_files` ADD CONSTRAINT `worklog_files_file_id_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_comment_files_comment` ON `comment_files` (`comment_id`);--> statement-breakpoint
CREATE INDEX `idx_comment_files_file` ON `comment_files` (`file_id`);--> statement-breakpoint
CREATE INDEX `idx_worklog_files_worklog` ON `worklog_files` (`worklog_id`);--> statement-breakpoint
CREATE INDEX `idx_worklog_files_file` ON `worklog_files` (`file_id`);--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_files_ticket` ON `files` (`ticket_id`);