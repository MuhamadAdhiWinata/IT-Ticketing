# API Contract Matrix

Mapping: Frontend Type → API Response (DTO) → Database Column

## Ticket

| Frontend Field | API Response Field | DB Column/Key | Notes |
|---|---|---|---|
| `id` | `id` | `tickets.id` | Primary key |
| `title` | `title` | `tickets.title` | |
| `description` | `description` | `tickets.description` | |
| `category` | `category` | `tickets.category` | |
| `subcategory` | `subcategory` | `tickets.subcategory` | |
| `location` | `location` | `tickets.location` | |
| `priority` | `priority` | `tickets.priority` | |
| `status` | `status` | `tickets.status` | |
| `created_by` | `created_by` | `tickets.created_by` | snake_case |
| `created_by_name` | `created_by_name` | `tickets.created_by_name` | snake_case |
| `created_by_dept` | `created_by_dept` | `tickets.created_by_dept` | snake_case |
| `created_by_admin_id` | `created_by_admin_id` | `tickets.created_by_admin_id` | snake_case |
| `created_by_admin_name` | `created_by_admin_name` | `tickets.created_by_admin_name` | snake_case |
| `requestedBy` | `requestedBy` | `tickets.requested_by` | camelCase (DB uses snake) |
| `requestedByName` | `requestedByName` | `tickets.requested_by_name` | camelCase |
| `requestedByDept` | `requestedByDept` | `tickets.requested_by_dept` | camelCase |
| `assignedTo` | `assignedTo` | `tickets.assigned_to` | camelCase (DB uses snake) |
| `assignedToName` | `assignedToName` | `tickets.assigned_to_name` | camelCase |
| `members` | `members` | `ticket_members` (relational) | Array of {user_id, user_name, created_at} |
| `delegation` | `delegation` | `tickets.delegation_*` columns | Nested object from flat DB columns |
| `attachments` | `attachments` | `attachments` (relational) | Serialized |
| `worklogs` | `worklogs` | `worklogs` (relational) | Serialized |
| `comments` | `comments` | `comments` (relational) | Serialized |
| `internal_notes` | `internal_notes` | `internal_notes` (relational) | Serialized |
| `audit_logs` | `audit_logs` | `audit_logs` (relational) | Serialized |
| `created_at` | `created_at` | `tickets.created_at` | snake_case |
| `ticket_number` | `ticket_number` | `tickets.ticket_number` | snake_case |
| `issued_at` | `issued_at` | `tickets.issued_at` | snake_case |
| `process_started_at` | `process_started_at` | `tickets.process_started_at` | snake_case |
| `completed_at` | `completed_at` | `tickets.completed_at` | snake_case |
| `resolution_summary` | `resolution_summary` | `tickets.resolution_summary` | snake_case |
| `confirmed_by_user` | `confirmed_by_user` | `tickets.confirmed_by_user` | snake_case |
| `referenced_ticket_id` | `referenced_ticket_id` | `tickets.referenced_ticket_id` | snake_case |

## Worklog

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `worklogs.id` |
| `stageKey` | `stageKey` | `worklogs.stage_key` |
| `worker_id` | `worker_id` | `worklogs.worker_id` |
| `worker_name` | `worker_name` | `worklogs.worker_name` |
| `date` | `date` | `worklogs.date` |
| `start_at` | `start_at` | `worklogs.start_at` |
| `finish_at` | `finish_at` | `worklogs.finish_at` |
| `duration_minutes` | `duration_minutes` | `worklogs.duration_minutes` |
| `description` | `description` | `worklogs.description` |
| `created_at` | `created_at` | `worklogs.created_at` |

## Comment

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `comments.id` |
| `user_id` | `user_id` | `comments.user_id` |
| `user_name` | `user_name` | `comments.user_name` |
| `user_role` | `user_role` | `comments.user_role` |
| `message` | `message` | `comments.message` |
| `created_at` | `created_at` | `comments.created_at` |

## InternalNote

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `internal_notes.id` |
| `author_id` | `author_id` | `internal_notes.author_id` |
| `author_name` | `author_name` | `internal_notes.author_name` |
| `note` | `note` | `internal_notes.note` |
| `created_at` | `created_at` | `internal_notes.created_at` |

## AuditLog

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `audit_logs.id` |
| `action` | `action` | `audit_logs.action` |
| `performed_at` | `performed_at` | `audit_logs.performed_at` |
| `performed_by` | `performed_by` | `audit_logs.performed_by` |
| `performed_by_name` | `performed_by_name` | `audit_logs.performed_by_name` |
| `detail` | `detail` | `audit_logs.detail` |
| `notes` | `notes` | `audit_logs.notes` |

## Attachment

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `attachments.id` |
| `stage` | `stage` | `attachments.stage` |
| `visibility` | `visibility` | `attachments.visibility` |
| `file_name` | `file_name` | `attachments.file_name` |
| `file_size` | `file_size` | `attachments.file_size` |
| `file_path` | `file_path` | `attachments.file_path` |
| `uploaded_by` | `uploaded_by` | `attachments.uploaded_by` |
| `uploaded_by_name` | `uploaded_by_name` | `attachments.uploaded_by_name` |
| `uploaded_at` | `uploaded_at` | `attachments.uploaded_at` |

## Subcategory

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `subcategories.id` |
| `category_id` | `category_id` | `subcategories.category_id` (Drizzle camelCase) |
| `name` | `name` | `subcategories.name` |

## Vendor

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `vendors.id` |
| `name` | `name` | `vendors.name` |
| `service_type` | `service_type` | `vendors.service_type` (Drizzle camelCase) |
| `contact_person` | `contact_person` | `vendors.contact_person` (Drizzle camelCase) |
| `phone` | `phone` | `vendors.phone` |

## User

| Frontend Field | API Response | DB Column |
|---|---|---|
| `id` | `id` | `users.id` |
| `name` | `name` | `users.name` |
| `email` | `email` | `users.email` |
| `role` | `role` | `users.role` |
| `department` | `department` | `users.department` |
| `avatarUrl` | `avatarUrl` | `users.avatar_url` (Drizzle camelCase) |
