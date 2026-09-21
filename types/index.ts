export type UserRole = 'USER_NON_IT' | 'IT_WORKER' | 'SYSTEM_ADMIN';

export type TicketStatus = 'DRAFT' | 'PROCESS' | 'DELEGASI' | 'SELESAI';

export type DelegationType = 'DELEGASI_VENDOR' | 'DELEGASI_TEKNISI';

export type AttachmentStage = 'REQUEST' | 'IN_PROGRESS' | 'DELEGATION' | 'COMPLETION';

export type AttachmentVisibility = 'USER_VISIBLE' | 'INTERNAL_ONLY';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export interface Attachment {
  id: string;
  stage: AttachmentStage;
  visibility: AttachmentVisibility;
  file_name: string;
  file_size?: string;
  file_url?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface Worklog {
  id: string;
  stageKey?: string;
  worker_id: string;
  worker_name: string;
  date: string;
  start_at: string;
  finish_at: string;
  duration_minutes: number;
  description: string;
  created_at: string;
}

export interface TicketComment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  created_at: string;
}

export interface InternalNote {
  id: string;
  author_id: string;
  author_name: string;
  note: string;
  created_at: string;
}

export interface DelegationInfo {
  type: DelegationType;
  vendor_id?: string;
  vendor_name?: string;
  technician_id?: string;
  technician_name?: string;
  reference_no?: string;
  notes?: string;
  delegated_at: string;
  returned_at?: string;
  returned_notes?: string;
}

export interface AuditLog {
  id: string;
  ticket_id?: string;
  action: string;
  performed_at: string;
  performed_by: string;
  performed_by_name: string;
  detail?: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: string;
  priority: TicketPriority;
  status: TicketStatus;

  created_by: string;
  created_by_name: string;
  created_by_dept: string;
  created_by_admin_id?: string | null;
  created_by_admin_name?: string | null;

  requestedBy: string;
  requestedByName: string;
  requestedByDept: string;

  assignedTo?: string | null;
  assignedToName?: string | null;

  supporting_members: string[];
  supporting_member_details?: { id: string; name: string }[];

  delegation?: DelegationInfo | null;

  referenced_ticket_id?: string | null;

  attachments: Attachment[];
  worklogs: Worklog[];
  comments: TicketComment[];
  internal_notes: InternalNote[];
  audit_logs: AuditLog[];

  created_at: string;
  ticket_number?: string;
  issued_at?: string | null;
  process_started_at?: string | null;
  completed_at?: string | null;
  resolution_summary?: string | null;
  confirmed_by_user?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface SubcategoryItem {
  id: string;
  category_id: string;
  name: string;
}

export interface VendorItem {
  id: string;
  name: string;
  service_type: string;
  contact_person: string;
  phone: string;
}

export interface TechnicianItem {
  id: string;
  name: string;
  specialty: string;
  phone: string;
}
