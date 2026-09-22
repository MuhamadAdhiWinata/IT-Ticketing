// Serializer: Drizzle camelCase → Frontend snake_case (types/index.ts)

export function serializeUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    avatarUrl: u.avatarUrl ?? null,
  };
}

export function serializeCategory(c: any) {
  return { id: c.id, name: c.name };
}

export function serializeSubcategory(s: any) {
  return { id: s.id, category_id: s.categoryId, name: s.name };
}

export function serializeVendor(v: any) {
  return {
    id: v.id,
    name: v.name,
    service_type: v.serviceType,
    contact_person: v.contactPerson,
    phone: v.phone,
  };
}

export function serializeTechnician(t: any) {
  return { id: t.id, name: t.name, specialty: t.specialty, phone: t.phone };
}

export function serializeTicketMember(m: any) {
  return {
    id: m.id,
    user_id: m.userId,
    user_name: m.userName,
    created_at: m.createdAt,
  };
}

export function serializeWorklog(w: any) {
  return {
    id: w.id,
    stageKey: w.stageKey,
    worker_id: w.workerId,
    worker_name: w.workerName,
    date: w.date,
    start_at: w.startAt,
    finish_at: w.finishAt,
    duration_minutes: w.durationMinutes,
    description: w.description,
    created_at: w.createdAt,
  };
}

export function serializeComment(c: any) {
  return {
    id: c.id,
    ticket_id: c.ticketId,
    user_id: c.userId,
    user_name: c.userName,
    user_role: c.userRole,
    message: c.message,
    created_at: c.createdAt,
  };
}

export function serializeNote(n: any) {
  return {
    id: n.id,
    ticket_id: n.ticketId,
    author_id: n.authorId,
    author_name: n.authorName,
    note: n.note,
    created_at: n.createdAt,
  };
}

export function serializeAuditLog(a: any) {
  return {
    id: a.id,
    ticket_id: a.ticketId,
    action: a.action,
    performed_at: a.performedAt,
    performed_by: a.performedBy,
    performed_by_name: a.performedByName,
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
    uploaded_by_name: a.uploadedByName,
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

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    subcategory: t.subcategory,
    location: t.location,
    priority: t.priority,
    status: t.status,

    created_by: t.createdBy,
    created_by_name: t.createdByName,
    created_by_dept: t.createdByDept,
    created_by_admin_id: t.createdByAdminId ?? null,
    created_by_admin_name: t.createdByAdminName ?? null,

    requestedBy: t.requestedBy,
    requestedByName: t.requestedByName,
    requestedByDept: t.requestedByDept,

    assignedTo: t.assignedTo ?? null,
    assignedToName: t.assignedToName ?? null,

    members: (t.members || []).map(serializeTicketMember),

    delegation,

    referenced_ticket_id: t.referencedTicketId ?? null,

    attachments: (t.attachments || []).map(serializeAttachment),
    worklogs: (t.worklogs || []).map(serializeWorklog),
    comments: (t.comments || []).map(serializeComment),
    internal_notes: (t.internal_notes || []).map(serializeNote),
    audit_logs: (t.auditLogs || []).map(serializeAuditLog),

    created_at: t.createdAt,
    ticket_number: t.ticketNumber ?? null,
    issued_at: t.issuedAt ?? null,
    process_started_at: t.processStartedAt ?? null,
    completed_at: t.completedAt ?? null,
    resolution_summary: t.resolutionSummary ?? null,
    confirmed_by_user: t.confirmedByUser ?? 0,
  };
}

// Batch serializers
export function serializeTickets(ticketsList: any[]) {
  return ticketsList.map(serializeTicket);
}

export function serializeSubcategories(subs: any[]) {
  return subs.map(serializeSubcategory);
}

export function serializeVendors(vendors: any[]) {
  return vendors.map(serializeVendor);
}

export function serializeUsers(users: any[]) {
  return users.map(serializeUser);
}
