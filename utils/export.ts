import type { Ticket, Worklog } from '~/types';

/**
 * Downloads data as a CSV file compatible with Microsoft Excel (with UTF-8 BOM).
 */
export function downloadExcelCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF'; // UTF-8 Byte Order Mark for Excel
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent =
    bom +
    [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTicketsToExcel(tickets: Ticket[]) {
  const headers = [
    'Nomor Tiket',
    'Judul Masalah',
    'Kategori',
    'Subkategori',
    'Lokasi',
    'Prioritas',
    'Status',
    'Pelapor (User)',
    'Departemen',
    'Primary Worker',
    'Supporting Members',
    'Delegasi',
    'Tiket Referensi (Recall)',
    'Jumlah Worklog',
    'Tanggal Dibuat',
    'Tanggal Selesai',
  ];

  const rows = tickets.map((t) => [
    t.id,
    t.title,
    t.category,
    t.subcategory,
    t.location,
    t.priority,
    t.status,
    t.created_by_name,
    t.created_by_dept,
    t.assignedToName || 'Belum Ditugaskan',
    (t.members || []).map(m => m.user_name).join('; ') || '-',
    t.delegation ? `${t.delegation.type} (${t.delegation.vendor_name || t.delegation.technician_name})` : '-',
    t.referenced_ticket_id || '-',
    t.worklogs.length,
    t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-',
    t.completed_at ? new Date(t.completed_at).toLocaleString('id-ID') : '-',
  ]);

  downloadExcelCSV(`Laporan_Tiket_IT_${new Date().toISOString().slice(0, 10)}`, headers, rows);
}

export function exportWorklogsToExcel(tickets: Ticket[], workerFilter?: string, dateRange?: { start: string; end: string }) {
  const headers = [
    'Tanggal',
    'Worker',
    'Nomor Tiket',
    'Judul Tiket',
    'Jam Mulai',
    'Jam Selesai',
    'Durasi (Menit)',
    'Durasi (Jam)',
    'Deskripsi Aktivitas Pekerjaan',
  ];

  const rows: (string | number)[][] = [];

  tickets.forEach((t) => {
    t.worklogs.forEach((wl) => {
      const matchWorker = !workerFilter || wl.worker_name.toLowerCase().includes(workerFilter.toLowerCase());
      const wlDate = wl.date || (wl.created_at ? wl.created_at.split('T')[0] : '');
      const matchDate = !dateRange || (wlDate >= dateRange.start && wlDate <= dateRange.end);
      if (matchWorker && matchDate) {
        rows.push([
          wl.date,
          wl.worker_name,
          t.id,
          t.title,
          wl.start_at,
          wl.finish_at,
          wl.duration_minutes,
          (wl.duration_minutes / 60).toFixed(2),
          wl.description,
        ]);
      }
    });
  });

  const suffix = dateRange ? `_${dateRange.start}_sd_${dateRange.end}` : `_${new Date().toISOString().slice(0, 10)}`;
  downloadExcelCSV(`Laporan_Worklog_IT${suffix}`, headers, rows);
}

/**
 * Triggers clean print view for formal PDF generation via browser Print dialog
 */
export function triggerPrintPDF(title: string) {
  const originalTitle = document.title;
  document.title = title;
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}
