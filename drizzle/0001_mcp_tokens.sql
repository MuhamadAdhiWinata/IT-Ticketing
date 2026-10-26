CREATE TABLE `mcp_idempotency` (
	`user_id` varchar(50) NOT NULL,
	`idem_key` varchar(100) NOT NULL,
	`tool` varchar(100) NOT NULL,
	`result_json` text,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `mcp_idempotency_user_id_idem_key_pk` PRIMARY KEY(`user_id`,`idem_key`)
);
--> statement-breakpoint
CREATE TABLE `mcp_tokens` (
	`id` varchar(50) NOT NULL,
	`user_id` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL,
	`last_used_at` timestamp,
	`revoked_at` timestamp,
	CONSTRAINT `mcp_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `mcp_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `mcp_idempotency` ADD CONSTRAINT `mcp_idempotency_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_tokens` ADD CONSTRAINT `mcp_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_mcp_tokens_user` ON `mcp_tokens` (`user_id`);