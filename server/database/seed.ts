import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import {
  users, categories, projectKendala,
  tickets, ticketMembers, worklogs, auditLogs, attachments,
} from './schema';

function ts(date: string, time = '09:00:00'): string {
  return `${date} ${time}`;
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function cleanup() {
  console.log('[SEED] Membersihkan data lama...');
  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 0'));
  const tables = [
    'attachments', 'audit_logs', 'worklogs',
    'ticket_members', 'tickets',
    'user_preferences', 'submodules', 'project_kendala', 'categories', 'users',
    'divisions', 'companies',
  ];
  for (const table of tables) {
    await db.execute(sql.raw(`DELETE FROM ${table}`));
  }
  await db.execute(sql.raw('SET FOREIGN_KEY_CHECKS = 1'));
  console.log('[SEED] Data lama dibersihkan.');
}

async function seedUsers(hash: string) {
  console.log('[SEED] Seeding users...');
  const data = [
    { id: 'USR-001', name: 'Rina Wulandari', email: 'rina.wulandari@company.co.id', passwordHash: hash, role: 'USER_NON_IT', department: 'Finance & Accounting', avatarUrl: 'https://i.pravatar.cc/150?u=usr001' },
    { id: 'USR-002', name: 'Dewi Kartika', email: 'dewi.kartika@company.co.id', passwordHash: hash, role: 'USER_NON_IT', department: 'Human Resources', avatarUrl: 'https://i.pravatar.cc/150?u=usr002' },
    { id: 'USR-003', name: 'Hendra Wijaya', email: 'hendra.wijaya@company.co.id', passwordHash: hash, role: 'USER_NON_IT', department: 'Marketing & Sales', avatarUrl: 'https://i.pravatar.cc/150?u=usr003' },
    { id: 'USR-004', name: 'Putri Amelia', email: 'putri.amelia@company.co.id', passwordHash: hash, role: 'USER_NON_IT', department: 'Operasional', avatarUrl: 'https://i.pravatar.cc/150?u=usr004' },
    { id: 'IT-001', name: 'Budi Santoso', email: 'budi.santoso@it.company.co.id', passwordHash: hash, role: 'IT_WORKER', department: 'IT Support & Hardware', avatarUrl: 'https://i.pravatar.cc/150?u=it001' },
    { id: 'IT-002', name: 'Andi Pratama', email: 'andi.pratama@it.company.co.id', passwordHash: hash, role: 'IT_WORKER', department: 'Software Engineering', avatarUrl: 'https://i.pravatar.cc/150?u=it002' },
    { id: 'IT-003', name: 'Dedi Kurniawan', email: 'dedi.kurniawan@it.company.co.id', passwordHash: hash, role: 'IT_WORKER', department: 'Network & Infrastructure', avatarUrl: 'https://i.pravatar.cc/150?u=it003' },
    { id: 'IT-004', name: 'Rizal Siregar', email: 'rizal.siregar@it.company.co.id', passwordHash: hash, role: 'IT_WORKER', department: 'DevOps & Database', avatarUrl: 'https://i.pravatar.cc/150?u=it004' },
    { id: 'IT-005', name: 'Fajar Nugroho', email: 'fajar.nugroho@it.company.co.id', passwordHash: hash, role: 'IT_WORKER', department: 'Database Administration', avatarUrl: 'https://i.pravatar.cc/150?u=it005' },
    { id: 'ADMIN-001', name: 'Administrator IT', email: 'sysadmin@company.co.id', passwordHash: hash, role: 'SYSTEM_ADMIN', department: 'Enterprise IT Governance', avatarUrl: 'https://i.pravatar.cc/150?u=admin001' },
  ];
  for (const u of data) await db.insert(users).values(u);
  console.log(`[SEED] ${data.length} users berhasil.`);
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
  for (const s of data) await db.insert(projectKendala).values(s);
  console.log(`[SEED] ${data.length} project/kendala berhasil.`);
}

async function seedTickets() {
  console.log('[SEED] Seeding tickets...');
  const ticketsData = [
    {
      id: 'TCK-202609-001', title: 'Printer Lantai 2 Kehabisan Tinta & Paper Jam',
      description: 'Printer EPSON L3150 tidak dapat mencetak invoice akhir bulan.',
      category: 'Support IT', projectKendala: 'Printer & Mesin Fotokopi',
      location: 'Gedung A, Lantai 2 - Ruang Finance', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-001', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByDept: 'Finance & Accounting',
      assignedTo: 'IT-001',
      createdAt: ts('2026-09-01'), ticketNumber: 'TIKSP-100001', issuedAt: ts('2026-09-01', '09:05:00'),
      processStartedAt: ts('2026-09-01', '09:15:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-002', title: 'Gagal Login Akun ERP SAP Keuangan',
      description: 'User account locked due to 3 incorrect password attempts.',
      category: 'IT Programmer', projectKendala: 'Maintenance ERP Desktop',
      location: 'Gedung A, Lantai 3 - Akuntansi', priority: 'CRITICAL', status: 'SELESAI',
      createdBy: 'USR-001', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByDept: 'Finance & Accounting',
      assignedTo: 'IT-002',
      createdAt: ts('2026-09-02'), ticketNumber: 'TIKPG-200001', issuedAt: ts('2026-09-02', '14:02:00'),
      processStartedAt: ts('2026-09-02', '14:10:00'), completedAt: ts('2026-09-02', '14:45:00'),
    },
    {
      id: 'TCK-202609-003', title: 'Koneksi Wifi Boardroom Drop',
      description: 'AP Aruba sering disconnect saat video conference.',
      category: 'Support IT', projectKendala: 'Koneksi Wifi & Jaringan Kantor',
      location: 'Gedung Utama, Lantai 5 - Boardroom', priority: 'HIGH', status: 'DELEGASI',
      createdBy: 'USR-002', createdByDept: 'Human Resources',
      requestedBy: 'USR-002', requestedByDept: 'Human Resources',
      assignedTo: 'IT-003', delegationType: 'DELEGASI_VENDOR',
      vendorId: 'VND-02', vendorName: 'PT Telkom Akses Prima',
      referenceNo: 'TLK-WO-2026-8821',
      createdAt: ts('2026-09-03'), ticketNumber: 'TIKSP-100002', issuedAt: ts('2026-09-03', '08:35:00'),
      processStartedAt: ts('2026-09-03', '09:00:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-004', title: 'Request Lisensi Figma Professional',
      description: 'Permintaan lisensi Figma untuk 2 staff UI/UX baru.',
      category: 'IT Programmer', projectKendala: 'Development Aplikasi / Sistem Baru',
      location: 'Gedung B, Lantai 4 - Tim Desain', priority: 'LOW', status: 'DRAFT',
      createdBy: 'USR-003', createdByDept: 'Marketing & Sales',
      requestedBy: 'USR-003', requestedByDept: 'Marketing & Sales',
      assignedTo: null,
      createdAt: ts('2026-09-04'), ticketNumber: 'TIKPG-200002', issuedAt: null,
      processStartedAt: null, completedAt: null,
    },
    {
      id: 'TCK-202609-005', title: 'Server Database Payroll High CPU',
      description: 'Alert Zabbix: DB-PAYROLL utilisasi memory 96%.',
      category: 'IT Programmer', projectKendala: 'Pengelolaan Database dan Backup Sistem ERP',
      location: 'Data Center Lt 1 - Server Room A', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'ADMIN-001', createdByDept: 'Enterprise IT Governance',
      requestedBy: 'ADMIN-001', requestedByDept: 'Enterprise IT Governance',
      assignedTo: 'IT-004',
      createdAt: ts('2026-09-05'), ticketNumber: 'TIKPG-200003', issuedAt: ts('2026-09-05', '07:46:00'),
      processStartedAt: ts('2026-09-05', '08:00:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-006', title: 'Monitor PC Kasir Bergaris',
      description: 'Monitor Dell 24 inch bergaris hijau vertikal.',
      category: 'Support IT', projectKendala: 'Hardware Laptop, PC & Monitor',
      location: 'Cabang Thamrin - Front Desk', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-004', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByDept: 'Operasional',
      assignedTo: 'IT-001',
      createdAt: ts('2026-09-06'), ticketNumber: 'TIKSP-100003', issuedAt: ts('2026-09-06', '10:05:00'),
      processStartedAt: ts('2026-09-06', '10:30:00'), completedAt: ts('2026-09-06', '11:45:00'),
    },
    {
      id: 'TCK-202609-007', title: 'Email Kantor Tidak Bisa Kirim Eksternal',
      description: 'Seluruh divisi Marketing tidak bisa kirim email ke domain eksternal.',
      category: 'Support IT', projectKendala: 'Email Perusahaan & Office 365',
      location: 'Gedung A, Lantai 4 - Marketing', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-003', createdByDept: 'Marketing & Sales',
      requestedBy: 'USR-003', requestedByDept: 'Marketing & Sales',
      assignedTo: 'IT-002',
      createdAt: ts('2026-09-07'), ticketNumber: 'TIKSP-100004', issuedAt: ts('2026-09-07', '08:10:00'),
      processStartedAt: ts('2026-09-07', '08:30:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-008', title: 'Instalasi ERP Desktop untuk 10 User',
      description: 'Instalasi ERP Desktop client untuk 10 staf baru.',
      category: 'IT Programmer', projectKendala: 'Release ERP Desktop Production',
      location: 'Gedung B, Lantai 2 - Purchasing', priority: 'MEDIUM', status: 'PROCESS',
      createdBy: 'ADMIN-001', createdByDept: 'Enterprise IT Governance',
      requestedBy: 'ADMIN-001', requestedByDept: 'Enterprise IT Governance',
      assignedTo: 'IT-002',
      createdAt: ts('2026-09-08'), ticketNumber: 'TIKPG-200004', issuedAt: ts('2026-09-08', '09:00:00'),
      processStartedAt: ts('2026-09-08', '09:30:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-009', title: 'Lampu Ceiling AC Mati Ruang Rapat',
      description: 'Lampu LED di plafon ruang rapat mati total.',
      category: 'Support IT', projectKendala: 'CCTV & Keamanan Akses Fisik IT',
      location: 'Gedung Utama, Lantai 3 - Ruang Rapat', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-002', createdByDept: 'Human Resources',
      requestedBy: 'USR-002', requestedByDept: 'Human Resources',
      assignedTo: 'IT-005',
      createdAt: ts('2026-09-09'), ticketNumber: 'TIKSP-100005', issuedAt: ts('2026-09-09', '11:00:00'),
      processStartedAt: ts('2026-09-09', '11:20:00'), completedAt: ts('2026-09-09', '13:00:00'),
    },
    {
      id: 'TCK-202609-010', title: 'Bug Modul Payroll ERP Web',
      description: 'Perhitungan lembur tidak sesuai formula.',
      category: 'IT Programmer', projectKendala: 'Penanganan Bug ERP Web',
      location: 'Data Center Lt 1', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'USR-004', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByDept: 'Operasional',
      assignedTo: 'IT-005',
      createdAt: ts('2026-09-10'), ticketNumber: 'TIKPG-200005', issuedAt: ts('2026-09-10', '10:00:00'),
      processStartedAt: ts('2026-09-10', '10:15:00'), completedAt: null,
    },
  ];
  for (const t of ticketsData) await db.insert(tickets).values(t);
  console.log(`[SEED] ${ticketsData.length} tickets berhasil.`);
  return ticketsData;
}

async function seedWorklogs(ticketIds: string[]) {
  console.log('[SEED] Seeding worklogs...');
  const data = [
    { ticketId: ticketIds[0]!, stageKey: 'IN_PROGRESS', workerId: 'IT-001', date: '2026-09-01', startAt: '09:15', finishAt: '09:45', durationMinutes: 30, description: 'Pengecekan fisik printer.' },
    { ticketId: ticketIds[1]!, stageKey: 'IN_PROGRESS', workerId: 'IT-002', date: '2026-09-02', startAt: '14:10', finishAt: '14:45', durationMinutes: 35, description: 'Unlock user SU01.' },
    { ticketId: ticketIds[4]!, stageKey: 'IN_PROGRESS', workerId: 'IT-004', date: '2026-09-05', startAt: '08:00', finishAt: '09:15', durationMinutes: 75, description: 'Kill blocked transactions.' },
    { ticketId: ticketIds[5]!, stageKey: 'IN_PROGRESS', workerId: 'IT-001', date: '2026-09-06', startAt: '10:30', finishAt: '11:45', durationMinutes: 75, description: 'Ganti kabel HDMI.' },
  ];
  for (const w of data) await db.insert(worklogs).values({ id: randomId('WL'), ...w, createdAt: ts(w.date, w.finishAt) });
  console.log(`[SEED] ${data.length} worklogs berhasil.`);
}

async function seedAuditLogs(ticketIds: string[]) {
  console.log('[SEED] Seeding audit logs...');
  const data = [
    { ticketId: ticketIds[0]!, action: 'TIKET_DITERBITKAN', performedBy: 'USR-001' },
    { ticketId: ticketIds[0]!, action: 'TAHAP_ASSIGN_SELESAI', performedBy: 'IT-001' },
    { ticketId: ticketIds[1]!, action: 'TIKET_DITERBITKAN', performedBy: 'USR-001' },
    { ticketId: ticketIds[1]!, action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-002' },
    { ticketId: ticketIds[4]!, action: 'TIKET_DITERBITKAN', performedBy: 'ADMIN-001' },
  ];
  for (const a of data) {
    await db.insert(auditLogs).values({ id: randomId('AUD'), ...a, performedAt: ts('2026-09-08'), detail: null, notes: null });
  }
  console.log(`[SEED] ${data.length} audit logs berhasil.`);
}

async function seedTicketMembers(ticketIds: string[]) {
  console.log('[SEED] Seeding ticket members...');
  const data = [
    { ticketId: ticketIds[0]!, userId: 'IT-001' },
    { ticketId: ticketIds[0]!, userId: 'IT-002' },
    { ticketId: ticketIds[1]!, userId: 'IT-002' },
    { ticketId: ticketIds[4]!, userId: 'IT-004' },
  ];
  for (const m of data) await db.insert(ticketMembers).values({ id: randomId('TM'), ...m, createdAt: ts('2026-09-08') });
  console.log(`[SEED] ${data.length} ticket members berhasil.`);
}

export async function seed() {
  console.log('='.repeat(50));
  console.log('[SEED] Mulai seeding data...');
  console.log('='.repeat(50));

  await cleanup();
  const hash = await bcrypt.hash('password123', 10);

  await seedUsers(hash);
  console.log('[SEED] users done');
  await seedCategories();
  console.log('[SEED] categories done');
  await seedProjectKendala();
  console.log('[SEED] project/kendala done');

  const ticketIds = (await seedTickets()).map(t => t.id);
  console.log('[SEED] tickets done, ids:', ticketIds.length);
  await seedWorklogs(ticketIds);
  console.log('[SEED] worklogs done');
  await seedAuditLogs(ticketIds);
  console.log('[SEED] audit logs done');
  await seedTicketMembers(ticketIds);
  console.log('[SEED] ticket members done');

  console.log('='.repeat(50));
  console.log('[SEED] Semua data berhasil dimasukkan!');
  console.log('[SEED] Default password: password123');
  console.log('='.repeat(50));
}
