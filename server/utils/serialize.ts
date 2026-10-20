// Serializer: Drizzle result → Frontend snake_case
// Includes name resolution via JOINs to users table
// (Identitas user/company/division di-resolve lewat server/utils/org.ts)

export function serializeCategory(c: any) {
  return { id: c.id, name: c.name };
}

export function serializeProjectKendala(s: any) {
  return { id: s.id, category_id: s.categoryId, name: s.name };
}

export function serializeSubmodule(s: any) {
  return { id: s.id, project_kendala_id: s.projectKendalaId, name: s.name };
}

export function serializeTicketMember(m: any) {
  return {
    id: m.id,
    user_id: m.userId,
    user_name: m.userName || m.user?.name || '',
    created_at: m.createdAt,
  };
}

export function serializeWorklog(w: any) {
  return {
    id: w.id,
    stageKey: w.stageKey,
    worker_id: w.workerId,
    worker_name: w.workerName || w.worker?.name || '',
    date: w.date,
    start_at: w.startAt,
    finish_at: w.finishAt,
    duration_minutes: w.durationMinutes,
    description: w.description,
    created_at: w.createdAt,
  };
}

export function serializeAuditLog(a: any) {
  return {
    id: a.id,
    ticket_id: a.ticketId,
    action: a.action,
    performed_at: a.performedAt,
    performed_by: a.performedBy,
    performed_by_name: a.performedByName || a.actor?.name || '',
    detail: a.detail ?? null,
    notes: a.notes ?? null,
  };
}

export function serializeAttachment(a: any) {
  return {
    id: a.id,
    ticket_id: a.ticketId,
    stage: a.stage,
    visibility: a.visibility,
    file_name: a.fileName,
    file_size: a.fileSize ?? null,
    file_path: a.filePath ?? null,
    uploaded_by: a.uploadedBy,
    uploaded_by_name: a.uploadedByName || a.uploader?.name || '',
    uploaded_at: a.uploadedAt,
  };
}

export function serializeTicket(t: any) {
  let delegation = null;
  if (t.delegationType) {
    delegation = {
      type: t.delegationType,
      vendor_id: t.vendorId ?? null,
      vendor_name: t.vendorName ?? null,
      technician_id: t.technicianId ?? null,
      technician_name: t.technicianName ?? null,
      reference_no: t.referenceNo ?? null,
      notes: t.delegationNotes ?? null,
      delegated_at: t.delegatedAt ?? null,
      returned_at: t.returnedAt ?? null,
      returned_notes: t.returnedNotes ?? null,
    };
  }

  let supporting_members = t.supportingMembers;
  if (typeof supporting_members === 'string') {
    try { supporting_members = JSON.parse(supporting_members); } catch { supporting_members = []; }
  }

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    project_kendala: t.projectKendala ?? '',
    submodule: t.submodule ?? '',
    location: t.location,
    priority: t.priority,
    status: t.status,

    created_by: t.createdBy,
    created_by_name: t.creator?.name || t.createdByName || '',
    created_by_dept: t.createdByDept,
    created_by_company: t.creator?.companyName || '',
    created_by_division: t.creator?.divisionName || '',
    created_by_admin_id: t.createdByAdminId ?? null,
    created_by_admin_name: t.createdByAdminName ?? null,

    requestedBy: t.requestedBy,
    requestedByName: t.requester?.name || t.requestedByName || '',
    requestedByDept: t.requestedByDept,
    requested_by_company: t.requester?.companyName || '',
    requested_by_division: t.requester?.divisionName || '',

    assignedTo: t.assignedTo ?? null,
    assignedToName: t.assignee?.name || t.assignedToName || '',

    members: (t.members || []).map(serializeTicketMember),

    delegation,

    referenced_ticket_id: t.referencedTicketId ?? null,

    attachments: (t.attachments || []).map(serializeAttachment),
    worklogs: (t.worklogs || []).map(serializeWorklog),
    audit_logs: (t.auditLogs || []).map(serializeAuditLog),

    created_at: t.createdAt,
    ticket_number: t.ticketNumber ?? null,
    issued_at: t.issuedAt ?? null,
    process_started_at: t.processStartedAt ?? null,
    completed_at: t.completedAt ?? null,
  };
}

export function serializeComment(c: any) {
  return {
    id: c.id,
    ticket_id: c.ticketId,
    user_id: c.userId,
    user_name: c.userName || c.author?.name || '',
    user_role: c.userRole,
    message: c.message,
    created_at: c.createdAt,
  };
}

export function serializeInternalNote(n: any) {
  return {
    id: n.id,
    ticket_id: n.ticketId,
    author_id: n.authorId,
    author_name: n.authorName || n.author?.name || '',
    note: n.note,
    created_at: n.createdAt,
  };
}

// Batch serializers
export function serializeTickets(list: any[]) { return list.map(serializeTicket); }
export function serializeProjectKendalas(list: any[]) { return list.map(serializeProjectKendala); }
export function serializeSubmodules(list: any[]) { return list.map(serializeSubmodule); }
export function serializeCategories(list: any[]) { return list.map(serializeCategory); }
export function serializeTicketMembers(list: any[]) { return list.map(serializeTicketMember); }
