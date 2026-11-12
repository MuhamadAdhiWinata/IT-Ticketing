CREATE TABLE `menus` (
	`id` varchar(50) NOT NULL,
	`label` varchar(100) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`section` varchar(100) NOT NULL,
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	`is_active` int unsigned NOT NULL DEFAULT 1,
	CONSTRAINT `menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`key` varchar(60) NOT NULL,
	`label` varchar(150) NOT NULL,
	`group_name` varchar(50) NOT NULL,
	`sort_order` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `permissions_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` varchar(50) NOT NULL,
	`permission_key` varchar(60) NOT NULL,
	CONSTRAINT `role_permissions_role_id_permission_key_pk` PRIMARY KEY(`role_id`,`permission_key`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	`is_system` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_key_permissions_key_fk` FOREIGN KEY (`permission_key`) REFERENCES `permissions`(`key`) ON DELETE cascade ON UPDATE no action;