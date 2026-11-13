CREATE TABLE `impacts` (
	`id` varchar(20) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	`is_active` int unsigned NOT NULL DEFAULT 1,
	CONSTRAINT `impacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priority_levels` (
	`id` varchar(10) NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` varchar(255),
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `priority_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priority_matrix` (
	`impact_id` varchar(20) NOT NULL,
	`urgency_id` varchar(20) NOT NULL,
	`priority_id` varchar(10) NOT NULL,
	CONSTRAINT `priority_matrix_impact_id_urgency_id_pk` PRIMARY KEY(`impact_id`,`urgency_id`)
);
--> statement-breakpoint
CREATE TABLE `urgencies` (
	`id` varchar(20) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	`is_active` int unsigned NOT NULL DEFAULT 1,
	CONSTRAINT `urgencies_id` PRIMARY KEY(`id`)
);
