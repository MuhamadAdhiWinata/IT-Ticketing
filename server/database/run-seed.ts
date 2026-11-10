import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from './client';
import {
  companies, divisions, users, companySettings, categories, projectKendala, submodules, vendors,
  tickets, ticketMembers, worklogs, comments, internalNotes, files, worklogFiles, commentFiles,
  auditLogs, notifications, userPreferences,
} from './schema';

// Seeder rujukan: setiap tabel terisi, setiap status tiket (DRAFT/PROCESS/DELEGASI/SELESAI)
// dan tiap jenis delegasi punya contoh. ID sengaja tetap supaya seed ulang menghasilkan data identik.
// mcp_tokens & mcp_idempotency sengaja tidak diisi: token berisi rahasia dan dibuat pemilik lewat menu Token MCP.

const ts = (date: string, time = '09:00:00') => `${date} ${time}`;
const addMin = (t: string, m: number) =>
  new Date(new Date(t.replace(' ', 'T') + 'Z').getTime() + m * 60000).toISOString().slice(0, 19).replace('T', ' ');
const minutesBetween = (a: string, b: string) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh! * 60 + bm! - (ah! * 60 + am!);
};

// Gambar inline contoh (data URI) agar seed tidak butuh berkas fisik.
const shot = (title: string) =>
  'data:image/svg+xml;base64,' + Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140"><rect width="360" height="140" fill="#f1f5f9"/><rect width="360" height="28" fill="#b10202"/><text x="12" y="19" font-family="sans-serif" font-size="13" fill="#fff">${title}</text><text x="12" y="80" font-family="sans-serif" font-size="14" fill="#334155">Contoh tangkapan layar</text></svg>`,
  ).toString('base64');

// ── Master organisasi ──
const COMPANIES = [
  { id: 'COMP-001', name: 'PT Neutron Teknologi Nusantara' },
  { id: 'COMP-002', name: 'PT Neutron Media Cetak' },
];

const DIVISIONS = [
  { id: 'DIV-001', companyId: 'COMP-001', name: 'Finance & Accounting' },
  { id: 'DIV-002', companyId: 'COMP-001', name: 'Human Resources' },
  { id: 'DIV-003', companyId: 'COMP-001', name: 'Marketing & Sales' },
  { id: 'DIV-004', companyId: 'COMP-002', name: 'Operasional' },
  { id: 'DIV-005', companyId: 'COMP-001', name: 'IT Support & Hardware' },
  { id: 'DIV-006', companyId: 'COMP-001', name: 'Software Engineering' },
  { id: 'DIV-007', companyId: 'COMP-001', name: 'Network & Infrastructure' },
  { id: 'DIV-008', companyId: 'COMP-001', name: 'Database & DevOps' },
  { id: 'DIV-009', companyId: 'COMP-001', name: 'Enterprise IT Governance' },
];

const USERS = [
  { id: 'USR-001', name: 'Rina Wulandari', email: 'rina.wulandari@company.co.id', role: 'USER_NON_IT', department: 'Finance & Accounting', companyId: 'COMP-001', divisionId: 'DIV-001', unit: 'LNY', isPic: 1 },
  { id: 'USR-002', name: 'Dewi Kartika', email: 'dewi.kartika@company.co.id', role: 'USER_NON_IT', department: 'Human Resources', companyId: 'COMP-001', divisionId: 'DIV-002', unit: 'IIE', isPic: 0 },
  { id: 'USR-003', name: 'Hendra Wijaya', email: 'hendra.wijaya@company.co.id', role: 'USER_NON_IT', department: 'Marketing & Sales', companyId: 'COMP-001', divisionId: 'DIV-003', unit: 'REN', isPic: 0 },
  { id: 'USR-004', name: 'Putri Amelia', email: 'putri.amelia@company.co.id', role: 'USER_NON_IT', department: 'Operasional', companyId: 'COMP-002', divisionId: 'DIV-004', unit: 'Holding', isPic: 1 },
  { id: 'IT-001', name: 'Budi Santoso', email: 'budi.santoso@it.company.co.id', role: 'IT_WORKER', department: 'IT Support & Hardware', companyId: 'COMP-001', divisionId: 'DIV-005' },
  { id: 'IT-002', name: 'Andi Pratama', email: 'andi.pratama@it.company.co.id', role: 'IT_WORKER', department: 'Software Engineering', companyId: 'COMP-001', divisionId: 'DIV-006' },
  { id: 'IT-003', name: 'Dedi Kurniawan', email: 'dedi.kurniawan@it.company.co.id', role: 'IT_WORKER', department: 'Network & Infrastructure', companyId: 'COMP-001', divisionId: 'DIV-007' },
  { id: 'IT-004', name: 'Rizal Siregar', email: 'rizal.siregar@it.company.co.id', role: 'IT_WORKER', department: 'DevOps & Database', companyId: 'COMP-001', divisionId: 'DIV-008' },
  { id: 'IT-005', name: 'Fajar Nugroho', email: 'fajar.nugroho@it.company.co.id', role: 'IT_WORKER', department: 'Database Administration', companyId: 'COMP-001', divisionId: 'DIV-008' },
  { id: 'ADMIN-001', name: 'Administrator IT', email: 'sysadmin@company.co.id', role: 'SYSTEM_ADMIN', department: 'Enterprise IT Governance', companyId: 'COMP-001', divisionId: 'DIV-009' },
  { id: 'PM-001', name: 'Maria Anggraini', email: 'maria.anggraini@it.company.co.id', role: 'PM', department: 'Enterprise IT Governance', companyId: 'COMP-001', divisionId: 'DIV-009', unit: 'Holding', isPic: 0 },
  { id: 'DE-001', name: 'Yoga Prakoso', email: 'yoga.prakoso@it.company.co.id', role: 'DUTY_ENGINEER', department: 'Software Engineering', companyId: 'COMP-001', divisionId: 'DIV-006', unit: 'Holding', isPic: 0 },
];
const user = (id: string) => USERS.find(u => u.id === id)!;

const VENDORS = [
  { id: 'VND-001', name: 'PT Telkom Indonesia', contactName: 'Agus Setiawan', email: 'enterprise.support@telkom.example.com', phone: '+62 21 5000 1001', address: 'Jl. Jenderal Gatot Subroto Kav. 52, Jakarta Selatan' },
  { id: 'VND-002', name: 'PT Mitra Jaringan Prima', contactName: 'Lestari Handayani', email: 'noc@mitrajaringan.example.com', phone: '+62 21 5000 2002', address: 'Jl. Tomang Raya No. 18, Jakarta Barat' },
  { id: 'VND-003', name: 'CV Sinar Printer Service', contactName: 'Hartono', email: 'service@sinarprinter.example.com', phone: '+62 812 5550 3003', address: 'Jl. Margonda Raya No. 77, Depok' },
  { id: 'VND-004', name: 'PT Sentra ERP Solusi', contactName: 'Maya Anggraini', email: 'support@sentraerp.example.com', phone: '+62 21 5000 4004', address: 'Jl. HR Rasuna Said Kav. C-5, Jakarta Selatan' },
];

// ── Tiket ──
type TicketIn = typeof tickets.$inferInsert;
function ticket(t: {
  id: string; no: string; title: string; description: string; category: string; projectKendala: string;
  submodule?: string; location: string; priority: string; status: string; requester: string; assignee?: string;
  createdAt: string; issued?: string; started?: string; completed?: string; createdBy?: string;
} & Partial<TicketIn>): TicketIn {
  const { no, requester, assignee, issued, started, completed, createdBy, ...rest } = t;
  const creator = createdBy ?? requester;
  return {
    unit: user(requester).unit ?? 'Holding',
    expectedBehavior: 'Berjalan normal tanpa kendala.',
    sinceAt: t.createdAt,
    affectedScope: 'SATU_PENGGUNA',
    workStatus: 'DAPAT_MENUNGGU',
    evidenceSteps: '<ol><li>Buka menu terkait</li><li>Kendala <strong>muncul</strong></li></ol>',
    channel: 'FORM',
    ...rest,
    submodule: t.submodule ?? null,
    createdBy: creator,
    createdByDept: user(requester).department,
    createdByAdminId: creator !== requester ? creator : null,
    requestedBy: requester,
    requestedByDept: user(requester).department,
    assignedTo: assignee ?? null,
    ticketNumber: no,
    issuedAt: issued ?? null,
    processStartedAt: started ?? null,
    completedAt: completed ?? null,
  };
}

const BASE_TICKETS: TicketIn[] = [
  ticket({
    id: 'TCK-202609-001', no: 'TIKSP-100001', title: 'Printer Lantai 2 Kehabisan Tinta',
    description: 'Printer EPSON L3150 tidak dapat mencetak invoice akhir bulan.',
    category: 'Support IT', projectKendala: 'Printer & Mesin Fotokopi', location: 'Gedung A, Lantai 2 - Ruang Finance',
    priority: 'HIGH', status: 'PROCESS', requester: 'USR-001', assignee: 'IT-001',
    createdAt: ts('2026-09-01', '09:00:00'), issued: ts('2026-09-01', '09:05:00'), started: ts('2026-09-01', '09:15:00'),
  }),
  ticket({
    id: 'TCK-202609-002', no: 'TIKPG-200001', title: 'Gagal Login ERP SAP',
    description: 'Akun terkunci setelah salah memasukkan password tiga kali.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', submodule: 'Modul Payroll', location: 'Gedung A, Lantai 3',
    priority: 'CRITICAL', status: 'SELESAI', requester: 'USR-001', assignee: 'IT-002',
    solutionType: 'PERBAIKAN_KODE', resolutionSummary: 'Akun di-unlock dan kebijakan lockout diperbarui.',
    createdAt: ts('2026-09-02', '13:50:00'), issued: ts('2026-09-02', '14:02:00'), started: ts('2026-09-02', '14:05:00'), completed: ts('2026-09-02', '14:45:00'),
  }),
  ticket({
    id: 'TCK-202609-003', no: 'TIKSP-100002', title: 'Wifi Boardroom Drop',
    description: 'Access point sering disconnect saat video conference.',
    category: 'Support IT', projectKendala: 'Koneksi Wifi & Jaringan Kantor', location: 'Gedung Utama, Lantai 5 - Boardroom',
    priority: 'HIGH', status: 'DELEGASI', requester: 'USR-002', assignee: 'IT-003',
    createdAt: ts('2026-09-03', '08:30:00'), issued: ts('2026-09-03', '08:35:00'), started: ts('2026-09-03', '08:50:00'),
    delegationType: 'DELEGASI_VENDOR', vendorId: 'VND-001', vendorName: 'PT Telkom Indonesia', referenceNo: 'TLK-WO-8821',
    delegationNotes: 'Firmware controller perlu dianalisis vendor; teknisi dijadwalkan hari Kamis.', delegatedAt: ts('2026-09-03', '10:20:00'),
  }),
  ticket({
    id: 'TCK-202609-004', no: 'TIKPG-200002', title: 'Request Lisensi Figma',
    description: 'Lisensi untuk 2 staf UI/UX.',
    category: 'IT Programmer', projectKendala: 'Development Aplikasi / Sistem Baru', location: 'Gedung B, Lantai 1',
    priority: 'LOW', status: 'DRAFT', requester: 'USR-003', createdAt: ts('2026-09-04', '10:00:00'),
  }),
  ticket({
    id: 'TCK-202609-005', no: 'TIKPG-200003', title: 'DB Payroll High CPU',
    description: 'Utilisasi memory server database payroll mencapai 96%.',
    category: 'IT Programmer', projectKendala: 'Pengelolaan Database dan Backup Sistem ERP', location: 'Server Room',
    priority: 'CRITICAL', status: 'PROCESS', requester: 'ADMIN-001', assignee: 'IT-004',
    createdAt: ts('2026-09-05', '07:50:00'), issued: ts('2026-09-05', '07:55:00'), started: ts('2026-09-05', '08:00:00'),
  }),
  ticket({
    id: 'TCK-202609-006', no: 'TIKSP-100003', title: 'Monitor PC Bergaris',
    description: 'Monitor Dell muncul garis hijau vertikal.',
    category: 'Support IT', projectKendala: 'Hardware Laptop, PC & Monitor', location: 'Cabang Thamrin',
    priority: 'MEDIUM', status: 'SELESAI', requester: 'USR-004', assignee: 'IT-001',
    solutionType: 'SEMENTARA', resolutionSummary: 'Workaround via konfigurasi manual; perbaikan permanen dijadwalkan.', odooTaskUrl: 'https://odoo.example.com/web#id=1042&model=project.task', techDebtUrl: 'https://odoo.example.com/web#id=1043&model=project.task',
    createdAt: ts('2026-09-06', '10:00:00'), issued: ts('2026-09-06', '10:05:00'), started: ts('2026-09-06', '10:20:00'), completed: ts('2026-09-06', '11:45:00'),
  }),
  ticket({
    id: 'TCK-202609-007', no: 'TIKSP-100004', title: 'Email Tidak Bisa Kirim',
    description: 'Muncul error 550 Relay saat mengirim email ke alamat eksternal.',
    category: 'Support IT', projectKendala: 'Email Perusahaan & Office 365', submodule: 'Outlook Desktop Client', location: 'Gedung A, Lantai 4',
    priority: 'HIGH', status: 'PROCESS', requester: 'USR-003', assignee: 'IT-002',
    createdAt: ts('2026-09-07', '13:00:00'), issued: ts('2026-09-07', '13:05:00'), started: ts('2026-09-07', '13:30:00'),
  }),
  ticket({
    id: 'TCK-202609-008', no: 'TIKPG-200004', title: 'Instalasi ERP 10 User',
    description: 'Client ERP untuk 10 staf baru divisi Purchasing.',
    category: 'IT Programmer', projectKendala: 'Release ERP Desktop Production', location: 'Gedung B, Lantai 2 - Purchasing',
    priority: 'MEDIUM', status: 'PROCESS', requester: 'ADMIN-001', assignee: 'IT-002',
    createdAt: ts('2026-09-08', '09:00:00'), issued: ts('2026-09-08', '09:00:00'), started: ts('2026-09-08', '09:30:00'),
  }),
  ticket({
    id: 'TCK-202609-009', no: 'TIKSP-100005', title: 'Lampu Ceiling Mati Ruang Rapat',
    description: 'Lampu LED di plafon ruang rapat mati total.',
    category: 'Support IT', projectKendala: 'CCTV & Keamanan Akses Fisik IT', location: 'Gedung Utama, Lantai 3 - Ruang Rapat',
    priority: 'MEDIUM', status: 'SELESAI', requester: 'USR-002', assignee: 'IT-005',
    solutionType: 'PERBAIKAN_KODE', resolutionSummary: 'Konfigurasi dikoreksi dan diverifikasi pengguna.',
    createdAt: ts('2026-09-09', '10:45:00'), issued: ts('2026-09-09', '10:50:00'), started: ts('2026-09-09', '11:20:00'), completed: ts('2026-09-09', '13:00:00'),
  }),
  ticket({
    id: 'TCK-202609-010', no: 'TIKPG-200005', title: 'Bug Payroll ERP Web: Lembur Salah Hitung',
    description: 'Total jam lembur karyawan shift malam terhitung kurang satu jam.',
    category: 'IT Programmer', projectKendala: 'Penanganan Bug ERP Web', location: 'Gedung Operasional, Lantai 1',
    priority: 'CRITICAL', status: 'PROCESS', requester: 'USR-004', assignee: 'IT-005',
    createdAt: ts('2026-09-10', '08:30:00'), issued: ts('2026-09-10', '08:35:00'), started: ts('2026-09-10', '08:50:00'),
  }),
  ticket({
    id: 'TCK-202610-001', no: 'TIKSP-100006', title: 'Switch Lantai 3 Mati Total',
    description: 'Seluruh port switch lantai 3 tidak menyala sejak pagi.',
    category: 'Support IT', projectKendala: 'Kabel LAN & Wall Outlet', location: 'Gedung Operasional, Lantai 3',
    priority: 'CRITICAL', status: 'DELEGASI', requester: 'USR-004', assignee: 'IT-003',
    createdAt: ts('2026-10-05', '09:00:00'), issued: ts('2026-10-05', '09:05:00'), started: ts('2026-10-05', '09:20:00'),
    delegationType: 'DELEGASI_TEKNISI', technicianName: 'Slamet Riyadi (Teknisi Kelistrikan Gedung)', referenceNo: 'WO-GDG-1015',
    delegationNotes: 'Dugaan catu daya panel rusak; ditangani teknisi gedung.', delegatedAt: ts('2026-10-05', '11:00:00'),
  }),
  ticket({
    id: 'TCK-202610-002', no: 'TIKSP-100007', title: 'Scanner Dokumen Tidak Terdeteksi',
    description: 'Scanner lantai 1 tidak dikenali komputer setelah update Windows.',
    category: 'Support IT', projectKendala: 'Scanner & Digitalisasi Dokumen', location: 'Gedung A, Lantai 1 - Arsip',
    priority: 'MEDIUM', status: 'PROCESS', requester: 'USR-001', assignee: 'IT-001',
    createdAt: ts('2026-10-08', '10:00:00'), issued: ts('2026-10-08', '10:05:00'), started: ts('2026-10-08', '10:30:00'),
    delegationType: 'DELEGASI_VENDOR', vendorId: 'VND-003', vendorName: 'CV Sinar Printer Service', referenceNo: 'SPS-2210-07',
    delegationNotes: 'Unit dibawa vendor untuk servis ADF.', delegatedAt: ts('2026-10-08', '13:00:00'),
    returnedAt: ts('2026-10-10', '15:00:00'), returnedNotes: 'Roller ADF diganti, unit sudah dikembalikan dan berfungsi.',
  }),
  ticket({
    id: 'TCK-202610-003', no: 'TIKPG-200006', title: 'Laporan Penjualan Bulanan di ERP Web',
    description: 'Butuh laporan penjualan per salesman yang bisa diekspor ke Excel.',
    category: 'IT Programmer', projectKendala: 'Permintaan Penambahan Fitur Baru ERP Web', location: 'Gedung B, Lantai 4 - Marketing',
    priority: 'MEDIUM', status: 'DRAFT', requester: 'USR-003', createdBy: 'ADMIN-001', createdAt: ts('2026-10-12', '14:00:00'),
  }),
  ticket({
    id: 'TCK-202610-004', no: 'TIKPG-200007', title: 'Gagal Login ERP Berulang',
    description: 'Akun kembali terkunci dengan gejala sama seperti tiket sebelumnya.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', submodule: 'Modul Payroll', location: 'Gedung A, Lantai 3',
    priority: 'HIGH', status: 'SELESAI', requester: 'USR-001', assignee: 'IT-002', referencedTicketId: 'TCK-202609-002',
    solutionType: 'PERBAIKAN_KODE', resolutionSummary: 'Masalah berulang diselesaikan dengan perbaikan akar penyebab.', reopenCount: 1,
    createdAt: ts('2026-10-14', '09:00:00'), issued: ts('2026-10-14', '09:05:00'), started: ts('2026-10-14', '09:15:00'), completed: ts('2026-10-14', '10:30:00'),
  }),
  ticket({
    id: 'TCK-202610-005', no: 'TIKSP-100008', title: 'Laptop Baru Staf HR Belum Terpasang Aplikasi',
    description: 'Dua laptop baru perlu Office, antivirus, dan VPN sebelum dipakai Senin.',
    category: 'Support IT', projectKendala: 'Instalasi Software Client & Driver', location: 'Gedung Utama, Lantai 2 - HR',
    priority: 'LOW', status: 'PROCESS', requester: 'USR-002', assignee: 'IT-001',
    createdAt: ts('2026-10-20', '08:00:00'), issued: ts('2026-10-20', '08:05:00'), started: ts('2026-10-20', '08:30:00'),
  }),
];

// ── Field triase/eksekusi (spesifikasi 35 field) untuk tiket di atas ──
// Insiden P1/P2 selalu punya konfirmasi Duty Engineer; prioritas mengikuti matriks Dampak x Urgensi.
const DUTY = (at: string) => ({ dutyConfirmedBy: 'Yoga Prakoso', dutyConfirmedAt: at });
const PATCH: Record<string, Partial<TicketIn>> = {
  'TCK-202609-001': { ticketType: 'INSIDEN', impact: 'SEDANG', urgency: 'TINGGI', affectedScope: 'SATU_UNIT', workStatus: 'TERGANGGU', workaround: 'Mencetak lewat printer lantai 1', blockedBy: 'PIHAK_KETIGA', ...DUTY(ts('2026-09-01', '09:08:00')) },
  'TCK-202609-002': { ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI', workStatus: 'BERHENTI_TOTAL', odooTaskUrl: 'https://odoo.example.com/web#id=1001&model=project.task', closedAt: ts('2026-09-03', '08:00:00'), ...DUTY(ts('2026-09-02', '14:03:00')) },
  'TCK-202609-003': { ticketType: 'INSIDEN', impact: 'SEDANG', urgency: 'TINGGI', affectedScope: 'SATU_UNIT', workStatus: 'TERGANGGU', workaround: 'Rapat memakai jaringan kabel', blockedBy: 'PIHAK_KETIGA', ...DUTY(ts('2026-09-03', '08:40:00')) },
  'TCK-202609-004': { acknowledgedAt: ts('2026-09-04', '10:30:00'), changeReason: null },
  'TCK-202609-005': { ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI', affectedScope: 'SEMUA_PENGGUNA', workStatus: 'BERHENTI_TOTAL', ...DUTY(ts('2026-09-05', '07:58:00')) },
  'TCK-202609-006': { ticketType: 'INSIDEN', impact: 'TERBATAS', urgency: 'TINGGI', workStatus: 'TERGANGGU', workaround: 'Memakai monitor cadangan' },
  'TCK-202609-007': { ticketType: 'INSIDEN', impact: 'SEDANG', urgency: 'TINGGI', workStatus: 'TERGANGGU', workaround: 'Kirim lewat webmail', blockedBy: 'LAINNYA', ...DUTY(ts('2026-09-07', '13:08:00')) },
  'TCK-202609-008': { ticketType: 'PL_AKSES', catalogItem: 'PL-02', affectedScope: 'SATU_UNIT', odooTaskUrl: 'https://odoo.example.com/web#id=1002&model=project.task' },
  'TCK-202609-009': { ticketType: 'DI_LUAR_LAYANAN', closedAt: ts('2026-09-10', '08:00:00') },
  'TCK-202609-010': { ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI', affectedScope: 'SATU_UNIT', workStatus: 'TERGANGGU', workaround: 'HR menghitung lembur manual di Excel', odooTaskUrl: 'https://odoo.example.com/web#id=1003&model=project.task', ...DUTY(ts('2026-09-10', '08:38:00')) },
  'TCK-202610-001': { ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI', affectedScope: 'SATU_UNIT', workStatus: 'BERHENTI_TOTAL', blockedBy: 'PIHAK_KETIGA', ...DUTY(ts('2026-10-05', '09:08:00')) },
  'TCK-202610-002': { ticketType: 'INSIDEN', impact: 'TERBATAS', urgency: 'TINGGI', workStatus: 'TERGANGGU', workaround: 'Scan lewat mesin fotokopi', blockedBy: 'PIHAK_KETIGA' },
  'TCK-202610-003': { ticketType: 'PENGEMBANGAN', channel: 'PERCAKAPAN', acknowledgedAt: ts('2026-10-12', '14:30:00') },
  'TCK-202610-004': { ticketType: 'INSIDEN', impact: 'SEDANG', urgency: 'TINGGI', workStatus: 'BERHENTI_TOTAL', changeReason: 'Berulang dari TIKPG-200001, urgensi dinaikkan', ...DUTY(ts('2026-10-14', '09:08:00')) },
  'TCK-202610-005': { ticketType: 'PL_AKSES', catalogItem: 'PL-01', isEvent: 0 },
};

const nov = (day: string, time = '09:00:00') => ts(`2026-11-${day}`, time);
// Tiket baru (November) agar setiap fase, jenis, hasil akhir, dan jenis solusi punya contoh.
const EXTRA_TICKETS: TicketIn[] = [
  // Fase Baru: belum diakui, ada cara lain, sedang tryout
  ticket({
    id: 'TCK-202611-001', no: 'TIKSP-100009', title: 'Wifi Ruang Ujian Putus-putus Saat Tryout',
    description: 'Koneksi wifi ruang ujian sering terputus sehingga peserta tryout harus login ulang.',
    expectedBehavior: 'Wifi stabil selama ujian berlangsung.',
    category: 'Support IT', projectKendala: 'Koneksi Wifi & Jaringan Kantor', location: 'Gedung B, Lantai 1 - Ruang Ujian',
    priority: 'MEDIUM', status: 'DRAFT', requester: 'USR-002', createdAt: nov('09', '07:30:00'),
    affectedScope: 'SATU_UNIT', workStatus: 'TERGANGGU', workaround: 'Peserta berpindah ke hotspot ponsel', isEvent: 1,
    evidenceSteps: `<ol><li>Hubungkan perangkat ke wifi <em>Ujian</em></li><li>Koneksi putus setelah 5-10 menit</li></ol><p>Tangkapan layar:</p><p><img src="${shot('Wifi Ujian terputus')}" alt="wifi terputus"></p>`,
  }),
  // Fase Diakui: dibuat PM atas nama PIC lewat percakapan
  ticket({
    id: 'TCK-202611-002', no: 'TIKPG-200008', title: 'Rekap Absensi Bulan Oktober Tidak Muncul',
    description: 'Laporan rekap absensi Oktober kosong untuk seluruh karyawan Holding.',
    expectedBehavior: 'Rekap absensi menampilkan data seluruh karyawan.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Web', submodule: 'Modul Absensi', location: 'Gedung Operasional, Lantai 1',
    priority: 'MEDIUM', status: 'DRAFT', requester: 'USR-004', createdBy: 'PM-001', createdAt: nov('09', '10:15:00'),
    channel: 'PERCAKAPAN', affectedScope: 'SEMUA_PENGGUNA', workStatus: 'DAPAT_MENUNGGU', acknowledgedAt: nov('09', '10:40:00'),
  }),
  // Fase Ditriase: Insiden P1 menunggu konfirmasi Duty Engineer (belum bisa diproses)
  ticket({
    id: 'TCK-202611-003', no: 'TIKPG-200009', title: 'ERP Desktop Tidak Bisa Dibuka Semua Cabang',
    description: 'Aplikasi ERP desktop menampilkan error koneksi database di seluruh cabang.',
    expectedBehavior: 'ERP desktop dapat dibuka dan terhubung ke database.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', location: 'Seluruh cabang',
    priority: 'CRITICAL', status: 'DRAFT', requester: 'USR-001', assignee: 'IT-004', createdAt: nov('10', '07:45:00'),
    affectedScope: 'SEMUA_PENGGUNA', workStatus: 'BERHENTI_TOTAL', acknowledgedAt: nov('10', '07:50:00'),
    ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI',
  }),
  // Fase Ditriase: PL: Data dengan persetujuan PIC
  ticket({
    id: 'TCK-202611-004', no: 'TIKPG-200010', title: 'Koreksi Data Stok Gudang Akhir Oktober',
    description: 'Selisih stok sistem dan fisik 12 item, perlu koreksi data langsung di database.',
    expectedBehavior: 'Stok sistem sama dengan stok fisik.',
    category: 'IT Programmer', projectKendala: 'Pengelolaan Database dan Backup Sistem ERP', location: 'Gudang Pusat',
    priority: 'MEDIUM', status: 'DRAFT', requester: 'USR-004', assignee: 'IT-005', createdAt: nov('06', '13:00:00'),
    affectedScope: 'SATU_UNIT', workStatus: 'DAPAT_MENUNGGU', acknowledgedAt: nov('06', '13:20:00'),
    ticketType: 'PL_DATA', catalogItem: 'PL-04', dataApprovalNote: 'Persetujuan PIC data (Putri Amelia) via email 06 Nov 2026, daftar 12 item terlampir.',
  }),
  // Fase Dikerjakan: Permintaan Pengembangan dengan tautan Odoo
  ticket({
    id: 'TCK-202611-005', no: 'TIKPG-200011', title: 'Tambah Kolom Diskon Pada Laporan Penjualan',
    description: 'Laporan penjualan perlu kolom diskon per item.',
    expectedBehavior: 'Laporan menampilkan kolom diskon per item.',
    category: 'IT Programmer', projectKendala: 'Permintaan Penambahan Fitur Baru ERP Web', location: 'Gedung B, Lantai 4 - Marketing',
    priority: 'LOW', status: 'PROCESS', requester: 'USR-003', assignee: 'IT-002', createdAt: nov('03', '09:00:00'),
    issued: nov('03', '09:10:00'), started: nov('04', '08:30:00'), acknowledgedAt: nov('03', '09:30:00'), acceptedAt: nov('04', '08:20:00'),
    ticketType: 'PENGEMBANGAN', odooTaskUrl: 'https://odoo.example.com/web#id=1101&model=project.task',
  }),
  // Fase Menunggu Pemohon (mulai tercatat, belum berakhir)
  ticket({
    id: 'TCK-202611-006', no: 'TIKSP-100010', title: 'Cara Membuat Tanda Tangan Email di Outlook',
    description: 'Staf baru ingin tahu cara membuat tanda tangan otomatis di Outlook.',
    expectedBehavior: 'Tanda tangan muncul otomatis di email baru.',
    category: 'Support IT', projectKendala: 'Email Perusahaan & Office 365', submodule: 'Outlook Desktop Client', location: 'Gedung Utama, Lantai 2 - HR',
    priority: 'LOW', status: 'PROCESS', requester: 'USR-002', assignee: 'IT-001', createdAt: nov('05', '10:00:00'),
    issued: nov('05', '10:05:00'), started: nov('05', '10:30:00'), acknowledgedAt: nov('05', '10:10:00'), acceptedAt: nov('05', '10:25:00'),
    ticketType: 'PERTANYAAN', waitingStartedAt: nov('05', '11:00:00'),
  }),
  // Fase Dikerjakan: Proyek Baru tertahan rilis
  ticket({
    id: 'TCK-202611-007', no: 'TIKPG-200012', title: 'Portal Karyawan Versi Mobile',
    description: 'Usulan portal karyawan versi mobile untuk pengajuan cuti.',
    expectedBehavior: 'Karyawan dapat mengajukan cuti lewat ponsel.',
    category: 'IT Programmer', projectKendala: 'Development Aplikasi / Sistem Baru', submodule: 'Portal Karyawan', location: 'Gedung Utama, Lantai 2 - HR',
    priority: 'LOW', status: 'PROCESS', requester: 'USR-002', assignee: 'IT-004', createdAt: nov('02', '09:00:00'),
    issued: nov('02', '09:10:00'), started: nov('04', '09:00:00'), acknowledgedAt: nov('02', '09:30:00'), acceptedAt: nov('04', '08:50:00'),
    ticketType: 'PROYEK_BARU', blockedBy: 'RILIS', odooTaskUrl: 'https://odoo.example.com/web#id=1102&model=project.task',
  }),
  // Hasil Dialihkan: tiap tujuan pengalihan
  ticket({
    id: 'TCK-202611-008', no: 'TIKPG-200013', title: 'Printer Label Gudang Tidak Mencetak',
    description: 'Printer label di gudang tidak mencetak, dilaporkan lewat kanal programmer.',
    expectedBehavior: 'Printer label mencetak normal.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', location: 'Gudang Pusat',
    priority: 'LOW', status: 'SELESAI', requester: 'USR-003', createdAt: nov('03', '14:00:00'), issued: nov('03', '14:05:00'), completed: nov('03', '14:30:00'),
    acknowledgedAt: nov('03', '14:15:00'), ticketType: 'DI_LUAR_LAYANAN', transferTarget: 'IT_SUPPORT',
    changeReason: 'Masalah perangkat keras, bukan aplikasi',
  }),
  ticket({
    id: 'TCK-202611-009', no: 'TIKPG-200014', title: 'ERP Desktop Tidak Bisa Dibuka (Cabang Thamrin)',
    description: 'ERP desktop di cabang Thamrin menampilkan error koneksi database.',
    expectedBehavior: 'ERP desktop dapat dibuka.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', location: 'Cabang Thamrin',
    priority: 'CRITICAL', status: 'SELESAI', requester: 'USR-004', createdAt: nov('10', '08:00:00'), issued: nov('10', '08:02:00'), completed: nov('10', '08:20:00'),
    acknowledgedAt: nov('10', '08:10:00'), ticketType: 'INSIDEN', impact: 'LUAS', urgency: 'TINGGI', ...DUTY(nov('10', '08:12:00')),
    transferTarget: 'DUPLIKAT', referencedTicketId: 'TCK-202611-003',
  }),
  ticket({
    id: 'TCK-202611-010', no: 'TIKPG-200015', title: 'Tambah Fitur Persetujuan Cuti Bertingkat',
    description: 'Permintaan alur persetujuan cuti dua tingkat.',
    expectedBehavior: 'Cuti disetujui atasan lalu HR.',
    category: 'IT Programmer', projectKendala: 'Permintaan Penambahan Fitur Baru ERP Web', location: 'Gedung Utama, Lantai 2 - HR',
    priority: 'LOW', status: 'SELESAI', requester: 'USR-001', createdAt: nov('04', '11:00:00'), issued: nov('04', '11:05:00'), completed: nov('04', '11:40:00'),
    acknowledgedAt: nov('04', '11:15:00'), ticketType: 'PENGEMBANGAN', transferTarget: 'PEMILIK_PP',
  }),
  ticket({
    id: 'TCK-202611-011', no: 'TIKPG-200016', title: 'Integrasi ERP dengan Sistem Kantor Pusat',
    description: 'Usulan integrasi data ERP cabang ke sistem pusat.',
    expectedBehavior: 'Data cabang tersinkron ke pusat.',
    category: 'IT Programmer', projectKendala: 'Integrasi API & Webhook Eksternal', submodule: 'Modul Integrasi Payment Gateway', location: 'Gedung Utama, Lantai 6',
    priority: 'LOW', status: 'SELESAI', requester: 'USR-004', createdAt: nov('04', '15:00:00'), issued: nov('04', '15:05:00'), completed: nov('04', '15:35:00'),
    acknowledgedAt: nov('04', '15:15:00'), ticketType: 'PROYEK_BARU', transferTarget: 'PIMPINAN_HO',
    changeReason: 'Butuh keputusan anggaran pimpinan HO',
  }),
  // Hasil Ditutup: solusi Data atau Konfigurasi
  ticket({
    id: 'TCK-202611-012', no: 'TIKPG-200017', title: 'Tambah Akses Modul Inventory untuk Staf Gudang',
    description: 'Dua staf gudang baru perlu akses modul Inventory.',
    expectedBehavior: 'Staf gudang dapat membuka modul Inventory.',
    category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop', submodule: 'Modul Inventory', location: 'Gudang Pusat',
    priority: 'LOW', status: 'SELESAI', requester: 'USR-004', assignee: 'IT-002', createdAt: nov('02', '08:00:00'),
    issued: nov('02', '08:05:00'), started: nov('02', '08:30:00'), completed: nov('02', '09:10:00'),
    acknowledgedAt: nov('02', '08:10:00'), acceptedAt: nov('02', '08:25:00'), closedAt: nov('03', '08:00:00'),
    ticketType: 'PL_AKSES', catalogItem: 'PL-05', solutionType: 'DATA_KONFIGURASI', resolutionSummary: 'Hak akses modul Inventory ditambahkan untuk dua akun staf gudang.',
  }),
  // Hasil Selesai: solusi Panduan
  ticket({
    id: 'TCK-202611-013', no: 'TIKSP-100011', title: 'Cara Mengatur Printer Default di Windows',
    description: 'Staf bingung mengatur printer default setelah pindah meja.',
    expectedBehavior: 'Dokumen otomatis tercetak di printer terdekat.',
    category: 'Support IT', projectKendala: 'Printer & Mesin Fotokopi', location: 'Gedung A, Lantai 2',
    priority: 'LOW', status: 'SELESAI', requester: 'USR-001', assignee: 'IT-001', createdAt: nov('04', '10:00:00'),
    issued: nov('04', '10:05:00'), started: nov('04', '10:15:00'), completed: nov('04', '10:30:00'),
    acknowledgedAt: nov('04', '10:08:00'), acceptedAt: nov('04', '10:12:00'),
    ticketType: 'PERTANYAAN', solutionType: 'PANDUAN', resolutionSummary: 'Dikirim panduan langkah mengatur printer default lewat Settings > Printers.',
  }),
];

const TICKETS: TicketIn[] = [
  ...BASE_TICKETS.map((t): TicketIn => ({
    ...t,
    // Tiket lama: diakui 3 menit dan diterima Pelaksana 8 menit setelah terbit.
    acknowledgedAt: t.issuedAt ? addMin(t.issuedAt, 3) : null,
    acceptedAt: t.issuedAt && t.assignedTo ? addMin(t.issuedAt, 8) : null,
    ...(PATCH[t.id] ?? {}),
  })),
  ...EXTRA_TICKETS,
];

// Riwayat audit diturunkan dari data tiket agar selalu cocok dengan status dan timestamp-nya.
function auditRows() {
  const rows: (typeof auditLogs.$inferInsert)[] = [];
  const add = (ticketId: string, action: string, performedBy: string, at: string, detail?: string, notes?: string) =>
    rows.push({ id: `AUD-${String(rows.length + 1).padStart(3, '0')}`, ticketId, action, performedBy, performedAt: at, detail: detail ?? null, notes: notes ?? null });
  for (const t of TICKETS) {
    const id = t.id;
    if (t.createdByAdminId) add(id, 'DIBUAT_ATAS_NAMA', t.createdBy, t.createdAt, `Dibuat oleh ${user(t.createdBy).name} atas nama ${user(t.requestedBy).name}`);
    if (!t.issuedAt) { add(id, 'TIKET_DRAFT_DISIMPAN', t.createdBy, t.createdAt); continue; }
    add(id, 'TIKET_DITERBITKAN', t.createdBy, t.issuedAt);
    if (t.assignedTo) add(id, 'TIKET_DITUGASKAN', t.assignedTo, addMin(t.issuedAt, 2), `Ditugaskan ke ${user(t.assignedTo).name}`);
    if (t.processStartedAt) add(id, 'TAHAP_START_WORK_SELESAI', t.assignedTo!, t.processStartedAt, 'DRAFT -> PROCESS');
    if (t.delegatedAt) add(id, 'TAHAP_DELEGATION_SELESAI', t.assignedTo!, t.delegatedAt, 'PROCESS -> DELEGASI', t.delegationNotes ?? undefined);
    if (t.returnedAt) add(id, 'STATUS_DIUBAH', t.assignedTo!, t.returnedAt, 'DELEGASI -> PROCESS', t.returnedNotes ?? undefined);
    if (t.completedAt && !t.transferTarget) add(id, 'TAHAP_IN_PROGRESS_SELESAI', t.assignedTo ?? 'PM-001', t.completedAt, 'PROCESS -> SELESAI');
  }
  // Aksi triase/eksekusi, urut sesuai kolom tiket.
  for (const t of TICKETS) {
    const id = t.id;
    if (t.acknowledgedAt) add(id, 'TIKET_DIAKUI', 'IT-001', t.acknowledgedAt);
    if (t.ticketType) add(id, t.transferTarget ? 'TIKET_DIALIHKAN' : 'TIKET_DITRIASE', 'PM-001', addMin(t.acknowledgedAt ?? t.createdAt, 10), t.transferTarget ?? 'ticketType', t.changeReason ?? undefined);
    if (t.dutyConfirmedAt) add(id, 'KONFIRMASI_DUTY_ENGINEER', 'DE-001', t.dutyConfirmedAt, `Dikonfirmasi ${t.dutyConfirmedBy}`);
    if (t.acceptedAt && t.assignedTo) add(id, 'TIKET_DITERIMA', t.assignedTo, t.acceptedAt);
    if (t.waitingStartedAt) add(id, 'MENUNGGU_PEMOHON_MULAI', t.assignedTo ?? 'IT-001', t.waitingStartedAt);
    if (t.closedAt) add(id, 'TIKET_DITUTUP', 'PM-001', t.closedAt);
  }
  return rows;
}

const MEMBERS: [string, string][] = [
  ['TCK-202609-001', 'IT-001'], ['TCK-202609-001', 'IT-002'],
  ['TCK-202609-002', 'IT-002'],
  ['TCK-202609-003', 'IT-003'],
  ['TCK-202609-005', 'IT-004'], ['TCK-202609-005', 'IT-005'],
  ['TCK-202609-007', 'IT-002'],
  ['TCK-202609-008', 'IT-002'], ['TCK-202609-008', 'IT-004'],
  ['TCK-202609-010', 'IT-005'], ['TCK-202609-010', 'IT-001'],
  ['TCK-202610-001', 'IT-003'],
  ['TCK-202610-002', 'IT-001'],
  ['TCK-202610-005', 'IT-001'],
  ['TCK-202611-003', 'IT-004'], ['TCK-202611-004', 'IT-005'], ['TCK-202611-005', 'IT-002'],
  ['TCK-202611-006', 'IT-001'], ['TCK-202611-007', 'IT-004'], ['TCK-202611-012', 'IT-002'],
  ['TCK-202611-013', 'IT-001'],
];

// ── Worklog (HTML dari editor Tiptap) ──
// [id, ticket, stage, worker, date, start, finish, html]
const WORKLOGS: [string, string, string, string, string, string, string, string][] = [
  ['WL-001', 'TCK-202609-001', 'IN_PROGRESS', 'IT-001', '2026-09-01', '09:15', '09:45', '<p>Pengecekan fisik printer. <strong>Head tersumbat</strong>, sudah dibersihkan.</p>'],
  ['WL-002', 'TCK-202609-001', 'IN_PROGRESS', 'IT-002', '2026-09-01', '10:00', '10:40', '<p>Tes cetak lewat driver:</p><ul><li>Test page berhasil</li><li>Invoice masih <em>paper jam</em> di tray belakang</li><li>Roller perlu diganti, dipesan ke vendor</li></ul>'],
  ['WL-003', 'TCK-202609-002', 'IN_PROGRESS', 'IT-002', '2026-09-02', '14:10', '14:45', '<p>Unlock user lewat transaksi <code>SU01</code>, password direset dan wajib diganti saat login.</p>'],
  ['WL-004', 'TCK-202609-002', 'COMPLETION', 'IT-002', '2026-09-02', '14:45', '14:50', '<p>Konfirmasi ke user: login berhasil. Tiket ditutup.</p>'],
  ['WL-005', 'TCK-202609-003', 'IN_PROGRESS', 'IT-003', '2026-09-03', '08:50', '10:15', '<p>Cek log controller wifi, AP boardroom <strong>reboot tiap ~20 menit</strong>. Kabel PoE dan switch sudah dicek normal.</p><p>Referensi firmware: <a href="https://example.com/ap-firmware-notes" target="_blank" rel="noopener noreferrer">catatan rilis vendor</a></p>'],
  ['WL-006', 'TCK-202609-003', 'DELEGATION', 'IT-003', '2026-09-03', '10:20', '10:20', '<p>Didelegasikan ke PT Telkom Indonesia, ref <code>TLK-WO-8821</code>.</p>'],
  ['WL-007', 'TCK-202609-005', 'IN_PROGRESS', 'IT-004', '2026-09-05', '08:00', '09:15', '<p>Kill <em>blocked transactions</em> di server payroll. CPU turun dari 96% ke 40%.</p>'],
  ['WL-008', 'TCK-202609-005', 'IN_PROGRESS', 'IT-005', '2026-09-05', '09:30', '10:30', `<p>Pemantauan setelah tindakan, grafik CPU stabil:</p><p><img src="${shot('Grafik CPU server payroll')}" alt="grafik cpu"></p>`],
  ['WL-009', 'TCK-202609-006', 'IN_PROGRESS', 'IT-001', '2026-09-06', '10:30', '11:45', '<p>Ganti kabel HDMI, garis hilang. Monitor normal.</p>'],
  ['WL-010', 'TCK-202609-007', 'IN_PROGRESS', 'IT-002', '2026-09-07', '13:30', '14:20', '<p>Header error dari server:</p><blockquote>550 5.7.1 Unable to relay</blockquote><p>IP client belum masuk daftar relay. Menunggu persetujuan penambahan.</p>'],
  ['WL-011', 'TCK-202609-008', 'IN_PROGRESS', 'IT-002', '2026-09-08', '09:30', '11:00', '<p>Instalasi ERP client di 6 dari 10 PC:</p><ol><li>Copy installer dari share</li><li>Konfigurasi koneksi database</li><li>Uji login per user</li></ol>'],
  ['WL-012', 'TCK-202609-009', 'IN_PROGRESS', 'IT-005', '2026-09-09', '11:20', '13:00', '<p>Ganti 4 lampu LED panel 40W. Semua menyala normal.</p>'],
  ['WL-013', 'TCK-202609-010', 'IN_PROGRESS', 'IT-005', '2026-09-10', '08:50', '10:20', '<p>Reproduksi bug: jam lembur lewat tengah malam terpotong di <code>OvertimeCalculator</code>. Perbaikan sedang diuji di dev trial.</p>'],
  ['WL-014', 'TCK-202610-001', 'DELEGATION', 'IT-003', '2026-10-05', '11:00', '11:00', '<p>Didelegasikan ke teknisi gedung (<code>WO-GDG-1015</code>) untuk pengecekan panel listrik.</p>'],
  ['WL-015', 'TCK-202610-002', 'IN_PROGRESS', 'IT-001', '2026-10-08', '10:30', '11:15', '<p>Driver sudah diinstal ulang, scanner tetap tidak terdeteksi. Indikasi kerusakan hardware.</p>'],
  ['WL-016', 'TCK-202610-002', 'DELEGATION', 'IT-001', '2026-10-08', '13:00', '13:00', '<p>Unit dikirim ke CV Sinar Printer Service, ref <code>SPS-2210-07</code>.</p>'],
  ['WL-017', 'TCK-202610-004', 'IN_PROGRESS', 'IT-002', '2026-10-14', '09:15', '10:20', '<p>Penyebab: <strong>sesi SAP GUI lama</strong> di PC user masih mencoba login dengan password lama. Sesi dimatikan dan konfigurasi tersimpan dihapus.</p>'],
  ['WL-018', 'TCK-202610-005', 'IN_PROGRESS', 'IT-001', '2026-10-20', '08:30', '09:30', '<p>Laptop pertama selesai (Office, antivirus, VPN). Laptop kedua menunggu lisensi.</p>'],
];

// ── Komentar diskusi User ↔ IT ──
// [id, ticket, user, waktu, html]
const COMMENTS: [string, string, string, string, string][] = [
  ['CMT-001', 'TCK-202609-001', 'USR-001', ts('2026-09-01', '09:00:00'), '<p>Printernya masih belum bisa cetak, mohon dicek lagi.</p>'],
  ['CMT-002', 'TCK-202609-001', 'IT-001', ts('2026-09-01', '09:05:00'), '<p>Baik, saya cek ke lokasi. Mohon kirim <em>foto error</em> jika ada.</p>'],
  ['CMT-003', 'TCK-202609-001', 'IT-001', ts('2026-09-01', '09:50:00'), '<p>Head sudah dibersihkan, silakan coba cetak invoice lagi.</p>'],
  ['CMT-004', 'TCK-202609-001', 'USR-001', ts('2026-09-01', '10:05:00'), '<p>Sudah bisa mencetak, terima kasih. Tapi kertas masih sering <strong>macet</strong>.</p>'],
  ['CMT-005', 'TCK-202609-002', 'USR-001', ts('2026-09-02', '14:00:00'), '<p>Akun saya terkunci dan ada closing yang harus selesai hari ini.</p>'],
  ['CMT-006', 'TCK-202609-002', 'IT-002', ts('2026-09-02', '14:46:00'), '<p>Sudah di-unlock. Mohon login ulang dengan password sementara yang dikirim terpisah.</p>'],
  ['CMT-007', 'TCK-202609-002', 'USR-001', ts('2026-09-02', '14:50:00'), '<p>Sudah bisa login, terima kasih!</p>'],
  ['CMT-008', 'TCK-202609-003', 'USR-002', ts('2026-09-03', '08:40:00'), '<p>Rapat jam 10 nanti memakai boardroom, mohon diprioritaskan.</p>'],
  ['CMT-009', 'TCK-202609-003', 'IT-003', ts('2026-09-03', '10:25:00'), '<p>Masalah ada di firmware controller dan perlu vendor. Tiket didelegasikan ke PT Telkom, ref <code>TLK-WO-8821</code>. Untuk rapat nanti gunakan jaringan kabel.</p>'],
  ['CMT-010', 'TCK-202609-007', 'USR-003', ts('2026-09-07', '13:10:00'), `<p>Ini tampilan error yang muncul saat kirim email:</p><p><img src="${shot('Outlook: 550 Relay')}" alt="error outlook"></p>`],
  ['CMT-011', 'TCK-202609-007', 'IT-002', ts('2026-09-07', '13:40:00'), '<p>Terima kasih, error sudah terbaca. IP client perlu didaftarkan ke relay dulu, estimasi sore ini.</p>'],
  ['CMT-012', 'TCK-202609-010', 'USR-004', ts('2026-09-10', '08:40:00'), '<p>Lembur shift malam tanggal 8 dan 9 kurang <strong>1 jam</strong> dari absensi mesin.</p>'],
  ['CMT-013', 'TCK-202609-010', 'IT-005', ts('2026-09-10', '09:00:00'), '<p>Bug sudah ditemukan di perhitungan lintas tengah malam. Perbaikan diuji dulu sebelum rilis.</p>'],
  ['CMT-014', 'TCK-202610-004', 'USR-001', ts('2026-10-14', '09:10:00'), '<p>Masalahnya sama dengan tiket sebelumnya (TIKPG-200001).</p>'],
  ['CMT-015', 'TCK-202610-004', 'IT-002', ts('2026-10-14', '10:25:00'), '<p>Penyebabnya sesi SAP GUI lama di PC Anda. Sudah dibersihkan, seharusnya tidak terulang.</p>'],
];

const INTERNAL_NOTES: [string, string, string, string, string][] = [
  ['INT-001', 'TCK-202609-003', 'IT-003', ts('2026-09-03', '10:30:00'), 'Vendor minta akses ke ruang server lantai 5 hari Kamis, koordinasi dengan security.'],
  ['INT-002', 'TCK-202609-005', 'IT-004', ts('2026-09-05', '09:20:00'), 'Query laporan payroll berjalan tanpa index pada kolom tanggal. Usulkan index di maintenance window berikutnya.'],
  ['INT-003', 'TCK-202609-010', 'IT-005', ts('2026-09-10', '09:10:00'), 'Perbaikan ikut rilis dev trial Jumat; production menunggu persetujuan HR.'],
  ['INT-004', 'TCK-202610-002', 'IT-001', ts('2026-10-10', '15:10:00'), 'Vendor mengganti roller ADF tanpa biaya (garansi). Simpan berita acara.'],
];

// ── Berkas ──
// stage null = lampiran lewat tabel pivot (worklog/komentar). file_path null: seed tidak membuat berkas fisik.
// [id, ticket, stage, visibility, nama, ukuran, uploader, waktu]
const FILES: [string, string, string | null, string, string, string, string, string][] = [
  ['FILE-001', 'TCK-202609-001', null, 'USER_VISIBLE', 'hasil-cek-printer.pdf', '12 KB', 'IT-001', ts('2026-09-01', '09:45:00')],
  ['FILE-002', 'TCK-202609-001', null, 'USER_VISIBLE', 'foto-error.png', '48 KB', 'USR-001', ts('2026-09-01', '09:10:00')],
  ['FILE-003', 'TCK-202609-002', 'IN_PROGRESS', 'USER_VISIBLE', 'bukti-unlock-user.png', '31 KB', 'IT-002', ts('2026-09-02', '14:45:00')],
  ['FILE-004', 'TCK-202609-003', 'DELEGATION', 'USER_VISIBLE', 'work-order-telkom.pdf', '96 KB', 'IT-003', ts('2026-09-03', '10:20:00')],
  ['FILE-005', 'TCK-202609-005', 'IN_PROGRESS', 'INTERNAL_ONLY', 'slow-query-log.txt', '212 KB', 'IT-004', ts('2026-09-05', '09:15:00')],
  ['FILE-006', 'TCK-202609-006', 'COMPLETION', 'USER_VISIBLE', 'foto-monitor-setelah-perbaikan.jpg', '184 KB', 'IT-001', ts('2026-09-06', '11:45:00')],
  ['FILE-007', 'TCK-202610-002', 'DELEGATION', 'USER_VISIBLE', 'tanda-terima-servis.pdf', '64 KB', 'IT-001', ts('2026-10-08', '13:00:00')],
  ['FILE-008', 'TCK-202610-004', 'COMPLETION', 'USER_VISIBLE', 'berita-acara.pdf', '58 KB', 'IT-002', ts('2026-10-14', '10:30:00')],
];
const WORKLOG_FILES: [string, string][] = [['WL-001', 'FILE-001']];
const COMMENT_FILES: [string, string][] = [['CMT-001', 'FILE-002']];

// ── Notifikasi ──
// [ticket, penerima, tipe, judul, pesan, dibaca, waktu]
const nomor = (id: string) => TICKETS.find(t => t.id === id)!.ticketNumber;
const NOTIFS: [string, string, string, string, string, number, string][] = [
  ['TCK-202609-001', 'IT-001', 'COMMENT', 'Komentar Baru', `Rina Wulandari mengomentari tiket ${nomor('TCK-202609-001')}: "Printernya masih belum bisa cetak, mohon dicek lagi."`, 1, ts('2026-09-01', '09:00:00')],
  ['TCK-202609-001', 'USR-001', 'COMMENT', 'Komentar Baru', `Budi Santoso mengomentari tiket ${nomor('TCK-202609-001')}: "Head sudah dibersihkan, silakan coba cetak invoice lagi."`, 0, ts('2026-09-01', '09:50:00')],
  ['TCK-202609-001', 'IT-001', 'COMMENT', 'Komentar Baru', `Rina Wulandari mengomentari tiket ${nomor('TCK-202609-001')}: "Sudah bisa mencetak, terima kasih. Tapi kertas masih sering macet."`, 0, ts('2026-09-01', '10:05:00')],
  ['TCK-202609-002', 'USR-001', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202609-002')} berubah dari PROCESS menjadi SELESAI`, 1, ts('2026-09-02', '14:45:00')],
  ['TCK-202609-003', 'IT-003', 'ASSIGNED', 'Tiket Ditugaskan', `Anda ditugaskan untuk menangani tiket ${nomor('TCK-202609-003')}: Wifi Boardroom Drop`, 1, ts('2026-09-03', '08:37:00')],
  ['TCK-202609-003', 'USR-002', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202609-003')} berubah dari PROCESS menjadi DELEGASI`, 0, ts('2026-09-03', '10:20:00')],
  ['TCK-202609-005', 'IT-004', 'SLA_WARNING', 'Peringatan SLA', `Tiket ${nomor('TCK-202609-005')} (CRITICAL) mendekati batas SLA`, 1, ts('2026-09-05', '08:45:00')],
  ['TCK-202609-006', 'USR-004', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202609-006')} berubah dari PROCESS menjadi SELESAI`, 1, ts('2026-09-06', '11:45:00')],
  ['TCK-202609-007', 'IT-002', 'COMMENT', 'Komentar Baru', `Hendra Wijaya mengomentari tiket ${nomor('TCK-202609-007')}: "Ini tampilan error yang muncul saat kirim email:"`, 0, ts('2026-09-07', '13:10:00')],
  ['TCK-202609-010', 'IT-005', 'SLA_WARNING', 'Peringatan SLA', `Tiket ${nomor('TCK-202609-010')} (CRITICAL) mendekati batas SLA`, 0, ts('2026-09-10', '09:30:00')],
  ['TCK-202610-001', 'USR-004', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202610-001')} berubah dari PROCESS menjadi DELEGASI`, 0, ts('2026-10-05', '11:00:00')],
  ['TCK-202610-002', 'USR-001', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202610-002')} berubah dari DELEGASI menjadi PROCESS`, 1, ts('2026-10-10', '15:00:00')],
  ['TCK-202610-003', 'USR-003', 'NEW_TICKET', 'Draft Tiket Dibuat', `Administrator IT membuat draft tiket ${nomor('TCK-202610-003')} atas nama Anda`, 0, ts('2026-10-12', '14:00:00')],
  ['TCK-202610-004', 'USR-001', 'ASSIGNED', 'Status Tiket Berubah', `Status tiket ${nomor('TCK-202610-004')} berubah dari PROCESS menjadi SELESAI`, 0, ts('2026-10-14', '10:30:00')],
];

const DARK_MODE = new Set(['IT-001', 'IT-004', 'ADMIN-001']);

const seqId = (prefix: string, i: number) => `${prefix}-${String(i + 1).padStart(3, '0')}`;

async function cleanup() {
  console.log('[SEED] Membersihkan data lama...');
  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 0'));
  const tables = [
    'comment_files', 'worklog_files', 'files', 'comments', 'internal_notes', 'notifications',
    'audit_logs', 'worklogs', 'ticket_members', 'tickets', 'vendors',
    'user_preferences', 'submodules', 'project_kendala', 'categories', 'users',
    'divisions', 'companies', 'company_settings',
  ];
  for (const table of tables) {
    await db.execute(sql.raw(`DELETE FROM ${table}`));
  }
  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 1'));
  console.log('[SEED] Data lama dibersihkan.');
}

async function seedOrg(hash: string) {
  console.log('[SEED] Seeding companies, divisions, users, preferences...');
  await db.insert(companies).values(COMPANIES);
  await db.insert(divisions).values(DIVISIONS);
  await db.insert(users).values(USERS.map(u => ({ ...u, passwordHash: hash, avatarUrl: `https://i.pravatar.cc/150?u=${u.id.toLowerCase().replace('-', '')}` })));
  await db.insert(userPreferences).values(USERS.map(u => ({ userId: u.id, darkMode: DARK_MODE.has(u.id) ? 1 : 0 })));
  console.log(`[SEED] ${COMPANIES.length} companies, ${DIVISIONS.length} divisions, ${USERS.length} users, ${USERS.length} preferences berhasil.`);
}

async function seedCompanySettings() {
  console.log('[SEED] Seeding company settings...');
  // Baris 'default' dibaca GET /api/settings/company; tanpa baris ini tema jatuh ke bawaan kode.
  await db.insert(companySettings).values({
    id: 'default',
    companyName: 'Neutron',
    logoUrl: 'https://career.amikom.ac.id/images/company/cover/1720853154.png',
    primaryColor: '#b10202',
    primaryHoverColor: '#920202',
    primaryActiveColor: '#740101',
    primaryMutedColor: '#e6f1f8',
    primaryForegroundColor: '#ffffff',
    secondaryColor: '#475569',
    secondaryHoverColor: '#334155',
    secondaryForegroundColor: '#ffffff',
    accentColor: '#0ea5e9',
    accentForegroundColor: '#ffffff',
    createdAt: ts('2026-09-26', '07:08:47'),
    updatedAt: ts('2026-09-29', '07:07:50'),
  });
  console.log('[SEED] 1 company settings berhasil.');
}

async function seedCategories() {
  console.log('[SEED] Seeding categories...');
  await db.insert(categories).values([
    { id: 'CAT-01', name: 'Support IT' },
    { id: 'CAT-02', name: 'IT Programmer' },
  ]);
  console.log('[SEED] 2 categories berhasil.');
}

async function seedProjectKendala() {
  console.log('[SEED] Seeding project/kendala...');
  const data = [
    { id: 'SUB-001', categoryId: 'CAT-01', name: 'Printer & Mesin Fotokopi' },
    { id: 'SUB-002', categoryId: 'CAT-01', name: 'Scanner & Digitalisasi Dokumen' },
    { id: 'SUB-003', categoryId: 'CAT-01', name: 'Hardware Laptop, PC & Monitor' },
    { id: 'SUB-004', categoryId: 'CAT-01', name: 'Koneksi Wifi & Jaringan Kantor' },
    { id: 'SUB-005', categoryId: 'CAT-01', name: 'Kabel LAN & Wall Outlet' },
    { id: 'SUB-006', categoryId: 'CAT-01', name: 'Reset Password & Unlock Account' },
    { id: 'SUB-007', categoryId: 'CAT-01', name: 'Email Perusahaan & Office 365' },
    { id: 'SUB-008', categoryId: 'CAT-01', name: 'Akses Shared Folder & Server NAS' },
    { id: 'SUB-009', categoryId: 'CAT-01', name: 'Instalasi Software Client & Driver' },
    { id: 'SUB-010', categoryId: 'CAT-01', name: 'Penanganan Virus & Antivirus Client' },
    { id: 'SUB-011', categoryId: 'CAT-01', name: 'Telepon IP PBX & Komunikasi Line' },
    { id: 'SUB-012', categoryId: 'CAT-01', name: 'CCTV & Keamanan Akses Fisik IT' },
    { id: 'SUB-013', categoryId: 'CAT-02', name: 'Development Aplikasi / Sistem Baru' },
    { id: 'SUB-014', categoryId: 'CAT-02', name: 'Pengelolaan Database dan Backup Sistem ERP' },
    { id: 'SUB-015', categoryId: 'CAT-02', name: 'Maintenance ERP Desktop' },
    { id: 'SUB-016', categoryId: 'CAT-02', name: 'Penanganan Bug ERP Desktop' },
    { id: 'SUB-017', categoryId: 'CAT-02', name: 'Permintaan Penambahan Fitur Baru ERP Desktop' },
    { id: 'SUB-018', categoryId: 'CAT-02', name: 'Perubahan Fitur Sistem ERP Desktop' },
    { id: 'SUB-019', categoryId: 'CAT-02', name: 'Release ERP Desktop Dev Trial' },
    { id: 'SUB-020', categoryId: 'CAT-02', name: 'Release ERP Desktop Production' },
    { id: 'SUB-021', categoryId: 'CAT-02', name: 'Maintenance ERP Web' },
    { id: 'SUB-022', categoryId: 'CAT-02', name: 'Penanganan Bug ERP Web' },
    { id: 'SUB-023', categoryId: 'CAT-02', name: 'Permintaan Penambahan Fitur Baru ERP Web' },
    { id: 'SUB-024', categoryId: 'CAT-02', name: 'Perubahan Fitur Sistem ERP Web' },
    { id: 'SUB-025', categoryId: 'CAT-02', name: 'Release Dev Trial' },
    { id: 'SUB-026', categoryId: 'CAT-02', name: 'Release ERP Web Production' },
    { id: 'SUB-027', categoryId: 'CAT-02', name: 'Integrasi API & Webhook Eksternal' },
    { id: 'SUB-028', categoryId: 'CAT-02', name: 'Optimasi Performa Query Database' },
  ];
  await db.insert(projectKendala).values(data);
  console.log(`[SEED] ${data.length} project/kendala berhasil.`);
}

async function seedSubmodules() {
  console.log('[SEED] Seeding submodules...');
  const data = [
    { id: 'SMOD-001', projectKendalaId: 'SUB-015', name: 'Modul Payroll' },
    { id: 'SMOD-002', projectKendalaId: 'SUB-015', name: 'Modul Purchasing' },
    { id: 'SMOD-003', projectKendalaId: 'SUB-015', name: 'Modul Inventory' },
    { id: 'SMOD-004', projectKendalaId: 'SUB-021', name: 'Modul Absensi' },
    { id: 'SMOD-005', projectKendalaId: 'SUB-021', name: 'Modul Reimbursement' },
    { id: 'SMOD-006', projectKendalaId: 'SUB-013', name: 'Portal Karyawan' },
    { id: 'SMOD-007', projectKendalaId: 'SUB-027', name: 'Modul Integrasi Payment Gateway' },
    { id: 'SMOD-008', projectKendalaId: 'SUB-007', name: 'Webmail Office 365' },
    { id: 'SMOD-009', projectKendalaId: 'SUB-007', name: 'Outlook Desktop Client' },
  ];
  await db.insert(submodules).values(data);
  console.log(`[SEED] ${data.length} submodules berhasil.`);
}

async function seedTicketData() {
  console.log('[SEED] Seeding vendors & tickets...');
  await db.insert(vendors).values(VENDORS);
  await db.insert(tickets).values(TICKETS);
  await db.insert(ticketMembers).values(MEMBERS.map(([ticketId, userId], i) => ({
    id: seqId('TM', i), ticketId, userId, createdAt: TICKETS.find(t => t.id === ticketId)!.createdAt,
  })));
  const audits = auditRows();
  await db.insert(auditLogs).values(audits);
  console.log(`[SEED] ${VENDORS.length} vendors, ${TICKETS.length} tickets, ${MEMBERS.length} members, ${audits.length} audit logs berhasil.`);
}

async function seedDiscussion() {
  console.log('[SEED] Seeding worklogs, comments, notes, files, notifications...');
  await db.insert(worklogs).values(WORKLOGS.map(([id, ticketId, stageKey, workerId, date, startAt, finishAt, description]) => ({
    id, ticketId, stageKey, workerId, date, startAt, finishAt, description,
    durationMinutes: minutesBetween(startAt, finishAt), createdAt: ts(date, `${finishAt}:00`),
  })));
  await db.insert(comments).values(COMMENTS.map(([id, ticketId, userId, createdAt, message]) => ({
    id, ticketId, userId, userName: user(userId).name, userRole: user(userId).role, message, createdAt,
  })));
  await db.insert(internalNotes).values(INTERNAL_NOTES.map(([id, ticketId, authorId, createdAt, note]) => ({
    id, ticketId, authorId, authorName: user(authorId).name, note, createdAt,
  })));
  await db.insert(files).values(FILES.map(([id, ticketId, stage, visibility, fileName, fileSize, uploadedBy, uploadedAt]) => ({
    id, ticketId, stage, visibility, fileName, fileSize, filePath: null, uploadedBy, uploadedAt,
  })));
  await db.insert(worklogFiles).values(WORKLOG_FILES.map(([worklogId, fileId], i) => ({
    id: seqId('WLF', i), worklogId, fileId, createdAt: FILES.find(f => f[0] === fileId)![7],
  })));
  await db.insert(commentFiles).values(COMMENT_FILES.map(([commentId, fileId], i) => ({
    id: seqId('CMF', i), commentId, fileId, createdAt: FILES.find(f => f[0] === fileId)![7],
  })));
  await db.insert(notifications).values(NOTIFS.map(([ticketId, userId, type, title, message, isRead, createdAt], i) => ({
    id: seqId('NTF', i), userId, ticketId, type, title, message, isRead, createdAt,
  })));
  console.log(`[SEED] ${WORKLOGS.length} worklogs, ${COMMENTS.length} comments, ${INTERNAL_NOTES.length} internal notes, ${FILES.length} files, ${NOTIFS.length} notifications berhasil.`);
}

console.log('='.repeat(50));
console.log('[SEED] Mulai seeding data...');
console.log('='.repeat(50));

await cleanup();
const hash = await bcrypt.hash('password123', 10);

await seedOrg(hash);
await seedCompanySettings();
await seedCategories();
await seedProjectKendala();
await seedSubmodules();
await seedTicketData();
await seedDiscussion();

console.log('='.repeat(50));
console.log('[SEED] Semua data berhasil dimasukkan!');
console.log('[SEED] Default password: password123');
console.log('='.repeat(50));
process.exit(0);
