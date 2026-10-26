import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, comments, mcpIdempotency, mcpTokens, tickets, worklogs, attachments, ticketMembers } from '~/server/database/schema';
import { getTicketById } from '~/server/utils/tickets';
import { authenticateMcp, createMcpToken, revokeMcpToken } from '~/server/services/ticketing/mcp-auth';
import { TOOL_KINDS } from '~/server/mcp/server';
import { ADMIN, IT_A, IT_B, OTHER_REQ, REQ, as, closeAll, seedTicket, seedUsers } from './helpers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

beforeAll(seedUsers);
afterAll(closeAll);

const countWorklogs = async (id: string) => (await db.select().from(worklogs).where(eq(worklogs.ticketId, id))).length;
const statusOf = async (id: string) => (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!.status;

describe('1. read tickets', () => {
  it('worker reads assigned/own tickets and detail', async () => {
    const id = await seedTicket({ assignedTo: IT_A.id, activities: ['a1', 'a2'] });
    const w = await as(IT_A);
    const mine = await w.call('list_my_tickets');
    expect(mine.data.tickets.map((t: any) => t.id)).toContain(id);
    const detail = await w.call('get_ticket', { ticketId: id });
    expect(detail.isError).toBe(false);
    expect(detail.data.worklogs).toHaveLength(2);
    const found = await w.call('search_tickets', { q: id });
    expect(found.data.tickets[0].id).toBe(id);
  });
});

describe('2-5. repeated activities on one ticket', () => {
  it('appends 1st, 2nd, 3rd activity; earlier ones kept, order correct, re-readable', async () => {
    const id = await seedTicket({ status: 'PROCESS', activities: ['sebelumnya-1', 'sebelumnya-2'] });
    const w = await as(IT_A);

    for (const d of ['aktivitas ke-3', 'aktivitas ke-4', 'aktivitas ke-5']) {
      const r = await w.call('add_ticket_activity', { ticketId: id, description: d });
      expect(r.isError).toBe(false);
      expect(r.data.activity.worker_id).toBe(IT_A.id);
      expect(r.data.ticket.status).toBe('PROCESS');
    }

    const list = await w.call('list_ticket_activities', { ticketId: id });
    expect(list.data.activities.map((a: any) => a.description)).toEqual([
      'sebelumnya-1', 'sebelumnya-2', 'aktivitas ke-3', 'aktivitas ke-4', 'aktivitas ke-5',
    ]);
    expect(new Set(list.data.activities.map((a: any) => a.id)).size).toBe(5);
    expect(await statusOf(id)).toBe('PROCESS');
  });

  it('rejects stage not available for the status and empty content', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const w = await as(IT_A);
    const bad = await w.call('add_ticket_activity', { ticketId: id, description: 'x', stageKey: 'COMPLETION' });
    expect(bad.isError).toBe(true);
    expect(bad.data.allowed_stages).toContain('IN_PROGRESS');
    expect((await w.call('add_ticket_activity', { ticketId: id, description: '   ' })).isError).toBe(true);
    expect(await countWorklogs(id)).toBe(0);
  });
});

describe('6. comments', () => {
  it('adds comment as separate entity from activity and keeps history', async () => {
    const id = await seedTicket({ assignedTo: IT_A.id });
    const w = await as(IT_A);
    await w.call('add_comment', { ticketId: id, message: 'satu' });
    await w.call('add_comment', { ticketId: id, message: 'dua' });
    const list = await w.call('list_ticket_comments', { ticketId: id });
    expect(list.data.comments.map((c: any) => c.message)).toEqual(['satu', 'dua']);
    expect(list.data.comments[0].user_id).toBe(IT_A.id);
    expect(await countWorklogs(id)).toBe(0);
    expect((await w.call('add_comment', { ticketId: id, message: 'x'.repeat(2001) })).isError).toBe(true);
  });

  it('internal notes are IT-only; requester sees comments of own ticket only', async () => {
    const id = await seedTicket({ requester: REQ });
    const it = await as(IT_A);
    expect((await it.call('add_internal_note', { ticketId: id, note: 'rahasia' })).isError).toBe(false);
    const req = await as(REQ);
    expect((await req.call('list_internal_notes', { ticketId: id })).isError).toBe(true);
    expect((await req.call('add_internal_note', { ticketId: id, note: 'x' })).isError).toBe(true);
    expect((await req.call('add_comment', { ticketId: id, message: 'halo' })).isError).toBe(false);
    const other = await as(OTHER_REQ);
    expect((await other.call('add_comment', { ticketId: id, message: 'intip' })).data.status).toBe(403);
    expect((await other.call('get_ticket', { ticketId: id })).data.status).toBe(403);
  });
});

describe('7-9. status transitions & completion rules', () => {
  it('walks DRAFT > PROCESS > SELESAI > PROCESS with audit, timestamps and worklog for notes', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const w = await as(IT_A);

    const start = await w.call('transition_ticket_status', { ticketId: id, to: 'PROCESS', notes: 'mulai' });
    expect(start.isError).toBe(false);
    expect(start.data.ticket.process_started_at).toBeTruthy();

    const done = await w.call('transition_ticket_status', { ticketId: id, to: 'SELESAI', notes: 'beres' });
    expect(done.data.ticket.status).toBe('SELESAI');
    expect(done.data.ticket.completed_at).toBeTruthy();

    const reopened = await w.call('reopen_ticket', { ticketId: id });
    expect(reopened.data.ticket.status).toBe('PROCESS');
    expect(reopened.data.ticket.completed_at).toBeNull();

    const actions = (await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).map(a => a.action);
    expect(actions).toEqual(expect.arrayContaining(['TAHAP_START_WORK_SELESAI', 'TAHAP_IN_PROGRESS_SELESAI', 'TIKET_DIBUKA_ULANG']));
    const logs = (await db.select().from(worklogs).where(eq(worklogs.ticketId, id))).map(l => l.description);
    expect(logs).toEqual(expect.arrayContaining(['mulai', 'beres']));
  });

  it('rejects invalid transition with current status and allowed targets', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const r = await (await as(IT_A)).call('transition_ticket_status', { ticketId: id, to: 'SELESAI' });
    expect(r.isError).toBe(true);
    expect(r.data.status).toBe(409);
    expect(r.data.current_status).toBe('DRAFT');
    expect(r.data.allowed_transitions).toEqual(['PROCESS']);
    expect(await statusOf(id)).toBe('DRAFT');
  });

  it('delegation requires its data and persists it; get_allowed_actions mirrors lifecycle', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const w = await as(IT_A);
    const allowed = await w.call('get_allowed_actions', { ticketId: id });
    expect(allowed.data.transitions.map((t: any) => t.to).sort()).toEqual(['DELEGASI', 'DRAFT', 'SELESAI']);

    expect((await w.call('transition_ticket_status', { ticketId: id, to: 'DELEGASI' })).isError).toBe(true);
    expect((await w.call('transition_ticket_status', { ticketId: id, to: 'DELEGASI', delegation: { type: 'DELEGASI_VENDOR' } })).isError).toBe(true);
    const ok = await w.call('transition_ticket_status', {
      ticketId: id, to: 'DELEGASI', delegation: { type: 'DELEGASI_VENDOR', vendor_name: 'PT Vendor', reference_no: 'REF-1' },
    });
    expect(ok.isError).toBe(false);
    const row = (await db.select().from(tickets).where(eq(tickets.id, id)))[0]!;
    expect(row).toMatchObject({ status: 'DELEGASI', delegationType: 'DELEGASI_VENDOR', vendorName: 'PT Vendor', referenceNo: 'REF-1' });
    expect(row.delegatedAt).toBeTruthy();
  });

  it('reopen only from SELESAI', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const r = await (await as(IT_A)).call('reopen_ticket', { ticketId: id });
    expect(r.isError).toBe(true);
    expect(r.data.status).toBe(409);
  });
});

describe('10. permissions', () => {
  it('requester cannot use any write/workflow tool', async () => {
    const id = await seedTicket({ status: 'PROCESS', requester: REQ });
    const req = await as(REQ);
    const calls: [string, Record<string, unknown>][] = [
      ['add_ticket_activity', { ticketId: id, description: 'x' }],
      ['log_work_time', { ticketId: id, description: 'x', start_at: '09:00', finish_at: '10:00' }],
      ['transition_ticket_status', { ticketId: id, to: 'SELESAI' }],
      ['reopen_ticket', { ticketId: id }],
      ['assign_ticket', { ticketId: id }],
      ['add_attachment', { ticketId: id, fileName: 'a.txt', contentBase64: 'aGk=' }],
      ['list_workers', {}],
    ];
    for (const [name, args] of calls) {
      const r = await req.call(name, args);
      expect([name, r.isError, r.data.status]).toEqual([name, true, 403]);
    }
    expect(await statusOf(id)).toBe('PROCESS');
    expect(await countWorklogs(id)).toBe(0);
  });

  it('assignment: worker self-assigns only; admin may assign others; locked after SELESAI; target must be IT', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    expect((await a.call('assign_ticket', { ticketId: id, userId: IT_B.id })).data.status).toBe(403);
    expect((await a.call('assign_ticket', { ticketId: id })).data.ticket.assigned_to).toBe(IT_A.id);

    const admin = await as(ADMIN);
    expect((await admin.call('assign_ticket', { ticketId: id, userId: IT_B.id })).data.ticket.assigned_to).toBe(IT_B.id);
    expect((await admin.call('assign_ticket', { ticketId: id, userId: REQ.id })).isError).toBe(true);

    const done = await seedTicket({ status: 'SELESAI', assignedTo: IT_A.id });
    const locked = await a.call('assign_ticket', { ticketId: done });
    expect(locked.data.status).toBe(409);
  });

  it('members: add skips duplicates, blocked when SELESAI, non-IT target rejected', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const r1 = await a.call('add_ticket_members', { ticketId: id, userIds: [IT_A.id, IT_B.id] });
    expect(r1.data.added).toHaveLength(2);
    const r2 = await a.call('add_ticket_members', { ticketId: id, userIds: [IT_A.id] });
    expect(r2.data.added).toHaveLength(0);
    expect(r2.data.already_member).toEqual([IT_A.id]);
    expect((await a.call('add_ticket_members', { ticketId: id, userIds: [REQ.id] })).isError).toBe(true);
    const done = await seedTicket({ status: 'SELESAI' });
    expect((await a.call('add_ticket_members', { ticketId: done, userIds: [IT_A.id] })).data.status).toBe(409);
    expect(await db.select().from(ticketMembers).where(eq(ticketMembers.ticketId, id))).toHaveLength(2);
  });

  it('log_work_time rejects overlap, DRAFT, and bad ranges', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const base = { ticketId: id, description: 'kerja', date: '2026-10-05' };
    expect((await a.call('log_work_time', { ...base, start_at: '09:00', finish_at: '10:00' })).isError).toBe(false);
    expect((await a.call('log_work_time', { ...base, start_at: '09:30', finish_at: '10:30' })).isError).toBe(true);
    expect((await a.call('log_work_time', { ...base, start_at: '10:00', finish_at: '11:00' })).isError).toBe(false);
    expect((await a.call('log_work_time', { ...base, start_at: '12:00', finish_at: '11:00' })).isError).toBe(true);
    const draft = await seedTicket({ status: 'DRAFT' });
    expect((await a.call('log_work_time', { ticketId: draft, description: 'x', start_at: '09:00', finish_at: '10:00' })).data.status).toBe(409);
  });
});

describe('11. identity cannot be spoofed via parameters', () => {
  it('ignores author/worker params; stored identity is the authenticated actor', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const spoof = { workerId: IT_B.id, worker_id: IT_B.id, authorId: IT_B.id, userId: IT_B.id, createdBy: IT_B.id };

    const act = await a.client.callTool({ name: 'add_ticket_activity', arguments: { ticketId: id, description: 'spoof', ...spoof } });
    expect((act as any).isError).toBeFalsy();
    const cmt = await a.client.callTool({ name: 'add_comment', arguments: { ticketId: id, message: 'spoof', ...spoof } });
    expect((cmt as any).isError).toBeFalsy();
    const time = await a.client.callTool({ name: 'log_work_time', arguments: { ticketId: id, description: 's', start_at: '07:00', finish_at: '08:00', date: '2026-10-06', ...spoof } });
    expect((time as any).isError).toBeFalsy();

    const logs = await db.select().from(worklogs).where(eq(worklogs.ticketId, id));
    expect(logs).toHaveLength(2);
    expect(logs.every(l => l.workerId === IT_A.id)).toBe(true);
    const cm = await db.select().from(comments).where(eq(comments.ticketId, id));
    expect(cm[0]!.userId).toBe(IT_A.id);
  });

  it('no tool schema exposes an identity parameter', async () => {
    const { tools } = await (await as(IT_A)).client.listTools();
    for (const t of tools) {
      const props = Object.keys((t.inputSchema as any).properties ?? {});
      for (const forbidden of ['authorId', 'createdBy', 'workerId', 'worker_id', 'performedBy', 'uploadedBy']) {
        expect([t.name, props.includes(forbidden)]).toEqual([t.name, false]);
      }
    }
  });
});

describe('12. idempotent retry', () => {
  it('same key returns stored result without duplicating', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const args = { ticketId: id, description: 'sekali saja', idempotencyKey: `idem-act-${id}` };
    const r1 = await a.call('add_ticket_activity', args);
    const r2 = await a.call('add_ticket_activity', args);
    expect(r1.isError || r2.isError).toBe(false);
    expect(r2.data.idempotent_replay).toBe(true);
    expect(r2.data.activity.id).toBe(r1.data.activity.id);
    expect(await countWorklogs(id)).toBe(1);

    const c = { ticketId: id, message: 'sekali', idempotencyKey: `idem-cmt-${id}` };
    await a.call('add_comment', c); await a.call('add_comment', c); await a.call('add_comment', c);
    expect(await db.select().from(comments).where(eq(comments.ticketId, id))).toHaveLength(1);
  });

  it('same key on another tool is refused; keys are scoped per user', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const key = `idem-x-${id}`;
    await a.call('add_comment', { ticketId: id, message: 'm', idempotencyKey: key });
    expect((await a.call('add_ticket_activity', { ticketId: id, description: 'd', idempotencyKey: key })).data.status).toBe(409);
    expect((await (await as(IT_B)).call('add_ticket_activity', { ticketId: id, description: 'd', idempotencyKey: key })).isError).toBe(false);
  });

  it('concurrent transition with same key runs once', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const a = await as(IT_A);
    const args = { ticketId: id, to: 'PROCESS', idempotencyKey: `idem-tr-${id}` };
    const rs = await Promise.all([a.call('transition_ticket_status', args), a.call('transition_ticket_status', args)]);
    expect(rs.filter(r => !r.isError).length).toBeGreaterThanOrEqual(1);
    const audits = (await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).filter(x => x.action === 'TAHAP_START_WORK_SELESAI');
    expect(audits).toHaveLength(1);
  });
});

describe('13. failure leaves no partial state', () => {
  it('failed transition with attachment rolls back status, audit, worklog and cleans stored file', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const a = await as(IT_A);
    const r = await a.call('transition_ticket_status', { ticketId: id, to: 'SELESAI', notes: 'x' });
    expect(r.isError).toBe(true);
    expect(await statusOf(id)).toBe('DRAFT');
    expect(await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).toHaveLength(0);
    expect(await countWorklogs(id)).toBe(0);
  });

  it('failed delegation (unknown vendor) rolls back the whole transition', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const r = await (await as(IT_A)).call('transition_ticket_status', {
      ticketId: id, to: 'DELEGASI', notes: 'catatan', delegation: { type: 'DELEGASI_VENDOR', vendor_id: 'VND-NOPE' },
    });
    expect(r.isError).toBe(true);
    expect(await statusOf(id)).toBe('PROCESS');
    expect(await countWorklogs(id)).toBe(0);
    expect(await db.select().from(auditLogs).where(eq(auditLogs.ticketId, id))).toHaveLength(0);
  });

  it('failed write with idempotency key does not burn the key', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const a = await as(IT_A);
    const key = `idem-fail-${id}`;
    const bad = await a.call('transition_ticket_status', { ticketId: id, to: 'SELESAI', idempotencyKey: key });
    expect(bad.isError).toBe(true);
    expect(await db.select().from(mcpIdempotency).where(eq(mcpIdempotency.idemKey, key))).toHaveLength(0);
    const good = await a.call('transition_ticket_status', { ticketId: id, to: 'PROCESS', idempotencyKey: key });
    expect(good.isError).toBe(false);
  });

  it('attachment stores file and row together; empty/oversize rejected', async () => {
    const id = await seedTicket({ status: 'PROCESS' });
    const a = await as(IT_A);
    const ok = await a.call('add_attachment', { ticketId: id, fileName: 'bukti.txt', contentBase64: Buffer.from('isi').toString('base64'), stage: 'IN_PROGRESS', visibility: 'INTERNAL_ONLY' });
    expect(ok.isError).toBe(false);
    expect(ok.data.attachments[0]).toMatchObject({ file_name: 'bukti.txt', visibility: 'INTERNAL_ONLY', uploaded_by: IT_A.id });
    expect((await a.call('add_attachment', { ticketId: id, fileName: 'k.txt', contentBase64: '=' })).isError).toBe(true);
    expect(await db.select().from(attachments).where(eq(attachments.ticketId, id))).toHaveLength(1);

    const req = await as(REQ);
    const seen = await a.call('list_ticket_attachments', { ticketId: id });
    expect(seen.data.count).toBe(1);
    const asReq = await req.call('list_ticket_attachments', { ticketId: await seedTicket({ requester: REQ }) });
    expect(asReq.data.count).toBe(0);
  });
});

describe('14. UI sees the same data', () => {
  it('getTicketById (used by web UI) reflects MCP writes in worklogs, audit and status', async () => {
    const id = await seedTicket({ status: 'DRAFT' });
    const a = await as(IT_A);
    await a.call('transition_ticket_status', { ticketId: id, to: 'PROCESS' });
    await a.call('add_ticket_activity', { ticketId: id, description: 'kerja 1' });
    await a.call('add_ticket_activity', { ticketId: id, description: 'kerja 2' });
    await a.call('transition_ticket_status', { ticketId: id, to: 'SELESAI', notes: 'tuntas' });

    const ui: any = await getTicketById(id);
    expect(ui!.status).toBe('SELESAI');
    expect(ui!.worklogs.map((w: any) => w.description)).toEqual(expect.arrayContaining(['kerja 1', 'kerja 2', 'tuntas']));
    expect(ui!.worklogs.find((w: any) => w.description === 'kerja 1')!.worker_name).toBe(IT_A.name);
    expect(ui!.audit_logs.map((l: any) => l.action)).toContain('TAHAP_IN_PROGRESS_SELESAI');

    const viaTool = await a.call('get_ticket', { ticketId: id });
    expect(viaTool.data.worklogs.map((w: any) => w.id).sort()).toEqual(ui!.worklogs.map((w: any) => w.id).sort());
  });
});

describe('15. exposed tools match the capability matrix', () => {
  it('registered tools == matrix in docs/mcp-report.md, each with a category', async () => {
    const { tools } = await (await as(IT_A)).client.listTools();
    const names = tools.map(t => t.name).sort();
    expect(names).toEqual(Object.keys(TOOL_KINDS).sort());

    const doc = readFileSync(resolve(process.cwd(), 'docs/mcp-report.md'), 'utf8');
    const documented = [...doc.matchAll(/`([a-z_]+)`/g)].map(m => m[1]);
    for (const n of names) expect([n, documented.includes(n)]).toEqual([n, true]);

    for (const banned of ['execute_sql', 'update_any_table', 'run_arbitrary_action']) expect(names).not.toContain(banned);
  });

  it('every write tool accepts an idempotencyKey', async () => {
    const { tools } = await (await as(IT_A)).client.listTools();
    for (const t of tools.filter(t => t.annotations?.readOnlyHint === false)) {
      expect([t.name, 'idempotencyKey' in ((t.inputSchema as any).properties ?? {})]).toEqual([t.name, true]);
    }
  });
});

describe('token auth', () => {
  it('resolves actor from DB by token hash; revoked and unknown tokens rejected; role is live', async () => {
    const { id, token } = await createMcpToken(IT_A.id, 'test');
    expect(await authenticateMcp(`Bearer ${token}`)).toEqual(IT_A);
    expect(await authenticateMcp('Bearer itk_nope')).toBeNull();
    expect(await authenticateMcp(undefined)).toBeNull();
    const stored = (await db.select().from(mcpTokens).where(eq(mcpTokens.id, id)))[0]!;
    expect(stored.tokenHash).not.toContain(token);
    expect(stored.lastUsedAt).toBeTruthy();
    await revokeMcpToken(id);
    expect(await authenticateMcp(`Bearer ${token}`)).toBeNull();
  });
});
