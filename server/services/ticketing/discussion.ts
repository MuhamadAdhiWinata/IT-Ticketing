import { comments, internalNotes } from '~/server/database/schema';
import { serializeComment, serializeInternalNote } from '~/server/utils/serialize';
import { createNotification } from '~/server/utils/notifications';
import { CommentSchema, NoteSchema } from '~/server/utils/validate';
import { type Actor, type DbExec, fail, inTx, lockTicket, newId, nowTs, parse, requireIT } from './common';
import { canViewTicket } from './permissions';

export async function addComment(actor: Actor, input: { ticketId: string; message: string }, exec?: DbExec) {
  const v = parse(CommentSchema, { message: input.message });
  return inTx(exec, async (tx) => {
    const ticket = await lockTicket(tx, input.ticketId);
    if (!canViewTicket(ticket, actor)) fail(403, 'Forbidden: bukan pihak tiket ini');

    const row = {
      id: newId('CMT'),
      ticketId: input.ticketId,
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      message: v.message,
      createdAt: nowTs(),
    };
    await tx.insert(comments).values(row);

    const notifyId = actor.id === ticket.requestedBy ? ticket.assignedTo : ticket.requestedBy;
    if (notifyId) {
      await createNotification({
        userId: notifyId,
        ticketId: input.ticketId,
        type: 'COMMENT',
        title: 'Komentar Baru',
        message: `${actor.name} mengomentari tiket ${ticket.ticketNumber || ticket.id}: "${row.message.slice(0, 50)}..."`,
      }, tx);
    }
    return { comment: serializeComment(row) };
  });
}

export async function addInternalNote(actor: Actor, input: { ticketId: string; note: string }, exec?: DbExec) {
  requireIT(actor);
  const v = parse(NoteSchema, { note: input.note });
  return inTx(exec, async (tx) => {
    await lockTicket(tx, input.ticketId);
    const row = {
      id: newId('NOTE'),
      ticketId: input.ticketId,
      authorId: actor.id,
      authorName: actor.name,
      note: v.note,
      createdAt: nowTs(),
    };
    await tx.insert(internalNotes).values(row);
    return { note: serializeInternalNote(row) };
  });
}
