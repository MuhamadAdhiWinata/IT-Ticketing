import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from './client';
import {
  users, categories, subcategories,
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
    'user_preferences', 'subcategories', 'categories', 'users',
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

async function seedSubcategories() {
  console.log('[SEED] Seeding subcategories...');
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
  for (const s of data) await db.insert(subcategories).values(s);
  console.log(`[SEED] ${data.length} subcategories berhasil.`);
}

async function seedTickets() {
  console.log('[SEED] Seeding tickets...');
  const ticketsData = [
    {
      id: 'TCK-202609-001', title: 'Printer Lantai 2 Kehabisan Tinta',
      description: 'Printer EPSON tidak dapat mencetak invoice.', category: 'Support IT', subcategory: 'Printer & Mesin Fotokopi',
      location: 'Gedung A, Lantai 2', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-001', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByDept: 'Finance & Accounting', assignedTo: 'IT-001',
      createdAt: ts('2026-09-01'), ticketNumber: 'TIKSP-100001', issuedAt: ts('2026-09-01', '09:05:00'),
    },
    {
      id: 'TCK-202609-002', title: 'Gagal Login ERP SAP',
      description: 'User account locked.', category: 'IT Programmer', subcategory: 'Maintenance ERP Desktop',
      location: 'Gedung A, Lantai 3', priority: 'CRITICAL', status: 'SELESAI',
      createdBy: 'USR-001', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByDept: 'Finance & Accounting', assignedTo: 'IT-002',
      createdAt: ts('2026-09-02'), ticketNumber: 'TIKPG-200001',
      issuedAt: ts('2026-09-02', '14:02:00'), completedAt: ts('2026-09-02', '14:45:00'),
    },
    {
      id: 'TCK-202609-003', title: 'Wifi Boardroom Drop',
      description: 'AP sering disconnect saat video conference.', category: 'Support IT', subcategory: 'Koneksi Wifi & Jaringan Kantor',
      location: 'Lantai 5', priority: 'HIGH', status: 'DELEGASI',
      createdBy: 'USR-002', createdByDept: 'Human Resources',
      requestedBy: 'USR-002', requestedByDept: 'Human Resources', assignedTo: 'IT-003',
      delegationType: 'DELEGASI_VENDOR', vendorName: 'PT Telkom', referenceNo: 'TLK-WO-8821',
      createdAt: ts('2026-09-03'), ticketNumber: 'TIKSP-100002',
      issuedAt: ts('2026-09-03', '08:35:00'),
    },
    {
      id: 'TCK-202609-004', title: 'Request Lisensi Figma',
      description: 'Lisensi untuk 2 staff UI/UX.', category: 'IT Programmer', subcategory: 'Development Aplikasi / Sistem Baru',
      location: 'Gedung B', priority: 'LOW', status: 'DRAFT',
      createdBy: 'USR-003', createdByDept: 'Marketing',
      requestedBy: 'USR-003', requestedByDept: 'Marketing', assignedTo: null,
      createdAt: ts('2026-09-04'), ticketNumber: 'TIKPG-200002',
    },
    {
      id: 'TCK-202609-005', title: 'DB Payroll High CPU',
      description: 'Utilisasi memory 96%.', category: 'IT Programmer', subcategory: 'Pengelolaan Database dan Backup Sistem ERP',
      location: 'Server Room', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'ADMIN-001', createdByDept: 'IT Governance',
      requestedBy: 'ADMIN-001', requestedByDept: 'IT Governance', assignedTo: 'IT-004',
      createdAt: ts('2026-09-05'), ticketNumber: 'TIKPG-200003',
    },
    {
      id: 'TCK-202609-006', title: 'Monitor PC Bergaris',
      description: 'Monitor Dell bergaris hijau.', category: 'Support IT', subcategory: 'Hardware Laptop, PC & Monitor',
      location: 'Cabang Thamrin', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-004', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByDept: 'Operasional', assignedTo: 'IT-001',
      createdAt: ts('2026-09-06'), ticketNumber: 'TIKSP-100003',
      completedAt: ts('2026-09-06', '11:45:00'),
    },
    {
      id: 'TCK-202609-007', title: 'Email Tidak Bisa Kirim',
      description: 'Error 550 Relay.', category: 'Support IT', subcategory: 'Email Perusahaan & Office 365',
      location: 'Lantai 4', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-003', createdByDept: 'Marketing',
      requestedBy: 'USR-003', requestedByDept: 'Marketing', assignedTo: 'IT-002',
      createdAt: ts('2026-09-07'), ticketNumber: 'TIKSP-100004',
    },
    {
      id: 'TCK-202609-008', title: 'Instalasi ERP 10 User',
      description: 'Client ERP untuk staf baru.', category: 'IT Programmer', subcategory: 'Release ERP Desktop Production',
      location: 'Gedung B', priority: 'MEDIUM', status: 'PROCESS',
      createdBy: 'ADMIN-001', createdByDept: 'IT Governance',
      requestedBy: 'ADMIN-001', requestedByDept: 'IT Governance', assignedTo: 'IT-002',
      createdAt: ts('2026-09-08'), ticketNumber: 'TIKPG-200004',
    },
    {
      id: 'TCK-202609-009', title: 'Lampu Ceiling Mati',
      description: 'Lampu LED plafon mati.', category: 'Support IT', subcategory: 'CCTV & Keamanan Akses Fisik IT',
      location: 'Ruang Rapat', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-002', createdByDept: 'HR',
      requestedBy: 'USR-002', requestedByDept: 'HR', assignedTo: 'IT-005',
      createdAt: ts('2026-09-09'), ticketNumber: 'TIKSP-100005',
      completedAt: ts('2026-09-09', '13:00:00'),
    },
    {
      id: 'TCK-202609-010', title: 'Bug Payroll ERP Web',
      description: 'Lembur salah hitung.', category: 'IT Programmer', subcategory: 'Penanganan Bug ERP Web',
      location: 'DC Lt 1', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'USR-004', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByDept: 'Operasional', assignedTo: 'IT-005',
      createdAt: ts('2026-09-10'), ticketNumber: 'TIKPG-200005',
    },
  ];
  for (const t of ticketsData) await db.insert(tickets).values(t);
  console.log(`[SEED] ${ticketsData.length} tickets berhasil.`);
  return ticketsData;
}

async function seedWorklogs(ticketIds: string[]) {
  console.log('[SEED] Seeding worklogs...');
  const data = [
    { ticketId: ticketIds[0], stageKey: 'IN_PROGRESS', workerId: 'IT-001', date: '2026-09-01', startAt: '09:15', finishAt: '09:45', durationMinutes: 30, description: 'Pengecekan fisik printer.' },
    { ticketId: ticketIds[1], stageKey: 'IN_PROGRESS', workerId: 'IT-002', date: '2026-09-02', startAt: '14:10', finishAt: '14:45', durationMinutes: 35, description: 'Unlock user SAP.' },
    { ticketId: ticketIds[4], stageKey: 'IN_PROGRESS', workerId: 'IT-004', date: '2026-09-05', startAt: '08:00', finishAt: '09:15', durationMinutes: 75, description: 'Kill transactions.' },
    { ticketId: ticketIds[5], stageKey: 'IN_PROGRESS', workerId: 'IT-001', date: '2026-09-06', startAt: '10:30', finishAt: '11:45', durationMinutes: 75, description: 'Ganti kabel HDMI.' },
  ];
  for (const w of data) await db.insert(worklogs).values({ id: randomId('WL'), ...w, createdAt: ts(w.date, w.finishAt) });
  console.log(`[SEED] ${data.length} worklogs berhasil.`);
}

async function seedAuditLogs(ticketIds: string[]) {
  console.log('[SEED] Seeding audit logs...');
  const data = [
    { ticketId: ticketIds[0], action: 'TIKET_DITERBITKAN', performedBy: 'USR-001' },
    { ticketId: ticketIds[0], action: 'TAHAP_ASSIGN_SELESAI', performedBy: 'IT-001' },
    { ticketId: ticketIds[1], action: 'TIKET_DITERBITKAN', performedBy: 'USR-001' },
    { ticketId: ticketIds[1], action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-002' },
    { ticketId: ticketIds[4], action: 'TIKET_DITERBITKAN', performedBy: 'ADMIN-001' },
  ];
  for (const a of data) await db.insert(auditLogs).values({ id: randomId('AUD'), ...a, performedAt: ts('2026-09-08'), detail: null, notes: null });
  console.log(`[SEED] ${data.length} audit logs berhasil.`);
}

async function seedTicketMembers(ticketIds: string[]) {
  console.log('[SEED] Seeding ticket members...');
  const data = [
    { ticketId: ticketIds[0], userId: 'IT-001' },
    { ticketId: ticketIds[0], userId: 'IT-002' },
    { ticketId: ticketIds[1], userId: 'IT-002' },
    { ticketId: ticketIds[4], userId: 'IT-004' },
  ];
  for (const m of data) await db.insert(ticketMembers).values({ id: randomId('TM'), ...m, createdAt: ts('2026-09-08') });
  console.log(`[SEED] ${data.length} ticket members berhasil.`);
}

console.log('='.repeat(50));
console.log('[SEED] Mulai seeding data...');
console.log('='.repeat(50));

await cleanup();
const hash = await bcrypt.hash('password123', 10);

await seedUsers(hash);
await seedCategories();
await seedSubcategories();

const ticketIds = (await seedTickets()).map((t: any) => t.id);
await seedWorklogs(ticketIds);
await seedAuditLogs(ticketIds);
await seedTicketMembers(ticketIds);

console.log('='.repeat(50));
console.log('[SEED] Semua data berhasil dimasukkan!');
console.log('[SEED] Default password: password123');
console.log('='.repeat(50));
process.exit(0);
