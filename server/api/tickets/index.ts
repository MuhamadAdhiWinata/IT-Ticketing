import { eq, and, or, like } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { tickets } from '~/server/database/schema';
import { successResponse } from '~/server/utils/response';
import { generateTicketId, generateTicketNumber } from '~/server/utils/ticket-id';
import { getTicketsWithRelations, getTicketById } from '~/server/utils/tickets';
import { getCurrentUserId, getCurrentUser } from '~/server/utils/user-context';
import { CreateTicketSchema, validate } from '~/server/utils/validate';

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

    let requestedBy = userId;
    let requestedByName = user?.name || body.requestedByName || userId;
    let requestedByDept = user?.department || body.requestedByDept || '';
    let createdByAdminId: string | null = null;
    let createdByAdminName: string | null = null;

    if (body.behalfUserId && user?.role === 'SYSTEM_ADMIN') {
      const behalfUser = await db.query.users.findFirst({
        where: (u, { eq: e }) => e(u.id, body.behalfUserId),
      });
      if (behalfUser) {
        requestedBy = behalfUser.id;
        requestedByName = behalfUser.name;
        requestedByDept = behalfUser.department;
        createdByAdminId = userId;
        createdByAdminName = user?.name || userId;
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
      createdByName: requestedByName,
      createdByDept: requestedByDept,
      createdByAdminId,
      createdByAdminName,
      requestedBy,
      requestedByName,
      requestedByDept,
      assignedTo: null,
      assignedToName: null,
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

    const { auditLogs } = await import('~/server/database/schema');
    await db.insert(auditLogs).values({
      id: `AUD-${Date.now()}`,
      ticketId: newId,
      action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
      performedAt: ts,
      performedBy: userId,
      performedByName: requestedByName,
    }).execute();

    if (body.behalfUserId && user?.role === 'SYSTEM_ADMIN') {
      await db.insert(auditLogs).values({
        id: `AUD-${Date.now() + 1}`,
        ticketId: newId,
        action: 'DIBUAT_ATAS_NAMA',
        detail: `Dibuat oleh ${user?.name || userId} atas nama ${requestedByName}`,
        performedAt: ts,
        performedBy: userId,
        performedByName: user?.name || userId,
      }).execute();
    }

    const result = await getTicketById(newId);

    return successResponse(result);
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});