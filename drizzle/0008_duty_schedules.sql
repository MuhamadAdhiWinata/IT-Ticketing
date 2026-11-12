CREATE TABLE `duty_schedules` (
	`id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`start_at` datetime NOT NULL,
	`end_at` datetime NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'SCHEDULED',
	`notes` text,
	`created_by` varchar(50) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `duty_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `on_duty` int unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `worklogs` ADD `on_duty` int unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `duty_schedules` ADD CONSTRAINT `duty_schedules_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `duty_schedules` ADD CONSTRAINT `duty_schedules_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_duty_user_window` ON `duty_schedules` (`user_id`,`start_at`,`end_at`);