import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { tickets, ticketMembers, users, auditLogs } from '~/server/database/schema';
import { serializeTicketMember } from '~/server/utils/serialize';
import { createNotification } from '~/server/utils/notifications';
import { type Actor, type DbExec, isIT, isITRole, fail, inTx, lockTicket, newId, nowTs, parse, ticketSummary } from './common';
import { canAddMembers, canAssign, canTargetOther, notWorkPhaseMsg } from './permissions';

async function requireITUser(tx: DbExec, userId: string) {
  const u = (await tx.select().from(users).where(eq(users.id, userId)))[0];
  if (!u) fail(400, `Pengguna ${userId} tidak ditemukan`);
  if (!isITRole(u.role)) fail(400, `Pengguna ${userId} bukan anggota tim IT`);
  return u;
}

// Satu assignee, hanya di fase Dikerjakan. Worker mengambil untuk dirinya (hanya bila belum ada Pelaksana); PM menugaskan worker lain.
export async function assignTicket(actor: Actor, input: { ticketId: string; userId?: string }, exec?: DbExec) {
  const userId = parse(z.string().min(1), input.userId ?? actor.id);
  return inTx(exec, async (tx) => {
    const ticket = await lockTicket(tx, input.ticketId);
    if (!canAssign(ticket, actor)) {
      fail(isIT(actor) ? 409 : 403, isIT(actor) ? notWorkPhaseMsg(ticket) : 'Forbidden: butuh klaim it.access (tim IT)');
    }
    if (userId !== actor.id && !canTargetOther(actor)) fail(403, 'Forbidden: hanya PM yang dapat menugaskan worker lain');
    if (userId === actor.id && !canTargetOther(actor) && ticket.assignedTo && ticket.assignedTo !== actor.id) {
      fail(409, 'Tiket sudah diambil worker lain; minta PM menugaskan ulang');
    }
    const target = await requireITUser(tx, userId);

    await tx.update(tickets).set({ assignedTo: userId }).where(eq(tickets.id, input.ticketId));
    await tx.insert(auditLogs).values({
      id: newId('AUD'),
      ticketId: input.ticketId,
      action: 'TIKET_DITUGASKAN',
      performedAt: nowTs(),
      performedBy: actor.id,
      detail: `Ditugaskan ke ${target.name}`,
    });
    if (userId !== actor.id) {
      await createNotification({
        userId,
        ticketId: input.ticketId,
        type: 'ASSIGNED',
        title: 'Tiket Ditugaskan',
        message: `Anda ditugaskan untuk menangani tiket ${ticket.ticketNumber || ticket.id}: ${ticket.title}`,
      }, tx);
    }
    return { ticket: await ticketSummary(tx, input.ticketId), assigned_to_name: target.name };
  });
}

// Member pendukung, hanya di fase Dikerjakan. Worker menambah dirinya; menambah orang lain hanya PM. Yang sudah member dilewati (idempoten).
export async function addMembers(actor: Actor, input: { ticketId: string; userIds: string[] }, exec?: DbExec) {
  const userIds = [...new Set(parse(z.array(z.string().min(1)).min(1, 'userIds wajib diisi').max(20), input.userIds))];
  return inTx(exec, async (tx) => {
    const ticket = await lockTicket(tx, input.ticketId);
    if (!canAddMembers(ticket, actor)) {
      fail(isIT(actor) ? 409 : 403, isIT(actor) ? notWorkPhaseMsg(ticket) : 'Forbidden: butuh klaim it.access (tim IT)');
    }
    if (userIds.some(uid => uid !== actor.id) && !canTargetOther(actor)) fail(403, 'Forbidden: hanya PM yang dapat menambah worker lain');
    const current = await tx.select().from(ticketMembers).where(eq(ticketMembers.ticketId, input.ticketId));
    const have = new Set(current.map(m => m.userId));

    const added = [];
    const skipped: string[] = [];
    for (const uid of userIds) {
      const u = await requireITUser(tx, uid);
      if (have.has(uid)) { skipped.push(uid); continue; }
      const row = { id: newId('TM'), ticketId: input.ticketId, userId: uid, createdAt: nowTs() };
      await tx.insert(ticketMembers).values(row);
      added.push(serializeTicketMember({ ...row, userName: u.name }));
    }
    return { added, already_member: skipped };
  });
}
