import { db } from '~/server/database/client';
import { requireAuth } from '~/server/utils/authorize';
import { setHeader } from 'h3';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  
  // IT or Admin only for full export? Or everyone for their own?
  // PRD §22 says "Export daftar tiket". Let's allow for now if logged in.

  const results = await db.query.tickets.findMany({
    with: {
      creator: true,
      requester: true,
      assignee: true,
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const headers = [
    'ID', 'Nomor Tiket', 'Judul', 'Status', 'Prioritas', 'Kategori', 
    'Pemohon', 'Departemen', 'Ditugaskan Ke', 'Dibuat Pada', 'Selesai Pada'
  ];

  const rows = results.map(t => [
    t.id,
    t.ticketNumber || '',
    (t.title || '').replace(/"/g, '""'),
    t.status,
    t.priority,
    t.category,
    t.requester?.name || '',
    t.requestedByDept,
    t.assignee?.name || '',
    t.createdAt,
    t.completedAt || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(','))
  ].join('\n');

  setHeader(event, 'Content-Type', 'text/csv');
  setHeader(event, 'Content-Disposition', `attachment; filename="tickets-export-${Date.now()}.csv"`);

  return csvContent;
});