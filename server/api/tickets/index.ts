import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { generateTicketId, generateTicketNumber } from '~/server/utils/ticket-id';

function now(): string {
  return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    let results;

    if (query.status || query.search) {
      results = await db.query.tickets.findMany({
        where: (t, { eq: e, or: o, like: l, and: a }: any) => {
          const conditions: any[] = [];
          if (query.status) conditions.push(e(t.status, query.status as string));
          if (query.search) conditions.push(o(l(t.id, `%${query.search}%`), l(t.title, `%${query.search}%`)));
          return conditions.length === 1 ? conditions[0] : a(...conditions);
        },
      });
    } else {
      results = await db.query.tickets.findMany();
    }

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
      requestedBy = body.behalfUserId;
      requestedByName = body.requestedByName || body.behalfUserId;
      requestedByDept = body.requestedByDept || '';
      createdByAdminId = userId;
      createdByAdminName = userId;
    }

    const auditLogs: any[] = [
      {
        id: `AUD-${Date.now()}`,
        action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
        performed_at: ts,
        performed_by: userId,
        performed_by_name: userId,
      },
      ...(body.behalfUserId ? [{
        id: `AUD-${Date.now() + 1}`,
        action: 'DIBUAT_ATAS_NAMA',
        detail: `Dibuat oleh ${userId} atas nama ${requestedByName}`,
        performed_at: ts,
        performed_by: userId,
        performed_by_name: userId,
      }] : []),
    ];

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
      primaryWorkerId: null,
      primaryWorkerName: null,
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
      worklogs: [],
      comments: [],
      internalNotes: [],
      auditLogs,
      createdAt: ts,
      ticketNumber,
      issuedAt: shouldIssue ? ts : null,
      processStartedAt: null,
      completedAt: null,
      resolutionSummary: null,
      confirmedByUser: 0,
    }).execute();

    const result = await db.query.tickets.findFirst({
      where: (t, { eq: e }) => e(t.id, newId),
    });

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
