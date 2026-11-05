# PRD: File Refactor - Many-to-Many Attachment System

**Status:** Draft  
**Dibuat:** 2026-11-05  
**Prioritas:** High  

---

## 1. Overview

Refactor attachment system dari stage-based menjadi many-to-many relationship dengan worklog dan comment. Tujuan: worklog/comment bisa attach file, file bisa di-share antar multiple worklog/comment.

### 1.1 Problem Statement

Saat ini:
- Attachment hanya linked ke `ticket_id` + `stage`
- Tidak ada relasi eksplisit antara attachment dengan worklog tertentu
- Comment tidak bisa attach file
- Tidak bisa reuse file yang sama di multiple context

### 1.2 Goals

1. Worklog bisa attach multiple files (many-to-many)
2. Comment bisa attach multiple files (many-to-many)
3. File bisa di-reuse di multiple worklog/comment
4. Backward compatible dengan existing stage-based attachments
5. Chat-style interaction: worklog/comment + files = satu unit diskusi

---

## 2. Database Schema Changes

### 2.1 Rename Table: `attachments` → `files`

```sql
RENAME TABLE attachments TO files;
```

**Columns tetap sama:**
- `id` (PK)
- `ticket_id` (FK to tickets)
- `file_name`
- `file_size`
- `file_path`
- `uploaded_by` (FK to users)
- `uploaded_at`
- `visibility` ('USER_VISIBLE' | 'INTERNAL_ONLY')
- `stage` (keep untuk backward compat, nullable)

### 2.2 Create Pivot: `worklog_files`

```sql
CREATE TABLE worklog_files (
  id VARCHAR(50) PRIMARY KEY,
  worklog_id VARCHAR(50) NOT NULL,
  file_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (worklog_id) REFERENCES worklogs(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_worklog_files_worklog (worklog_id),
  INDEX idx_worklog_files_file (file_id)
);
```

### 2.3 Create Pivot: `comment_files`

```sql
CREATE TABLE comment_files (
  id VARCHAR(50) PRIMARY KEY,
  comment_id VARCHAR(50) NOT NULL,
  file_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_comment_files_comment (comment_id),
  INDEX idx_comment_files_file (file_id)
);
```

---

## 3. Migration Strategy

### 3.1 Data Migration

Existing attachments sudah ada di DB dengan `stage` set. Strategy:

**Option A: Leave as-is (Recommended)**
- Existing files tetap stage-based (tidak ada pivot entry)
- New files gunakan pivot system
- Query layer handle both: `ticket.files` (stage-based) + `worklog.files` (pivot-based)

**Option B: Migrate to nearest worklog**
- Scan existing attachments
- Match `stage` + `uploaded_at` dengan worklog terdekat
- Create pivot entry
- Risk: data mismatch jika worklog tidak ada

**Pilihan: Option A** (safer, backward compatible)

### 3.2 Rollback Plan

```sql
-- Rollback migration
DROP TABLE worklog_files;
DROP TABLE comment_files;
RENAME TABLE files TO attachments;
```

---

## 4. Service Layer Changes

### 4.1 File Service (`server/services/ticketing/files.ts`)

New service untuk handle file operations:

```typescript
// Upload files, return file records
async function uploadFiles(
  actor: Actor,
  ticketId: string,
  files: UploadInput[],
  visibility: 'USER_VISIBLE' | 'INTERNAL_ONLY',
  exec?: DbExec
): Promise<FileRecord[]>

// Link files to worklog
async function linkFilesToWorklog(
  worklogId: string,
  fileIds: string[],
  exec?: DbExec
): Promise<void>

// Link files to comment
async function linkFilesToComment(
  commentId: string,
  fileIds: string[],
  exec?: DbExec
): Promise<void>

// Get files by worklog
async function getFilesByWorklog(
  worklogId: string,
  exec?: DbExec
): Promise<FileRecord[]>

// Get files by comment
async function getFilesByComment(
  commentId: string,
  exec?: DbExec
): Promise<FileRecord[]>
```

### 4.2 Activity Service Update

`addActivity()` flow:
1. Create worklog record
2. Upload files → `uploadFiles()`
3. Link files ke worklog → `linkFilesToWorklog()`

### 4.3 Discussion Service Update

`addComment()` flow:
1. Create comment record
2. Upload files (new feature) → `uploadFiles()`
3. Link files ke comment → `linkFilesToComment()`

---

## 5. API Changes

### 5.1 POST `/api/tickets/:id/worklogs`

**Request (multipart/form-data):**
```
description: string
stageKey: string
files: File[]
visibility: 'USER_VISIBLE' | 'INTERNAL_ONLY'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "worklog": { ... },
    "files": [
      { "id": "FILE-001", "file_name": "screenshot.png", ... }
    ]
  }
}
```

### 5.2 POST `/api/tickets/:id/comments` (NEW: support files)

**Request (multipart/form-data):**
```
message: string
files: File[]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": { ... },
    "files": [
      { "id": "FILE-002", "file_name": "log.txt", ... }
    ]
  }
}
```

### 5.3 GET `/api/tickets/:id` (response update)

```json
{
  "worklogs": [
    {
      "id": "WL-001",
      "description": "...",
      "files": [
        { "id": "FILE-001", "file_name": "screenshot.png", ... }
      ]
    }
  ],
  "comments": [
    {
      "id": "CMT-001",
      "message": "...",
      "files": [
        { "id": "FILE-002", "file_name": "log.txt", ... }
      ]
    }
  ]
}
```

---

## 6. Frontend Changes

### 6.1 TicketDetailView.vue

**Worklog section:**
- Display files inline dengan worklog (existing behavior, tapi dari pivot)

**Comment section (NEW):**
- Add file upload input di comment form
- Display attached files per comment (chat bubble + files below)
- Download/preview files

**Layout:**
```
┌─────────────────────────────────┐
│ [User A]                   10:30│
│ "Sudah saya coba restart"       │
│ ┌──────────┐ ┌──────────┐      │
│ │📷 img.png│ │📄 log.txt│      │
│ └──────────┘ └──────────┘      │
└─────────────────────────────────┘
```

### 6.2 Upload Component

Reusable upload handler untuk worklog dan comment:
- Multiple file selection
- Preview pending files
- Remove before submit

---

## 7. Type Changes (`types/index.ts`)

```typescript
export interface FileRecord {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size: string | null;
  file_path: string | null;
  uploaded_by: string;
  uploaded_at: string;
  visibility: 'USER_VISIBLE' | 'INTERNAL_ONLY';
  stage?: string | null; // legacy
}

export interface Worklog {
  id: string;
  ticket_id: string;
  stage_key: string;
  worker_id: string;
  worker_name?: string;
  date: string;
  start_at: string;
  finish_at: string;
  duration_minutes: number;
  description: string;
  created_at: string;
  files?: FileRecord[]; // NEW
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
  files?: FileRecord[]; // NEW
}
```

---

## 8. Testing Checklist

### 8.1 Backend
- [ ] Migration runs without errors
- [ ] Create worklog with files → pivot entries created
- [ ] Create comment with files → pivot entries created
- [ ] GET ticket → files included in worklog/comment
- [ ] Existing stage-based files still queryable
- [ ] File deletion cascades to pivot

### 8.2 Frontend
- [ ] Worklog form: upload files → displayed after submit
- [ ] Comment form: upload files → displayed after submit
- [ ] File preview (images) works
- [ ] File download works
- [ ] Chat-style layout: own messages right, others left

### 8.3 Edge Cases
- [ ] Multiple files per worklog/comment
- [ ] Same file attached to multiple worklog/comment
- [ ] Large file upload (size limit)
- [ ] File type validation
- [ ] Permission: USER_NON_IT cannot see INTERNAL_ONLY files

---

## 9. Rollout Plan

### Phase 1: DB Migration (30 min)
1. Backup staging DB
2. Run migration SQL
3. Verify table structure

### Phase 2: Backend Refactor (2 hours)
1. Update schema.ts
2. Create files.ts service
3. Refactor activities.ts, discussion.ts
4. Update API routes
5. Update types

### Phase 3: Frontend Update (1.5 hours)
1. Update TicketDetailView.vue
2. Add file upload to comment form
3. Display files per worklog/comment
4. Test upload/preview/download

### Phase 4: Testing (1 hour)
1. End-to-end test di local
2. Test backward compat dengan existing files
3. Deploy ke staging
4. Smoke test di staging

**Total estimate: 5 hours**

---

## 10. Success Metrics

- [ ] Comment bisa attach file
- [ ] Worklog + files tampil sebagai satu unit diskusi
- [ ] Existing attachments tetap berfungsi
- [ ] No data loss
- [ ] No breaking changes di production flow

---

## 11. Future Enhancements

- File deduplication (hash-based)
- File preview modal (zoom in/out)
- Drag-and-drop file upload
- File search across tickets
- File versioning

---

**Approved by:** [Pending]  
**Implementation start:** 2026-11-05  
**Target completion:** 2026-11-05
