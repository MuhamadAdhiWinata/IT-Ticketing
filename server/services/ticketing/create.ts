import { eq } from 'drizzle-orm';
import { db } from '~/server/database/client';
import { auditLogs, categories, projectKendala, submodules, tickets, users } from '~/server/database/schema';
import { CreateTicketSchema } from '~/server/utils/validate';
import { generateTicketId, generateTicketNumber } from '~/server/utils/ticket-id';
import { isIntakeRole } from '~/utils/roles';
import { type Actor, type DbExec, fail, getTicketRow, inTx, newId, nowTs, parse } from './common';

// Dipakai POST /api/tickets dan tool MCP create_ticket: satu jalur validasi dan penulisan.
// Mengembalikan ringkasan; pemanggil membaca detail lengkap setelah commit (getTicketById).
// strict (MCP): aplikasi dan modul harus ada di master dan cocok dengan kategori; UI selalu memilih dari master.
export async function createTicket(actor: Actor, input: unknown, opts: { strict?: boolean; exec?: DbExec; referencedTicketId?: string } = {}) {
  const v = parse(CreateTicketSchema, input);
  if (opts.referencedTicketId) await getTicketRow(db, opts.referencedTicketId);
  if (opts.strict) {
    const apps = await db.select({ id: projectKendala.id, name: projectKendala.name, category: categories.name })
      .from(projectKendala).innerJoin(categories, eq(categories.id, projectKendala.categoryId));
    const app = apps.find(a => a.name === v.project_kendala && a.category === v.category);
    if (!app) fail(400, `project_kendala: "${v.project_kendala}" bukan aplikasi/kendala kategori ${v.category}; lihat get_ticket_form_schema`);
    if (v.submodule) {
      const mods = await db.select({ name: submodules.name }).from(submodules).where(eq(submodules.projectKendalaId, app.id));
      if (!mods.some(m => m.name === v.submodule)) fail(400, `submodule: "${v.submodule}" bukan modul dari ${app.name}; lihat get_ticket_form_schema`);
    }
  }
  const shouldIssue = v.shouldIssue !== false;
  if (v.priority === 'CRITICAL' && shouldIssue && !v.attachmentCount) {
    fail(400, 'Ticket CRITICAL membutuhkan minimal 1 lampiran dokumen pendukung.');
  }

  const me = (await db.select().from(users).where(eq(users.id, actor.id)))[0];
  if (!me) fail(401, 'Pengguna tidak ditemukan');

  const intake = isIntakeRole(actor.role, actor.dutyActive);
  let requester = me;
  let createdByAdminId: string | null = null;
  if (v.behalfUserId && intake) {
    const behalf = (await db.select().from(users).where(eq(users.id, v.behalfUserId)))[0];
    if (behalf) {
      requester = behalf;
      createdByAdminId = me.id;
    }
  }

  const unit = requester.unit || v.unit;
  if (!unit) fail(400, 'Unit akun belum diatur; pilih Unit (LNY/IIE/REN/Holding)');
  // Kanal Asal hanya untuk PM/Duty Engineer; pemohon biasa selalu FORM.
  const channel = intake ? (v.channel || 'FORM') : 'FORM';

  return inTx(opts.exec, async (tx) => {
    // ID tiket 3 digit acak per bulan: cek bentrok agar tidak gagal di PK.
    let id = generateTicketId();
    for (let i = 0; i < 30 && (await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id))).length; i++) id = generateTicketId();

    const ts = nowTs();
    const ticketNumber = generateTicketNumber(v.category);
    await tx.insert(tickets).values({
      id,
      title: v.title,
      description: v.description,
      category: v.category,
      projectKendala: v.project_kendala,
      submodule: v.submodule || null,
      location: v.location?.trim() || (v.category === 'IT Programmer' ? '' : 'Lantai 1'),
      priority: v.priority,
      status: 'DRAFT',
      unit,
      contact: v.contact,
      expectedBehavior: v.expected_behavior,
      sinceAt: v.since_at.replace('T', ' ').slice(0, 19),
      affectedScope: v.affected_scope,
      workStatus: v.work_status,
      workaround: v.work_status === 'TERGANGGU' ? v.workaround?.trim() || null : null,
      isEvent: v.is_event ? 1 : 0,
      evidenceSteps: v.evidence_steps?.trim() || null,
      channel,
      createdBy: me.id,
      createdByDept: requester.department,
      createdByAdminId,
      requestedBy: requester.id,
      requestedByDept: requester.department,
      assignedTo: null,
      referencedTicketId: opts.referencedTicketId ?? null,
      createdAt: ts,
      ticketNumber,
      issuedAt: shouldIssue ? ts : null,
    });

    await tx.insert(auditLogs).values({
      id: newId('AUD'), ticketId: id, action: shouldIssue ? 'TIKET_DITERBITKAN' : 'TIKET_DRAFT_DISIMPAN',
      performedAt: ts, performedBy: me.id, onDuty: actor.dutyActive ? 1 : 0,
    });
    if (createdByAdminId) {
      await tx.insert(auditLogs).values({
        id: newId('AUD'), ticketId: id, action: 'DIBUAT_ATAS_NAMA',
        detail: `Dibuat oleh ${me.name} atas nama ${requester.name}`,
        performedAt: ts, performedBy: me.id, onDuty: actor.dutyActive ? 1 : 0,
      });
    }

    if (opts.referencedTicketId) {
      await tx.insert(auditLogs).values({
        id: newId('AUD'), ticketId: id, action: 'TIKET_DITAUTKAN', detail: `Terkait tiket ${opts.referencedTicketId}`,
        performedAt: ts, performedBy: me.id, onDuty: actor.dutyActive ? 1 : 0,
      });
    }

    return {
      id, ticket_number: ticketNumber, status: 'DRAFT', issued: shouldIssue,
      requested_by: requester.id, requested_by_name: requester.name, created_by: me.id, unit, channel,
    };
  });
}
