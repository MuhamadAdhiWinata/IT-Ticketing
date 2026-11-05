ALTER TABLE `tickets` ADD `reopen_count` int unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `resolution_summary` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `solution_type` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `odoo_task_url` varchar(500);--> statement-breakpoint
ALTER TABLE `tickets` ADD `tech_debt_url` varchar(500);--> statement-breakpoint
ALTER TABLE `tickets` ADD `acknowledged_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `accepted_at` timestamp;