# API Endpoint Matrix

## Authentication

| Method | Path | Auth | Role | Request | Response | Side Effects |
|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | No | Any | `{email, password}` | `{id, name, role, ...}` + JWT cookie | Generates JWT, sets HttpOnly cookie |
| POST | `/api/auth/logout` | Yes | Any | - | `{success}` | Clears auth cookie |
| GET | `/api/auth/me` | Yes | Any | - | `{id, name, role, ...}` | - |

## Users

| Method | Path | Auth | Role | Request | Response | Side Effects |
|---|---|---|---|---|---|---|
| GET | `/api/users` | Yes | Any | `?role=`, `?department=` | `AppUser[]` | - |
| POST | `/api/users` | Yes | SYSTEM_ADMIN | `{id, name, email, role, department}` | `AppUser` | Creates user |
| PUT | `/api/users/:id` | Yes | SYSTEM_ADMIN | Partial `AppUser` | `AppUser` | Updates user |
| DELETE | `/api/users/:id` | Yes | SYSTEM_ADMIN | - | `{success}` | Deletes user |

## Categories

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/categories` | Yes | Any | - | `CategoryItem[]` |
| POST | `/api/categories` | Yes | SYSTEM_ADMIN | `{id, name}` | `CategoryItem` |
| PUT | `/api/categories/:id` | Yes | SYSTEM_ADMIN | `{name}` | `CategoryItem` |
| DELETE | `/api/categories/:id` | Yes | SYSTEM_ADMIN | - | `{success}` |

## Subcategories

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/subcategories` | Yes | Any | `?categoryId=` | `SubcategoryItem[]` |
| POST | `/api/subcategories` | Yes | SYSTEM_ADMIN | `{id, categoryId, name}` | `SubcategoryItem` |
| PUT | `/api/subcategories/:id` | Yes | SYSTEM_ADMIN | `{categoryId, name}` | `SubcategoryItem` |
| DELETE | `/api/subcategories/:id` | Yes | SYSTEM_ADMIN | - | `{success}` |

## Vendors

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/vendors` | Yes | Any | - | `VendorItem[]` |
| POST | `/api/vendors` | Yes | SYSTEM_ADMIN | `{id, name, serviceType, contactPerson, phone}` | `VendorItem` |
| PUT | `/api/vendors/:id` | Yes | SYSTEM_ADMIN | Partial | `VendorItem` |
| DELETE | `/api/vendors/:id` | Yes | SYSTEM_ADMIN | - | `{success}` |

## Technicians

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/technicians` | Yes | Any | - | `TechnicianItem[]` |
| POST | `/api/technicians` | Yes | SYSTEM_ADMIN | `{id, name, specialty, phone}` | `TechnicianItem` |
| PUT | `/api/technicians/:id` | Yes | SYSTEM_ADMIN | Partial | `TechnicianItem` |
| DELETE | `/api/technicians/:id` | Yes | SYSTEM_ADMIN | - | `{success}` |

## Tickets

| Method | Path | Auth | Role | Request | Response | Lifecycle |
|---|---|---|---|---|---|---|
| GET | `/api/tickets` | Yes | Any | `?status=&search=` | `Ticket[]` | - |
| GET | `/api/tickets/:id` | Yes | Any | - | `Ticket` (with relations) | - |
| POST | `/api/tickets` | Yes | Any | `CreateTicketSchema` | `Ticket` | Creates ticket + audit log |
| PUT | `/api/tickets/:id` | Yes | Any | `UpdateTicketSchema` (editable fields only) | `Ticket` | - |
| PATCH | `/api/tickets/:id/status` | Yes | Any | `StatusUpdateSchema` | `Ticket` | Validates transition |
| PATCH | `/api/tickets/:id/assignee` | Yes | Any | `{userId}` | `Ticket` | - |
| POST | `/api/tickets/:id/stages/complete` | Yes | Any | `CompleteStageSchema` | `Ticket` | Validates transition, atomic write |
| POST | `/api/tickets/:id/worklogs` | Yes | IT_WORKER | `WorklogSchema` | `Ticket` | - |
| POST | `/api/tickets/:id/worklogs/custom` | Yes | IT_WORKER | `CustomWorklogSchema` | `Ticket` | - |
| POST | `/api/tickets/:id/comments` | Yes | Any | `CommentSchema` | `Ticket` | - |
| POST | `/api/tickets/:id/internal-notes` | Yes | IT_WORKER | `NoteSchema` | `Ticket` | - |
| POST | `/api/tickets/:id/attachments` | Yes | Any | `{stage, visibility, file_name, ...}` | `Ticket` | - |

## Reports

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/reports/summary` | Yes | SYSTEM_ADMIN | `?status=&category=&priority=` | `{totalTickets, completedCount, ...}` |
| GET | `/api/reports/tickets` | Yes | SYSTEM_ADMIN | `?status=&category=&workerId=` | `Ticket[]` |
| GET | `/api/reports/worklogs` | Yes | SYSTEM_ADMIN | `?workerId=&startDate=&endDate=` | Worklog[] |
| GET | `/api/reports/workers` | Yes | SYSTEM_ADMIN | - | Worker stats[] |

## Dashboard

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| GET | `/api/dashboard/kpis` | Yes | IT_WORKER/SYSTEM_ADMIN | `?workerId=&startDate=&endDate=` | KPI object |
| GET | `/api/dashboard/my-work` | Yes | IT_WORKER | - | `Ticket[]` |
| GET | `/api/dashboard/daily-worklogs` | Yes | IT_WORKER | `?startDate=&endDate=&workerId=` | Worklog[] |

## Upload & Preferences

| Method | Path | Auth | Role | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/upload` | Yes | Any | `multipart/form-data` | File metadata |
| GET | `/api/user/preferences` | Yes | Any | - | `{darkMode}` |
| PUT | `/api/user/preferences` | Yes | Any | `{darkMode}` | `{success}` |
| GET | `/api/uploads/**` | No | - | - | Static file |

## Ticket Transitions

```
DRAFT → PROCESS (via PATCH /status or POST /stages/complete ASSIGN)
PROCESS → IN_PROGRESS (via POST /stages/complete)
IN_PROGRESS → SELESAI (via POST /stages/complete)
IN_PROGRESS → DELEGASI (via POST /stages/complete)
DELEGASI → PROCESS (via POST /stages/complete)
SELESAI → PROCESS (reopen, via PATCH /status)
```

Invalid transitions return `409 Conflict`.
