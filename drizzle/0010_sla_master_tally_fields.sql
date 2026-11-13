CREATE TABLE `sla_settings` (
	`key` varchar(40) NOT NULL,
	`value` double NOT NULL,
	CONSTRAINT `sla_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `sla_targets` (
	`priority_id` varchar(10) NOT NULL,
	`response_hours` double NOT NULL,
	`resolution_hours` double NOT NULL,
	`coverage` varchar(10) NOT NULL,
	CONSTRAINT `sla_targets_priority_id` PRIMARY KEY(`priority_id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `contact` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `data_complete` varchar(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `first_completed_at` timestamp;