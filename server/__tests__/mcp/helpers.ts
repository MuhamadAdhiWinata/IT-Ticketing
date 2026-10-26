import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { db } from '~/server/database/client';
import { tickets, users, worklogs, ticketMembers } from '~/server/database/schema';
import { buildMcpServer } from '~/server/mcp/server';
import type { Actor } from '~/server/services/ticketing/common';

export const IT_A: Actor = { id: 'T-IT-A', name: 'Worker A', role: 'IT_WORKER' };
export const IT_B: Actor = { id: 'T-IT-B', name: 'Worker B', role: 'IT_WORKER' };
export const ADMIN: Actor = { id: 'T-ADMIN', name: 'Admin', role: 'SYSTEM_ADMIN' };
export const REQ: Actor = { id: 'T-REQ', name: 'Requester', role: 'USER_NON_IT' };
export const OTHER_REQ: Actor = { id: 'T-REQ2', name: 'Other Requester', role: 'USER_NON_IT' };

export async function seedUsers() {
  for (const a of [IT_A, IT_B, ADMIN, REQ, OTHER_REQ]) {
    await db.insert(users).values({
      id: a.id, name: a.name, email: `${a.id.toLowerCase()}@test.local`, role: a.role, department: 'Test',
    }).onDuplicateKeyUpdate({ set: { role: a.role } });
  }
}

let seq = 0;
export async function seedTicket(opts: {
  status?: string; requester?: Actor; assignedTo?: string | null; priority?: string; activities?: string[]; members?: string[];
} = {}) {
  const id = `TCK-T-${Date.now()}-${++seq}`;
  const requester = opts.requester ?? REQ;
  const ts = '2026-10-01 08:00:00';
  await db.insert(tickets).values({
    id, title: `Test ${id}`, description: 'desc', category: 'Support IT', location: 'Lantai 1',
    priority: opts.priority ?? 'MEDIUM', status: opts.status ?? 'PROCESS',
    createdBy: requester.id, createdByDept: 'Test', requestedBy: requester.id, requestedByDept: 'Test',
    assignedTo: opts.assignedTo ?? null, createdAt: ts, ticketNumber: `TIKSP-${seq}`,
  });
  let i = 0;
  for (const description of opts.activities ?? []) {
    i++;
    await db.insert(worklogs).values({
      id: `WL-SEED-${id}-${i}`, ticketId: id, stageKey: 'IN_PROGRESS', workerId: IT_A.id,
      date: '2026-10-01', startAt: '08:00', finishAt: '08:00', durationMinutes: 0, description,
      createdAt: `2026-10-01 08:0${i}:00`,
    });
  }
  for (const uid of opts.members ?? []) {
    await db.insert(ticketMembers).values({ id: `TM-SEED-${id}-${uid}`, ticketId: id, userId: uid, createdAt: ts });
  }
  return id;
}

export interface ToolResult<T = any> { isError: boolean; data: T }

export async function connect(actor: Actor) {
  const server = buildMcpServer(actor);
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return {
    client,
    async call<T = any>(name: string, args: Record<string, unknown> = {}): Promise<ToolResult<T>> {
      const res: any = await client.callTool({ name, arguments: args });
      const text = res.content?.[0]?.text ?? '{}';
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      return { isError: !!res.isError, data };
    },
    close: async () => { await client.close(); await server.close(); },
  };
}

// Satu klien per actor selama file test berjalan.
const cache = new Map<string, Awaited<ReturnType<typeof connect>>>();
export async function as(actor: Actor) {
  if (!cache.has(actor.id)) cache.set(actor.id, await connect(actor));
  return cache.get(actor.id)!;
}
export async function closeAll() {
  for (const c of cache.values()) await c.close();
  cache.clear();
}
