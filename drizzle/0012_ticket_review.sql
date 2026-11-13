ALTER TABLE `tickets` ADD `submitted_by` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `review_started_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `review_started_by` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `verified_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `verified_by` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` ADD `review_skipped` int unsigned DEFAULT 0 NOT NULL;