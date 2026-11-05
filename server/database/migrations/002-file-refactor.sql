-- Migration: File Refactor - Many-to-Many Attachment System
-- Created: 2026-11-05
-- Description: Rename attachments → files, create pivot tables for worklog_files and comment_files

-- Step 1: Rename attachments table to files
RENAME TABLE attachments TO files;

-- Step 2: Create worklog_files pivot table
CREATE TABLE worklog_files (
  id VARCHAR(50) PRIMARY KEY,
  worklog_id VARCHAR(50) NOT NULL,
  file_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worklog_id) REFERENCES worklogs(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_worklog_files_worklog (worklog_id),
  INDEX idx_worklog_files_file (file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create comment_files pivot table
CREATE TABLE comment_files (
  id VARCHAR(50) PRIMARY KEY,
  comment_id VARCHAR(50) NOT NULL,
  file_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_comment_files_comment (comment_id),
  INDEX idx_comment_files_file (file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Make stage nullable for new file records that use pivot system
ALTER TABLE files MODIFY COLUMN stage VARCHAR(50) NULL;

-- Notes:
-- - Existing files remain stage-based (no pivot entries)
-- - New files will use pivot system
-- - Both systems coexist for backward compatibility
