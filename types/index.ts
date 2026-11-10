export type UserRole = 'USER_NON_IT' | 'IT_WORKER' | 'SYSTEM_ADMIN' | 'PM' | 'DUTY_ENGINEER';

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
  companyId?: string | null;
  divisionId?: string | null;
  companyName?: string | null;
  divisionName?: string | null;
  avatarUrl?: string;
  unit?: string | null;
  isPic?: boolean;
}

export interface CompanyItem {
  id: string;
  name: string;
}

export interface DivisionItem {
  id: string;
  company_id: string;
  name: string;
}

export interface FileRecord {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size?: string | null;
  file_path?: string | null;
  uploaded_by: string;
  uploaded_at: string;
  visibility: AttachmentVisibility;
  stage?: string | null;
}

export interface Attachment {
  id: string;
  stage: AttachmentStage;
  visibility: AttachmentVisibility;
  file_name: string;
  file_size?: string;
  file_path?: string | null;
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
  files?: FileRecord[];
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

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  created_at: string;
  files?: FileRecord[];
}

export interface TicketInternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  project_kendala: string;
  submodule?: string | null;
  location: string;
  priority: TicketPriority;
  status: TicketStatus;

  created_by: string;
  created_by_name: string;
  created_by_dept: string;
  created_by_company?: string;
  created_by_division?: string;
  created_by_admin_id?: string | null;
  created_by_admin_name?: string | null;

  requestedBy: string;
  requestedByName: string;
  requestedByDept: string;
  requested_by_company?: string;
  requested_by_division?: string;

  assignedTo?: string | null;
  assignedToName?: string | null;

  members: { id: string; user_id: string; user_name: string; created_at: string }[];

  delegation?: DelegationInfo | null;

  referenced_ticket_id?: string | null;
  reopen_count?: number;
  solution_type?: string | null;
  resolution_summary?: string | null;
  odoo_task_url?: string | null;
  tech_debt_url?: string | null;
  acknowledged_at?: string | null;
  accepted_at?: string | null;

  unit?: string | null;
  expected_behavior?: string | null;
  since_at?: string | null;
  affected_scope?: string | null;
  work_status?: string | null;
  workaround?: string | null;
  is_event?: boolean;
  evidence_steps?: string | null;
  channel?: string;
  ticket_type?: string | null;
  impact?: string | null;
  urgency?: string | null;
  p_level?: 'P1' | 'P2' | 'P3' | 'P4' | null;
  change_reason?: string | null;
  catalog_item?: string | null;
  data_approval_note?: string | null;
  transfer_target?: string | null;
  duty_confirmed_by?: string | null;
  duty_confirmed_at?: string | null;
  waiting_started_at?: string | null;
  waiting_ended_at?: string | null;
  blocked_by?: string | null;
  closed_at?: string | null;
  status_label?: string;
  status_phase?: string;
  status_outcome?: 'Selesai' | 'Ditutup' | 'Dialihkan' | null;

  attachments: Attachment[];
  worklogs: Worklog[];
  audit_logs: AuditLog[];
  slaDeadline?: string | null;
  isSLABreached?: boolean;

  created_at: string;
  ticket_number?: string;
  issued_at?: string | null;
  process_started_at?: string | null;
  completed_at?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface PendingAttachment {
  file: File;
  preview?: string;
}

export interface ProjectKendalaItem {
  id: string;
  category_id: string;
  name: string;
}

export interface SubmoduleItem {
  id: string;
  project_kendala_id: string;
  name: string;
}

export interface IncomingTicket {
  id: string;
  title: string;
  status: TicketStatus;
  status_label?: string;
  priority: TicketPriority;
  category: string;
  requestedByName: string;
  requestedByDept: string;
  requested_by_company?: string;
  requested_by_division?: string;
  created_at: string;
}

export interface McpTokenItem {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  can_reveal: boolean;
}
