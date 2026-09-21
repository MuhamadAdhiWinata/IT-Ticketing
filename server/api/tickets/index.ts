import { eq, and, or, like } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { generateTicketId, generateTicketNumber } from '~/server/utils/ticket-id';
import { getTicketsWithRelations, getTicketById } from '~/server/utils/tickets';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);

    const results = await getTicketsWithRelations((t, { eq: e, or: o, like: l, and: a }: any) => {
      const conditions: any[] = [];
      if (query.status) conditions.push(e(t.status, query.status as string));
      if (query.search) conditions.push(o(l(t.id, `%${query.search}%`), l(t.title, `%${query.search}%`)));
      return conditions.length === 0 ? undefined : (conditions.length === 1 ? conditions[0] : a(...conditions));
    });

    return successResponse(results);
  }

  if (method === 'POST') {
    const userId = getHeader(event, 'X-User-Id') || 'UNKNOWN';
    const body = await readBody(event);
    const ts = now();

    const newId = generateTicketId();
    const ticketNumber = generateTicketNumber(body.category || 'Support IT');

    const shouldIssue = body.shouldIssue !== false;

    let requestedBy = userId;
    let requestedByName = body.requestedByName || userId;
    let requestedByDept = body.requestedByDept || '';
    let createdByAdminId: string | null = null;
    let createdByAdminName: string | null = null;

    if (body.behalfUserId) {
      const { db } = await import('~/server/database/client');
      const behalfUser = await db.query.users.findFirst({
        where: (u, { eq: e }) => e(u.id, body.behalfUserId),
      });
      if (behalfUser) {
        requestedBy = behalfUser.id;
        requestedByName = behalfUser.name;
        requestedByDept = behalfUser.department;
        createdByAdminId = userId;
        createdByAdminName = userId;
      }
    }

    await db.insert(tickets).values({
      id: newId,
      title: body.title || '',
      description: body.description || '',
      category: body.category || 'Support IT',
      subcategory: body.subcategory || 'General',
      location: body.location || 'Lantai 1',
      priority: body.priority || 'MEDIUM',
      status: shouldIssue ? 'PROCESS' : 'DRAFT',
      createdBy: userId,
      createdByName: userId,
      createdByDept: '',
      createdByAdminId,
      createdByAdminName,
      requestedBy,
      requestedByName,
      requestedByDept,
      assignedTo: null,
      assignedToName: null,
      supportingMembers: [],
      supportingMemberDetails: [],
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
      resolutionSummary: null,
      confirmedByUser: 0,
    }).execute();

    // Insert initial audit log
    const { auditLogs } = await import('~/server/database/schema');
    await db.insert(auditLogs).values({
      id: `AUD-${Date.now()}`,
      ticketId: newId,
      action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
      performedAt: ts,
      performedBy: userId,
      performedByName: userId,
    }).execute();

    if (body.behalfUserId) {
      await db.insert(auditLogs).values({
        id: `AUD-${Date.now() + 1}`,
        ticketId: newId,
        action: 'DIBUAT_ATAS_NAMA',
        detail: `Dibuat oleh ${userId} atas nama ${requestedByName}`,
        performedAt: ts,
        performedBy: userId,
        performedByName: userId,
      }).execute();
    }

    const result = await getTicketById(newId);

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});