# Product Requirements Document
## Mention System - IT Ticketing & Work Monitoring

**Versi:** 1.0  
**Tanggal:** 5 November 2026  
**Status:** Draft  
**Penulis:** IT Development Team

---

## 1. Overview & Goals

### 1.1 Latar Belakang
Sistem IT Ticketing saat ini memiliki fitur komentar dan worklog untuk kolaborasi antar worker. Namun, belum ada mekanisme untuk mention pengguna spesifik yang perlu dilibatkan dalam diskusi atau pekerjaan tiket tertentu.

### 1.2 Tujuan
- Memungkinkan worker mention rekan kerja dalam komentar/worklog menggunakan syntax `@username`
- Mengirimkan notifikasi real-time kepada user yang di-mention
- Meningkatkan kolaborasi dan response time dalam penanganan tiket
- Menyediakan audit trail untuk semua mention activity

### 1.3 Success Metrics
- 80% worker menggunakan mention dalam 2 minggu pertama
- Response time tiket berkurang 30% pada tiket yang menggunakan mention
- Zero notifikasi yang terlewat (100% delivery rate)

---

## 2. User Stories

### US-001: Mention User dalam Komentar
**Sebagai** IT Worker  
**Saya ingin** mention rekan kerja di komentar tiket  
**Sehingga** mereka langsung aware dan bisa respond cepat

**Acceptance Criteria:**
- Worker ketik `@` di komentar, muncul autocomplete dropdown
- Dropdown show max 10 user yang match dengan input
- User terpilih ter-highlight di komentar (visual badge)
- Mention tersimpan di database

### US-002: Terima Notifikasi Mention
**Sebagai** IT Worker  
**Saya ingin** dapat notifikasi ketika ada yang mention saya  
**Sehingga** saya tidak miss tiket yang butuh perhatian saya

**Acceptance Criteria:**
- Notifikasi muncul di notification bell (top navbar)
- Notifikasi berisi: siapa yang mention, di tiket mana, excerpt komentar
- Klik notifikasi langsung buka tiket dan scroll ke komentar

### US-003: Lihat History Mention
**Sebagai** IT Worker  
**Saya ingin** lihat semua tiket dimana saya pernah di-mention  
**Sehingga** saya bisa track kolaborasi dan follow-up

**Acceptance Criteria:**
- Halaman "Mentioned Me" di sidebar navigation
- List tiket dengan filter status (Open, In Progress, Closed)
- Badge count di sidebar untuk unread mention

---

## 3. Technical Design

### 3.1 Database Schema

#### Table: `mentions`
```sql
CREATE TABLE mentions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mentionable_type ENUM('comment', 'worklog') NOT NULL,
  mentionable_id BIGINT UNSIGNED NOT NULL,
  mentioned_user_id BIGINT UNSIGNED NOT NULL,
  ticket_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_mentioned_user (mentioned_user_id),
  INDEX idx_ticket (ticket_id),
  INDEX idx_mentionable (mentionable_type, mentionable_id),
  
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
);
```

#### Table Extension: `notifications`
Tambah field `mention_id` nullable untuk link ke mentions table.

### 3.2 API Endpoints

#### POST `/api/tickets/{ticketId}/comments`
Request body tambah field:
```json
{
  "content": "string (support markdown + @mention)",
  "mentions": ["userId1", "userId2"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "commentId": 123,
    "mentions": [
      {
        "id": 1,
        "userId": "userId1",
        "username": "john.doe"
      }
    ]
  }
}
```

#### GET `/api/users/search?q={query}&limit=10`
Autocomplete endpoint untuk mention dropdown.

Response:
```json
{
  "users": [
    {
      "id": "userId1",
      "username": "john.doe",
      "full_name": "John Doe",
      "avatar": "url"
    }
  ]
}
```

#### GET `/api/mentions/me?status={open|closed}&page=1`
List tiket dimana current user di-mention.

Response:
```json
{
  "data": [
    {
      "mentionId": 1,
      "ticketId": "TCK-202611-001",
      "ticketTitle": "Laptop error",
      "mentionedBy": {
        "username": "jane.smith",
        "fullName": "Jane Smith"
      },
      "excerpt": "Hey @john.doe bisa bantu check ini?",
      "createdAt": "2026-11-05T10:00:00Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "total": 25
  }
}
```

### 3.3 Frontend Autocomplete Behavior

#### Trigger
- User ketik `@` di textarea komentar/worklog
- Muncul dropdown 200px below cursor position

#### Search
- Input setelah `@` trigger debounced API call (300ms)
- Query: `GET /api/users/search?q={input}`
- Show max 10 results

#### Selection
- Arrow up/down untuk navigasi
- Enter atau mouse click untuk pilih
- `@username` di-replace dengan component badge
- Badge: `<span class="mention-badge" data-user-id="...">@username</span>`

#### Parsing saat Submit
- Frontend extract semua `.mention-badge` element
- Kirim array `mentions: [userId1, userId2]` ke API
- Backend create mention records + trigger notifikasi

---

## 4. Notification Flow

### 4.1 Flow Diagram
```
[User A post comment with @UserB] 
  → [API create comment] 
  → [Parse mentions array] 
  → [Create mention records] 
  → [Trigger notification service] 
  → [Create notification record] 
  → [Push WebSocket event to UserB] 
  → [UserB navbar bell badge update]
```

### 4.2 Notification Content
**Title:** "Anda di-mention dalam tiket {ticketId}"  
**Body:** "{mentionerName}: {excerpt 100 chars}..."  
**Action:** Link ke `/tickets/{ticketId}#comment-{commentId}`

### 4.3 Notification Delivery
- Real-time: WebSocket push jika user online
- Persistent: Notification record di database
- Badge count: Aggregate unread di navbar

---

## 5. Edge Cases & Handling

### 5.1 Mention User Non-Existing
**Case:** User ketik `@unknown_user` yang tidak ada di database  
**Handling:** 
- Autocomplete tidak show result
- Jika manual ketik dan submit, backend ignore mention tersebut
- Frontend show warning: "User @unknown_user tidak ditemukan"

### 5.2 Mention Self
**Case:** User mention username sendiri `@me`  
**Handling:**
- Allowed (bisa untuk self-reminder)
- Tidak create notification (skip notification service)
- Mention record tetap tersimpan

### 5.3 Duplicate Mention
**Case:** User mention same user multiple times dalam 1 comment  
**Handling:**
- Backend deduplicate: only create 1 mention record per user per comment
- Notification dikirim 1x saja

### 5.4 Permission Check
**Case:** User A mention User B, tapi User B tidak punya akses ke tiket  
**Handling:**
- Mention tetap tersimpan
- Notification tetap dikirim
- Saat User B klik notifikasi, show access denied message
- UI mention badge di comment tetap visible (audit trail)

### 5.5 Deleted User
**Case:** User yang di-mention kemudian dihapus dari sistem  
**Handling:**
- Foreign key CASCADE delete: mention record otomatis terhapus
- Notification orphan di-cleanup via scheduled job (daily)
- UI show: `@[deleted_user]` (greyed out badge)

### 5.6 High Volume Mention
**Case:** User mention 20+ people dalam 1 comment  
**Handling:**
- Backend limit max 15 mention per comment
- API return error: "Maximum 15 mention per komentar"
- Frontend show validation sebelum submit

---

## 6. UI/UX Mockup Description

### 6.1 Autocomplete Dropdown
**Visual:**
```
┌──────────────────────────────────┐
│ 🔍 Search users...               │
├──────────────────────────────────┤
│ [Avatar] John Doe                │
│          @john.doe               │
├──────────────────────────────────┤
│ [Avatar] Jane Smith              │
│          @jane.smith             │
├──────────────────────────────────┤
│ [Avatar] Bob Wilson              │
│          @bob.wilson             │
└──────────────────────────────────┘
```

**Behavior:**
- Dropdown width: 300px
- Max height: 400px (scrollable)
- Hover state: light blue background `bg-blue-50`
- Selected state: blue background `bg-blue-100`

### 6.2 Mention Badge in Comment
**Visual:**
```
Komentar: "Hey [@john.doe] bisa bantu check server issue ini?"
```

**Badge Style:**
- Background: `#026bb1` (brand blue)
- Text: white
- Padding: `2px 8px`
- Border radius: `12px`
- Font weight: `500`
- Hover: show tooltip dengan full name + avatar

### 6.3 Notification Item
**Visual:**
```
┌────────────────────────────────────────────┐
│ 🔔 Anda di-mention dalam TCK-202611-001    │
│ Jane Smith: "Hey @john.doe bisa bantu..."  │
│ 5 menit lalu                         [•]   │
└────────────────────────────────────────────┘
```

**Behavior:**
- Unread: blue dot indicator + bold title
- Read: grey text + no dot
- Click: navigate to ticket + scroll to comment
- Hover: light grey background

### 6.4 Mentioned Me Page
**Visual:**
```
Sidebar Menu:
├── Dashboard
├── My Work
├── Mentioned Me [3]    ← New menu item
└── All Tickets

Page Layout:
┌────────────────────────────────────────────┐
│ Mentioned Me                               │
│ [Filter: All ▼] [Status: Open ▼]          │
├────────────────────────────────────────────┤
│ TCK-202611-001 • Laptop error              │
│ Mentioned by: Jane Smith • 2 jam lalu      │
│ "Hey @john.doe bisa bantu check ini?"      │
├────────────────────────────────────────────┤
│ TCK-202611-015 • Network down              │
│ Mentioned by: Bob Wilson • 1 hari lalu     │
│ "@john.doe urgent nih, client komplain"    │
└────────────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Core Functionality (Sprint 1-2)
- Database schema implementation
- API endpoints (create mention, search users)
- Frontend autocomplete component
- Basic notification delivery

### Phase 2: UX Enhancement (Sprint 3)
- Mentioned Me page
- Notification read/unread state
- Badge count di sidebar

### Phase 3: Polish & Edge Cases (Sprint 4)
- Permission handling
- Edge case validation
- Performance optimization (index tuning)

---

## 8. Testing Requirements

### 8.1 Unit Tests
- Mention parser logic (extract @username dari text)
- Duplicate detection
- Permission check utility

### 8.2 Integration Tests
- API endpoint: create comment with mentions
- Notification service trigger
- WebSocket delivery

### 8.3 E2E Tests
- User flow: ketik @, pilih user, submit, verify notifikasi
- Edge case: mention non-existing user
- Performance: mention 15 users sekaligus

---

## 9. Security Considerations

### 9.1 XSS Prevention
- Sanitize mention badge output (escape HTML)
- Use Vue component untuk render badge, bukan raw HTML

### 9.2 Authorization
- Verify user punya akses ke tiket sebelum create mention
- Notification hanya dikirim ke active user (status != deleted)

### 9.3 Rate Limiting
- Max 15 mention per comment (prevent spam)
- Max 50 mention per user per day (anti-abuse)

---

## 10. Success Criteria & Rollout

### 10.1 Definition of Done
- [ ] All API endpoints tested (Postman collection)
- [ ] Frontend autocomplete functional di Chrome, Firefox, Safari
- [ ] Notification delivery 100% di staging environment
- [ ] PRD approved by Product Owner
- [ ] Code review passed
- [ ] E2E tests passed

### 10.2 Rollout Plan
1. **Week 1:** Deploy to staging, internal testing
2. **Week 2:** Soft launch (feature flag 20% users)
3. **Week 3:** Monitor metrics, fix bugs
4. **Week 4:** Full rollout (100% users)

### 10.3 Monitoring
- Track mention creation rate (mentions/day)
- Monitor notification delivery latency (target <500ms)
- Alert jika notification delivery rate <95%

---

## 11. Open Questions

1. **Q:** Apakah mention bisa di-edit/delete setelah submit?  
   **A:** TBD - need PM decision. Proposal: allow edit dalam 5 menit, setelah itu locked.

2. **Q:** Apakah mention di internal note juga support?  
   **A:** Yes, menggunakan schema yang sama (`mentionable_type='internal_note'`).

3. **Q:** Format notifikasi email untuk mention?  
   **A:** Phase 2 - initial release hanya in-app notification.

---

## 12. Appendix

### 12.1 Related Documents
- API Documentation: `docs/API.md`
- Database ERD: `docs/ERD.png`
- Notification Service Design: `docs/notification-service.md`

### 12.2 Revision History
| Versi | Tanggal    | Perubahan                  | Penulis |
|-------|------------|----------------------------|---------|
| 1.0   | 2026-11-05 | Initial draft              | Dev Team|
