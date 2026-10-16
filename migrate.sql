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
