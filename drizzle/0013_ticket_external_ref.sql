ALTER TABLE `tickets` ADD `external_ref` varchar(100);--> statement-breakpoint
CREATE INDEX `idx_tickets_external_ref` ON `tickets` (`external_ref`);