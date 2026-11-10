ALTER TABLE `tickets` ADD `unit` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `expected_behavior` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `since_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `affected_scope` varchar(30);--> statement-breakpoint
ALTER TABLE `tickets` ADD `work_status` varchar(30);--> statement-breakpoint
ALTER TABLE `tickets` ADD `workaround` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `is_event` int unsigned DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `evidence_steps` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `channel` varchar(20) DEFAULT 'FORM' NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `ticket_type` varchar(30);--> statement-breakpoint
ALTER TABLE `tickets` ADD `impact` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `urgency` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `change_reason` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `catalog_item` varchar(10);--> statement-breakpoint
ALTER TABLE `tickets` ADD `data_approval_note` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `transfer_target` varchar(40);--> statement-breakpoint
ALTER TABLE `tickets` ADD `duty_confirmed_by` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `duty_confirmed_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `waiting_started_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `waiting_ended_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `blocked_by` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `closed_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `unit` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `is_pic` int unsigned DEFAULT 0 NOT NULL;