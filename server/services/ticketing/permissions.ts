import { getValidTransitions } from '~/server/utils/ticket-lifecycle';
import { type Actor, type DbExec, getMemberIds, getTicketRow, isIT } from './common';

type TicketLike = { status: string; requestedBy: string; createdBy: string; assignedTo: string | null };

export type ActivityStage = 'ASSIGN' | 'IN_PROGRESS' | 'COMPLETION';

// Kirim di tahap ASSIGN selalu ada; IN_PROGRESS hanya saat PROCESS; COMPLETION hanya saat SELESAI (sama dengan TicketDetailView).
export function activityStagesFor(status: string): ActivityStage[] {
  const stages: ActivityStage[] = ['ASSIGN'];
  if (status === 'PROCESS') stages.push('IN_PROGRESS');
  if (status === 'SELESAI') stages.push('COMPLETION');
  return stages;
}

export function defaultActivityStage(status: string): ActivityStage {
  if (status === 'PROCESS') return 'IN_PROGRESS';
  if (status === 'SELESAI') return 'COMPLETION';
  return 'ASSIGN';
}

// Rule 06/07: assignment & member terkunci setelah SELESAI.
export const isLocked = (t: TicketLike) => t.status === 'SELESAI';
export const isRequesterSide = (t: TicketLike, a: Actor) => t.requestedBy === a.id || t.createdBy === a.id;

export function canViewTicket(t: TicketLike, a: Actor) {
  return isIT(a) || isRequesterSide(t, a);
}

export function canAddMembers(t: TicketLike, a: Actor) {
  return !isLocked(t) && (isIT(a) || isRequesterSide(t, a));
}

export function canAssign(t: TicketLike, a: Actor) {
  return isIT(a) && !isLocked(t);
}

// Worker hanya boleh mengambil untuk dirinya (PRD: self-assign); SYSTEM_ADMIN boleh menunjuk siapa saja.
export function canTargetOther(a: Actor) {
  return a.role === 'SYSTEM_ADMIN';
}

export interface AllowedActions {
  ticket_id: string;
  status: string;
  is_assignee: boolean;
  is_member: boolean;
  transitions: { to: string; tool: string; note?: string }[];
  actions: Record<string, { allowed: boolean; reason?: string; stages?: string[] }>;
  rules: string[];
}

export async function getAllowedActions(exec: DbExec, actor: Actor, ticketId: string): Promise<AllowedActions> {
  const t = await getTicketRow(exec, ticketId);
  const members = await getMemberIds(exec, ticketId);
  const it = isIT(actor);
  const need = (ok: boolean, reason: string) => (ok ? { allowed: true } : { allowed: false, reason });
  const notIT = 'Hanya IT_WORKER atau SYSTEM_ADMIN';

  const transitions = it
    ? getValidTransitions(t.status).map(to => ({
        to,
        tool: t.status === 'SELESAI' ? 'reopen_ticket' : 'transition_ticket_status',
        ...(to === 'DELEGASI' ? { note: 'delegation (vendor/teknisi) opsional' } : {}),
      }))
    : [];

  const stages = activityStagesFor(t.status);
  return {
    ticket_id: t.id,
    status: t.status,
    is_assignee: t.assignedTo === actor.id,
    is_member: members.includes(actor.id),
    transitions,
    actions: {
      add_ticket_activity: { ...need(it, notIT), stages },
      log_work_time: need(it && t.status !== 'DRAFT', it ? 'Tiket masih DRAFT; mulai proses dahulu' : notIT),
      add_comment: need(canViewTicket(t, actor), 'Bukan pihak tiket ini'),
      add_internal_note: need(it, notIT),
      add_attachment: need(it, notIT),
      assign_ticket: need(canAssign(t, actor), it ? 'Tiket SELESAI: assignment terkunci' : notIT),
      add_ticket_members: need(canAddMembers(t, actor), isLocked(t) ? 'Tiket SELESAI: member terkunci' : 'Bukan pihak tiket ini'),
      reopen_ticket: need(it && t.status === 'SELESAI', it ? 'Hanya tiket SELESAI' : notIT),
    },
    rules: [
      'Aktivitas baru selalu menjadi record baru dan tidak mengubah status (Rule 18).',
      'Perubahan status memakai transition_ticket_status; SELESAI -> PROCESS lewat reopen_ticket.',
      'Setelah SELESAI, assignment dan member terkunci (Rule 06/07).',
      'IT_WORKER hanya dapat menugaskan/mengambil tiket untuk dirinya sendiri; SYSTEM_ADMIN dapat untuk IT lain.',
    ],
  };
}
