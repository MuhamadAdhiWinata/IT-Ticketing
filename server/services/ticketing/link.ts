import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, tickets } from '~/server/database/schema';
import { type Actor, type DbExec, fail, getTicketRow, inTx, lockTicket, newId, nowTs, requireIT } from './common';

// Tautkan tiket ke tiket induk/terkait lewat referenced_ticket_id (kolom yang sama dengan "Duplikat dari" di triase).
export async function linkTicket(actor: Actor, input: { ticketId: string; referencedTicketId: string | null }, exec?: DbExec) {
  requireIT(actor);
  if (input.referencedTicketId === input.ticketId) fail(400, 'Tiket tidak boleh merujuk dirinya sendiri');
  if (input.referencedTicketId) await getTicketRow(exec ?? db, input.referencedTicketId);
  return inTx(exec, async (tx) => {
    await lockTicket(tx, input.ticketId);
    await tx.update(tickets).set({ referencedTicketId: input.referencedTicketId }).where(eq(tickets.id, input.ticketId));
    await tx.insert(auditLogs).values({
      id: newId('AUD'), ticketId: input.ticketId, action: input.referencedTicketId ? 'TIKET_DITAUTKAN' : 'TAUTAN_TIKET_DIHAPUS',
      detail: input.referencedTicketId ? `Terkait tiket ${input.referencedTicketId}` : null,
      performedAt: nowTs(), performedBy: actor.id, onDuty: actor.dutyActive ? 1 : 0,
    });
    return { ticket_id: input.ticketId, referenced_ticket_id: input.referencedTicketId };
  });
}
