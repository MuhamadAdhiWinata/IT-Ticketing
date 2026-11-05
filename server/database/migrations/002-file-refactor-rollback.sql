-- Rollback migration: File Refactor
-- Run this if migration fails or needs to be reverted

-- Step 1: Drop pivot tables
DROP TABLE IF EXISTS comment_files;
DROP TABLE IF EXISTS worklog_files;

-- Step 2: Revert stage column to NOT NULL (if needed, check existing data first)
-- ALTER TABLE files MODIFY COLUMN stage VARCHAR(50) NOT NULL;

-- Step 3: Rename files back to attachments
RENAME TABLE files TO attachments;
