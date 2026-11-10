import { eq, and, or, like } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets, files } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { generateTicketId, generateTicketNumber } from '~/server/utils/ticket-id';
import { getTicketsWithRelations, getTicketById } from '~/server/utils/tickets';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { CreateTicketSchema, validate } from '~/server/utils/validate';
import { isIntakeRole } from '~/utils/roles';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    // Sengaja tanpa filter per user: halaman utama menampilkan semua pekerjaan IT ke semua role.
    const results = await getTicketsWithRelations((t: any, { eq: e, or: o, like: l, and: a }: any) => {
      const conditions: any[] = [];
      if (query.status) conditions.push(e(t.status, query.status as string));
      if (query.search) conditions.push(o(l(t.id, `%${query.search}%`), l(t.title, `%${query.search}%`)));
      return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
    });

    return successResponse(results);
  }

  if (method === 'POST') {
    const user = getCurrentUser(event);
    const userId = getCurrentUserId(event);
    const body = await readBody(event);

    const v = validate(CreateTicketSchema, body);
    if (!v.success) {
      throw createError({ statusCode: 400, statusMessage: v.error });
    }

    const ts = now();

    const newId = generateTicketId();
    const ticketNumber = generateTicketNumber(body.category || 'Support IT');

    const shouldIssue = body.shouldIssue !== false;

    // Backend validation: CRITICAL requires attachment count > 0 when issuing
    if (body.priority === 'CRITICAL' && shouldIssue && (!body.attachmentCount || body.attachmentCount === 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ticket CRITICAL membutuhkan minimal 1 lampiran dokumen pendukung.',
      });
    }

    const intake = isIntakeRole(user?.role);
    let requestedBy = userId;
    let requestedByName = user?.name || body.requestedByName || userId;
    let requestedByDept = user?.department || body.requestedByDept || '';
    let requesterUnit: string | null = user?.unit ?? null;
    let createdByAdminId: string | null = null;
    const onBehalf = !!body.behalfUserId && intake;

    if (onBehalf) {
      const behalfUser = await db.query.users.findFirst({
        where: (u, { eq: e }) => e(u.id, body.behalfUserId),
      });
      if (behalfUser) {
        requestedBy = behalfUser.id;
        requestedByName = behalfUser.name;
        requestedByDept = behalfUser.department;
        requesterUnit = behalfUser.unit ?? null;
        createdByAdminId = userId;
      }
    }

    const unit = requesterUnit || v.data.unit;
    if (!unit) {
      throw createError({ statusCode: 400, statusMessage: 'Unit akun belum diatur; pilih Unit (LNY/IIE/REN/Holding)' });
    }
    // Kanal Asal hanya untuk PM/Duty Engineer; pemohon biasa selalu FORM.
    const channel = intake ? (v.data.channel || 'FORM') : 'FORM';

    await db.insert(tickets).values({
      id: newId,
      title: v.data.title,
      description: v.data.description,
      category: body.category || 'Support IT',
      projectKendala: body.project_kendala || '',
      submodule: body.submodule || null,
      location: body.location?.trim() || (body.category === 'IT Programmer' ? '' : 'Lantai 1'),
      priority: body.priority || 'MEDIUM',
      status: 'DRAFT',
      unit,
      expectedBehavior: v.data.expected_behavior,
      sinceAt: v.data.since_at.replace('T', ' ').slice(0, 19),
      affectedScope: v.data.affected_scope,
      workStatus: v.data.work_status,
      workaround: v.data.work_status === 'TERGANGGU' ? v.data.workaround?.trim() || null : null,
      isEvent: v.data.is_event ? 1 : 0,
      evidenceSteps: v.data.evidence_steps?.trim() || null,
      channel,
      createdBy: userId,
      createdByDept: requestedByDept,
      createdByAdminId,
      requestedBy,
      requestedByDept,
      assignedTo: null,
      delegationType: null,
      vendorId: null,
      vendorName: null,
      technicianId: null,
      technicianName: null,
      referenceNo: null,
      delegationNotes: null,
      delegatedAt: null,
      returnedAt: null,
      returnedNotes: null,
      referencedTicketId: null,
      createdAt: ts,
      ticketNumber,
      issuedAt: shouldIssue ? ts : null,
      processStartedAt: null,
      completedAt: null,
    }).execute();

    const { auditLogs } = await import('~/server/database/schema');
    await db.insert(auditLogs).values({
      id: `AUD-${Date.now()}`,
      ticketId: newId,
      action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
      performedAt: ts,
      performedBy: userId,
    }).execute();

    if (createdByAdminId) {
      await db.insert(auditLogs).values({
        id: `AUD-${Date.now() + 1}`,
        ticketId: newId,
        action: 'DIBUAT_ATAS_NAMA',
        detail: `Dibuat oleh ${user?.name || userId} atas nama ${requestedByName}`,
        performedAt: ts,
        performedBy: userId,
      }).execute();
    }

    const result = await getTicketById(newId);

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});