ALTER TABLE `tickets` DROP COLUMN `subcategory`;
ALTER TABLE `tickets` ADD COLUMN `aplikasi_project` VARCHAR(100) NULL AFTER `category`;
ALTER TABLE `tickets` ADD COLUMN `submodule` VARCHAR(100) NULL AFTER `aplikasi_project`;
CREATE TABLE IF NOT EXISTS `submodules` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `subcategory_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  INDEX `idx_submodule_subcategory` (`subcategory_id`),
  CONSTRAINT `fk_submodule_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Master Perusahaan & Divisi (identitas pelapor) ──
-- Collate disamakan dengan tabel lain (utf8mb4_unicode_ci) agar FK valid.
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `categories` ADD COLUMN `sla_critical` INT DEFAULT 1;
ALTER TABLE `categories` ADD COLUMN `sla_high` INT DEFAULT 4;
ALTER TABLE `categories` ADD COLUMN `sla_medium` INT DEFAULT 8;
ALTER TABLE `categories` ADD COLUMN `sla_low` INT DEFAULT 24;

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `contact_name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `ticket_id` VARCHAR(50),
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_read` (`is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_notif_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `divisions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `company_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  INDEX `idx_division_company` (`company_id`),
  CONSTRAINT `fk_division_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `users` ADD COLUMN `company_id` VARCHAR(50) NULL AFTER `department`;
ALTER TABLE `users` ADD COLUMN `division_id` VARCHAR(50) NULL AFTER `company_id`;
ALTER TABLE `users` ADD INDEX `idx_users_company` (`company_id`);
ALTER TABLE `users` ADD INDEX `idx_users_division` (`division_id`);
ALTER TABLE `users` ADD CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`);
ALTER TABLE `users` ADD CONSTRAINT `fk_users_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`);

-- ── Diskusi Tiket: Komentar (User ↔ IT) & Internal Note (khusus IT, Rule 15) ──
-- Idempoten (IF NOT EXISTS); kolom user_name/author_name snapshot saat tulis,
-- selaras dengan migrasi legacy di server/database/migrate.ts.
CREATE TABLE IF NOT EXISTS `comments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `ticket_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  INDEX `idx_comments_ticket` (`ticket_id`),
  CONSTRAINT `fk_comments_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `internal_notes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `ticket_id` VARCHAR(50) NOT NULL,
  `author_id` VARCHAR(50) NOT NULL,
  `author_name` VARCHAR(255) NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  INDEX `idx_internal_notes_ticket` (`ticket_id`),
  CONSTRAINT `fk_internal_notes_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `fk_internal_notes_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Rename master "Aplikasi/Project" -> "Project/Kendala" ──
-- Jalankan via skrip idempoten (dicek dulu lewat information_schema, backup otomatis):
--   npx tsx -r dotenv/config scripts/apply-project-kendala-migration.ts
-- Perintah mentahnya setara dengan:
--   ALTER TABLE `submodules` DROP FOREIGN KEY `fk_submodule_subcategory`;
--   ALTER TABLE `submodules` RENAME INDEX `idx_submodule_subcategory` TO `idx_submodule_project_kendala`;
--   ALTER TABLE `submodules` CHANGE COLUMN `subcategory_id` `project_kendala_id` VARCHAR(50) NOT NULL;
--   RENAME TABLE `subcategories` TO `project_kendala`;
--   ALTER TABLE `project_kendala` RENAME INDEX `idx_subcategory_category` TO `idx_project_kendala_category`;
--   ALTER TABLE `tickets` CHANGE COLUMN `aplikasi_project` `project_kendala` VARCHAR(100) NULL AFTER `category`;
--   ALTER TABLE `submodules` ADD CONSTRAINT `fk_submodule_project_kendala`
--     FOREIGN KEY (`project_kendala_id`) REFERENCES `project_kendala` (`id`) ON DELETE CASCADE;
