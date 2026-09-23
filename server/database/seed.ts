import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { db } from './client';
import {
  users, categories, subcategories, vendors, technicians,
  tickets, ticketMembers, worklogs, comments, internalNotes,
  auditLogs, attachments,
} from './schema';

function ts(date: string, time = '09:00:00'): string {
  return `${date} ${time}`;
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function rawQuery(sql: string): Promise<any> {
  const client = db.$client;
  return new Promise((resolve, reject) => {
    client.query(sql, (err: any, rows: any) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function cleanup() {
  console.log('[SEED] Membersihkan data lama...');
  await rawQuery('SET FOREIGN_KEY_CHECKS = 0');
  const tables = [
    'attachments', 'audit_logs', 'internal_notes', 'comments',
    'worklogs', 'ticket_members', 'tickets',
    'user_preferences', 'technicians', 'vendors',
    'subcategories', 'categories', 'users',
  ];
  for (const table of tables) {
    await rawQuery(`DELETE FROM ${table}`);
  }
  await rawQuery('SET FOREIGN_KEY_CHECKS = 1');
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
  for (const u of data) {
    await db.insert(users).values(u);
  }
  console.log(`[SEED] ${data.length} users berhasil.`);
  return data;
}

async function seedCategories() {
  console.log('[SEED] Seeding categories...');
  const data = [
    { id: 'CAT-01', name: 'Support IT' },
    { id: 'CAT-02', name: 'IT Programmer' },
  ];
  for (const c of data) await db.insert(categories).values(c);
  console.log(`[SEED] ${data.length} categories berhasil.`);
  return data;
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
    { id: 'SUB-018', categoryId: 'CAT-02', name: 'Perubahan Fitur Sistem (Modifikasi) ERP Desktop' },
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
  return data;
}

async function seedVendors() {
  console.log('[SEED] Seeding vendors...');
  const data = [
    { id: 'VND-01', name: 'PT Mitra Solusi Printer', serviceType: 'Perbaikan Printer & Suplai Toner', contactPerson: 'Bambang Sudibyo', phone: '0812-9988-7711' },
    { id: 'VND-02', name: 'PT Telkom Akses Prima', serviceType: 'Fiber Optic & Backbone Internet', contactPerson: 'Ratna Dewi', phone: '0811-3322-1144' },
    { id: 'VND-03', name: 'CV Sentra Servis Komputer', serviceType: 'Hardware Repair & Motherboard', contactPerson: 'Dimas Anggoro', phone: '0813-5566-7788' },
    { id: 'VND-04', name: 'PT Jaringan Nusantara', serviceType: 'Instalasi & Maintenance Jaringan', contactPerson: 'Rudi Hartono', phone: '0821-4455-6677' },
  ];
  for (const v of data) await db.insert(vendors).values(v);
  console.log(`[SEED] ${data.length} vendors berhasil.`);
  return data;
}

async function seedTechnicians() {
  console.log('[SEED] Seeding technicians...');
  const data = [
    { id: 'TEK-01', name: 'Pak Joko Susanto', specialty: 'Teknisi Listrik & Crimping Kabel UTP', phone: '0878-1122-3344' },
    { id: 'TEK-02', name: 'Mas Fajar Nugroho', specialty: 'Teknisi PABX & Telepon Meja', phone: '0896-4455-6677' },
  ];
  for (const t of data) await db.insert(technicians).values(t);
  console.log(`[SEED] ${data.length} technicians berhasil.`);
  return data;
}

async function seedTickets() {
  console.log('[SEED] Seeding tickets...');
  const now = new Date();
  const base = new Date('2026-09-01');

  const ticketsData = [
    {
      id: 'TCK-202609-001', title: 'Printer Lantai 2 Kehabisan Tinta & Paper Jam',
      description: 'Printer EPSON L3150 di divisi Keuangan Lantai 2 tidak dapat mencetak invoice akhir bulan. Ada kertas tersangkut dan lampu indikator tinta berkedip merah terus menerus.',
      category: 'Support IT', subcategory: 'Printer & Mesin Fotokopi',
      location: 'Gedung A, Lantai 2 - Ruang Finance', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-001', createdByName: 'Rina Wulandari', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByName: 'Rina Wulandari', requestedByDept: 'Finance & Accounting',
      assignedTo: 'IT-001', assignedToName: 'Budi Santoso',
      createdAt: ts('2026-09-01'), ticketNumber: 'TIKSP-100001', issuedAt: ts('2026-09-01', '09:05:00'),
      processStartedAt: ts('2026-09-01', '09:15:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-002', title: 'Gagal Login Akun ERP SAP Keuangan',
      description: 'Muncul error "User account locked due to 3 incorrect password attempts". Tidak bisa approval batch vendor.',
      category: 'IT Programmer', subcategory: 'Maintenance ERP Desktop',
      location: 'Gedung A, Lantai 3 - Akuntansi', priority: 'CRITICAL', status: 'SELESAI',
      createdBy: 'USR-001', createdByName: 'Rina Wulandari', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByName: 'Rina Wulandari', requestedByDept: 'Finance & Accounting',
      assignedTo: 'IT-002', assignedToName: 'Andi Pratama',
      createdAt: ts('2026-09-02'), ticketNumber: 'TIKPG-200001', issuedAt: ts('2026-09-02', '14:02:00'),
      processStartedAt: ts('2026-09-02', '14:10:00'), completedAt: ts('2026-09-02', '14:45:00'),
      resolutionSummary: 'Unlock user via SU01, reset temporary password, verifikasi login.',
      confirmedByUser: 1,
    },
    {
      id: 'TCK-202609-003', title: 'Koneksi Wifi Boardroom Lantai 5 Drop',
      description: 'Access Point Aruba di Boardroom sering disconnect saat video conference Zoom.',
      category: 'Support IT', subcategory: 'Koneksi Wifi & Jaringan Kantor',
      location: 'Gedung Utama, Lantai 5 - Boardroom', priority: 'HIGH', status: 'DELEGASI',
      createdBy: 'USR-002', createdByName: 'Dewi Kartika', createdByDept: 'Human Resources',
      requestedBy: 'USR-002', requestedByName: 'Dewi Kartika', requestedByDept: 'Human Resources',
      assignedTo: 'IT-003', assignedToName: 'Dedi Kurniawan',
      delegationType: 'DELEGASI_VENDOR', vendorId: 'VND-02', vendorName: 'PT Telkom Akses Prima',
      referenceNo: 'TLK-WO-2026-8821',
      createdAt: ts('2026-09-03'), ticketNumber: 'TIKSP-100002', issuedAt: ts('2026-09-03', '08:35:00'),
      processStartedAt: ts('2026-09-03', '09:00:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-004', title: 'Request Lisensi Figma Professional',
      description: 'Permintaan lisensi Figma untuk 2 staff UI/UX baru serta instalasi font korporat.',
      category: 'IT Programmer', subcategory: 'Development Aplikasi / Sistem Baru',
      location: 'Gedung B, Lantai 4 - Tim Desain', priority: 'LOW', status: 'DRAFT',
      createdBy: 'USR-003', createdByName: 'Hendra Wijaya', createdByDept: 'Marketing & Sales',
      requestedBy: 'USR-003', requestedByName: 'Hendra Wijaya', requestedByDept: 'Marketing & Sales',
      assignedTo: null, assignedToName: null,
      createdAt: ts('2026-09-04'), ticketNumber: 'TIKPG-200002', issuedAt: null,
      processStartedAt: null, completedAt: null,
    },
    {
      id: 'TCK-202609-005', title: 'Server Database Payroll High CPU',
      description: 'Alert Zabbix: Server DB-PAYROLL utilisasi memory 96%, query lock timeout pada perhitungan lembur.',
      category: 'IT Programmer', subcategory: 'Pengelolaan Database dan Backup Sistem ERP',
      location: 'Data Center Lt 1 - Server Room A', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'IT-001', createdByName: 'Budi Santoso', createdByDept: 'IT Support & Hardware',
      requestedBy: 'IT-001', requestedByName: 'Budi Santoso', requestedByDept: 'IT Support & Hardware',
      assignedTo: 'IT-004', assignedToName: 'Rizal Siregar',
      createdAt: ts('2026-09-05'), ticketNumber: 'TIKPG-200003', issuedAt: ts('2026-09-05', '07:46:00'),
      processStartedAt: ts('2026-09-05', '08:00:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-006', title: 'Monitor PC Kasir Bergaris & Berkedip',
      description: 'Monitor Dell 24 inch pada meja kasir front-office bergaris hijau vertikal saat dinyalakan.',
      category: 'Support IT', subcategory: 'Hardware Laptop, PC & Monitor',
      location: 'Cabang Thamrin - Front Desk', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-004', createdByName: 'Putri Amelia', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByName: 'Putri Amelia', requestedByDept: 'Operasional',
      assignedTo: 'IT-001', assignedToName: 'Budi Santoso',
      createdAt: ts('2026-09-06'), ticketNumber: 'TIKSP-100003', issuedAt: ts('2026-09-06', '10:05:00'),
      processStartedAt: ts('2026-09-06', '10:30:00'), completedAt: ts('2026-09-06', '11:45:00'),
      resolutionSummary: 'Penggantian kabel HDMI yang longgar dan update display driver.',
      confirmedByUser: 1,
    },
    {
      id: 'TCK-202609-007', title: 'Email Kantor Tidak Bisa Kirim ke Eksternal',
      description: 'Seluruh divisi Marketing tidak bisa mengirim email ke domain eksternal. Error 550 Relay Access Denied.',
      category: 'Support IT', subcategory: 'Email Perusahaan & Office 365',
      location: 'Gedung A, Lantai 4 - Marketing', priority: 'HIGH', status: 'PROCESS',
      createdBy: 'USR-003', createdByName: 'Hendra Wijaya', createdByDept: 'Marketing & Sales',
      requestedBy: 'USR-003', requestedByName: 'Hendra Wijaya', requestedByDept: 'Marketing & Sales',
      assignedTo: 'IT-002', assignedToName: 'Andi Pratama',
      createdAt: ts('2026-09-07'), ticketNumber: 'TIKSP-100004', issuedAt: ts('2026-09-07', '08:10:00'),
      processStartedAt: ts('2026-09-07', '08:30:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-008', title: 'Instalasi ERP Client Baru untuk 10 User',
      description: 'Permintaan instalasi ERP Desktop client untuk 10 staf baru di divisi Purchasing.',
      category: 'IT Programmer', subcategory: 'Release ERP Desktop Production',
      location: 'Gedung B, Lantai 2 - Purchasing', priority: 'MEDIUM', status: 'PROCESS',
      createdBy: 'USR-001', createdByName: 'Rina Wulandari', createdByDept: 'Finance & Accounting',
      requestedBy: 'USR-001', requestedByName: 'Rina Wulandari', requestedByDept: 'Finance & Accounting',
      assignedTo: 'IT-002', assignedToName: 'Andi Pratama',
      createdAt: ts('2026-09-08'), ticketNumber: 'TIKPG-200004', issuedAt: ts('2026-09-08', '09:00:00'),
      processStartedAt: ts('2026-09-08', '09:30:00'), completedAt: null,
    },
    {
      id: 'TCK-202609-009', title: 'Lampu Ceiling AC Mati di Ruang Rapat',
      description: 'Lampu LED di plafon ruang rapat utama mati total, mengganggu kenyamanan rapat direksi.',
      category: 'Support IT', subcategory: 'CCTV & Keamanan Akses Fisik IT',
      location: 'Gedung Utama, Lantai 3 - Ruang Rapat', priority: 'MEDIUM', status: 'SELESAI',
      createdBy: 'USR-002', createdByName: 'Dewi Kartika', createdByDept: 'Human Resources',
      requestedBy: 'USR-002', requestedByName: 'Dewi Kartika', requestedByDept: 'Human Resources',
      assignedTo: 'IT-005', assignedToName: 'Fajar Nugroho',
      createdAt: ts('2026-09-09'), ticketNumber: 'TIKSP-100005', issuedAt: ts('2026-09-09', '11:00:00'),
      processStartedAt: ts('2026-09-09', '11:20:00'), completedAt: ts('2026-09-09', '13:00:00'),
      resolutionSummary: 'Penggantian driver LED yang rusak.',
      confirmedByUser: 1,
    },
    {
      id: 'TCK-202609-010', title: 'Bug Modul Payroll di ERP Web',
      description: 'Perhitungan lembur tidak sesuai dengan formula yang ditetapkan di ERP Web.',
      category: 'IT Programmer', subcategory: 'Penanganan Bug ERP Web',
      location: 'Data Center Lt 1', priority: 'CRITICAL', status: 'PROCESS',
      createdBy: 'USR-004', createdByName: 'Putri Amelia', createdByDept: 'Operasional',
      requestedBy: 'USR-004', requestedByName: 'Putri Amelia', requestedByDept: 'Operasional',
      assignedTo: 'IT-005', assignedToName: 'Fajar Nugroho',
      createdAt: ts('2026-09-10'), ticketNumber: 'TIKPG-200005', issuedAt: ts('2026-09-10', '10:00:00'),
      processStartedAt: ts('2026-09-10', '10:15:00'), completedAt: null,
    },
  ];

  for (const t of ticketsData) {
    await db.insert(tickets).values(t);
  }
  console.log(`[SEED] ${ticketsData.length} tickets berhasil.`);
  return ticketsData;
}

async function seedWorklogs(ticketIds: string[]) {
  console.log('[SEED] Seeding worklogs...');
  const data = [
    { ticketId: ticketIds[0], stageKey: 'IN_PROGRESS', workerId: 'IT-001', workerName: 'Budi Santoso', date: '2026-09-01', startAt: '09:15', finishAt: '09:45', durationMinutes: 30, description: 'Pengecekan fisik printer, ditemukan serpihan kertas sobek di gear roller.', createdAt: ts('2026-09-01', '09:45:00') },
    { ticketId: ticketIds[0], stageKey: 'IN_PROGRESS', workerId: 'IT-001', workerName: 'Budi Santoso', date: '2026-09-01', startAt: '09:50', finishAt: '10:30', durationMinutes: 40, description: 'Pembersihan roller dan penyedotan sisa kertas sobek.', createdAt: ts('2026-09-01', '10:30:00') },
    { ticketId: ticketIds[1], stageKey: 'IN_PROGRESS', workerId: 'IT-002', workerName: 'Andi Pratama', date: '2026-09-02', startAt: '14:10', finishAt: '14:45', durationMinutes: 35, description: 'Unlock user SU01, reset password, dampingi login.', createdAt: ts('2026-09-02', '14:45:00') },
    { ticketId: ticketIds[2], stageKey: 'IN_PROGRESS', workerId: 'IT-003', workerName: 'Dedi Kurniawan', date: '2026-09-03', startAt: '09:00', finishAt: '10:30', durationMinutes: 90, description: 'Cek channel interference dan ping gateway. Packet loss 18%.', createdAt: ts('2026-09-03', '10:30:00') },
    { ticketId: ticketIds[4], stageKey: 'IN_PROGRESS', workerId: 'IT-004', workerName: 'Rizal Siregar', date: '2026-09-05', startAt: '08:00', finishAt: '09:15', durationMinutes: 75, description: 'Kill blocked transactions, rebuild index tabel payroll, setting vacuum.', createdAt: ts('2026-09-05', '09:15:00') },
    { ticketId: ticketIds[5], stageKey: 'IN_PROGRESS', workerId: 'IT-001', workerName: 'Budi Santoso', date: '2026-09-06', startAt: '10:30', finishAt: '11:45', durationMinutes: 75, description: 'Test kabel HDMI dengan kabel baru, update driver.', createdAt: ts('2026-09-06', '11:45:00') },
    { ticketId: ticketIds[6], stageKey: 'IN_PROGRESS', workerId: 'IT-002', workerName: 'Andi Pratama', date: '2026-09-07', startAt: '08:30', finishAt: '10:00', durationMinutes: 90, description: 'Cek SMTP relay, restart mail service, kirim test email.', createdAt: ts('2026-09-07', '10:00:00') },
    { ticketId: ticketIds[8], stageKey: 'IN_PROGRESS', workerId: 'IT-005', workerName: 'Fajar Nugroho', date: '2026-09-09', startAt: '11:20', finishAt: '13:00', durationMinutes: 100, description: 'Penggantian driver LED ceiling lamp.', createdAt: ts('2026-09-09', '13:00:00') },
  ];
  for (const w of data) {
    await db.insert(worklogs).values({ id: randomId('WL'), ...w });
  }
  console.log(`[SEED] ${data.length} worklogs berhasil.`);
}

async function seedComments(ticketIds: string[]) {
  console.log('[SEED] Seeding comments...');
  const data = [
    { ticketId: ticketIds[0], userId: 'USR-001', userName: 'Rina Wulandari', userRole: 'USER_NON_IT', message: 'Selamat pagi Mas Budi, mohon dibantu karena berkas pajak harus dicetak sebelum jam 1 siang.' },
    { ticketId: ticketIds[0], userId: 'IT-001', userName: 'Budi Santoso', userRole: 'IT_WORKER', message: 'Siap Bu Rina, sedang dibersihkan rollernya dan segera isi ulang tinta.' },
    { ticketId: ticketIds[1], userId: 'IT-002', userName: 'Andi Pratama', userRole: 'IT_WORKER', message: 'Password sementara sudah dikirim via WhatsApp. Silakan coba login kembali.' },
    { ticketId: ticketIds[1], userId: 'USR-001', userName: 'Rina Wulandari', userRole: 'USER_NON_IT', message: 'Terima kasih Mas Andi, sudah bisa masuk kembali.' },
    { ticketId: ticketIds[6], userId: 'IT-002', userName: 'Andi Pratama', userRole: 'IT_WORKER', message: 'Tiket sementara diperiksa, issue terkait blacklist IP relay.' },
  ];
  for (const c of data) {
    await db.insert(comments).values({ id: randomId('CMT'), createdAt: ts('2026-09-08'), ...c });
  }
  console.log(`[SEED] ${data.length} comments berhasil.`);
}

async function seedInternalNotes(ticketIds: string[]) {
  console.log('[SEED] Seeding internal notes...');
  const data = [
    { ticketId: ticketIds[0], authorId: 'IT-001', authorName: 'Budi Santoso', note: 'Sensor head agak miring. Jika direset masih error, eskalasi ke vendor.' },
    { ticketId: ticketIds[2], authorId: 'IT-003', authorName: 'Dedi Kurniawan', note: 'Garansi SLA vendor Telkom 4 jam kerja. Follow up jam 14:00 jika teknisi belum tiba.' },
    { ticketId: ticketIds[4], authorId: 'IT-004', authorName: 'Rizal Siregar', note: 'Indeks tabel overtime missing composite key. Diskusi dengan developer ERP.' },
  ];
  for (const n of data) {
    await db.insert(internalNotes).values({ id: randomId('IN'), createdAt: ts('2026-09-08'), ...n });
  }
  console.log(`[SEED] ${data.length} internal notes berhasil.`);
}

async function seedAuditLogs(ticketIds: string[]) {
  console.log('[SEED] Seeding audit logs...');
  const data = [
    { ticketId: ticketIds[0], action: 'TIKET_DITERBITKAN', performedBy: 'USR-001', performedByName: 'Rina Wulandari' },
    { ticketId: ticketIds[0], action: 'TAHAP_ASSIGN_SELESAI', performedBy: 'IT-001', performedByName: 'Budi Santoso' },
    { ticketId: ticketIds[0], action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-001', performedByName: 'Budi Santoso', notes: 'Printer sudah bisa dipakai.' },
    { ticketId: ticketIds[1], action: 'TIKET_DITERBITKAN', performedBy: 'USR-001', performedByName: 'Rina Wulandari' },
    { ticketId: ticketIds[1], action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-002', performedByName: 'Andi Pratama', notes: 'Unlock user sukses.' },
    { ticketId: ticketIds[2], action: 'TIKET_DITERBITKAN', performedBy: 'USR-002', performedByName: 'Dewi Kartika' },
    { ticketId: ticketIds[2], action: 'TAHAP_DELEGATION_SELESAI', performedBy: 'IT-003', performedByName: 'Dedi Kurniawan', notes: 'Delegasi ke Telkom.' },
    { ticketId: ticketIds[4], action: 'TIKET_DITERBITKAN', performedBy: 'IT-001', performedByName: 'Budi Santoso' },
    { ticketId: ticketIds[4], action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-004', performedByName: 'Rizal Siregar' },
    { ticketId: ticketIds[5], action: 'TIKET_DITERBITKAN', performedBy: 'USR-004', performedByName: 'Putri Amelia' },
    { ticketId: ticketIds[5], action: 'TAHAP_IN_PROGRESS_SELESAI', performedBy: 'IT-001', performedByName: 'Budi Santoso', notes: 'Kabel HDMI diganti.' },
  ];
  for (const a of data) {
    await db.insert(auditLogs).values({ id: randomId('AUD'), performedAt: ts('2026-09-08'), detail: null, ...a });
  }
  console.log(`[SEED] ${data.length} audit logs berhasil.`);
}

async function seedAttachments(ticketIds: string[]) {
  console.log('[SEED] Seeding attachments...');
  const data = [
    { ticketId: ticketIds[0], stage: 'REQUEST', visibility: 'USER_VISIBLE', fileName: 'foto_printer_merah.jpg', fileSize: '2.4 MB', uploadedBy: 'USR-001', uploadedByName: 'Rina Wulandari' },
    { ticketId: ticketIds[0], stage: 'IN_PROGRESS', visibility: 'INTERNAL_ONLY', fileName: 'log_printer.txt', fileSize: '45 KB', uploadedBy: 'IT-001', uploadedByName: 'Budi Santoso' },
    { ticketId: ticketIds[1], stage: 'COMPLETION', visibility: 'USER_VISIBLE', fileName: 'bukti_login_sap.png', fileSize: '620 KB', uploadedBy: 'IT-002', uploadedByName: 'Andi Pratama' },
    { ticketId: ticketIds[2], stage: 'DELEGATION', visibility: 'USER_VISIBLE', fileName: 'form_serah_terima_telkom.pdf', fileSize: '1.1 MB', uploadedBy: 'IT-003', uploadedByName: 'Dedi Kurniawan' },
    { ticketId: ticketIds[5], stage: 'COMPLETION', visibility: 'USER_VISIBLE', fileName: 'foto_monitor_normal.jpg', fileSize: '2.1 MB', uploadedBy: 'IT-001', uploadedByName: 'Budi Santoso' },
    { ticketId: ticketIds[6], stage: 'IN_PROGRESS', visibility: 'INTERNAL_ONLY', fileName: 'smtp_relay_log.txt', fileSize: '120 KB', uploadedBy: 'IT-002', uploadedByName: 'Andi Pratama' },
  ];
  for (const a of data) {
    await db.insert(attachments).values({ id: randomId('ATT'), filePath: null, uploadedAt: ts('2026-09-08'), ...a });
  }
  console.log(`[SEED] ${data.length} attachments berhasil.`);
}

async function seedTicketMembers(ticketIds: string[]) {
  console.log('[SEED] Seeding ticket members...');
  const data = [
    { ticketId: ticketIds[0], userId: 'IT-001', userName: 'Budi Santoso' },
    { ticketId: ticketIds[0], userId: 'IT-002', userName: 'Andi Pratama' },
    { ticketId: ticketIds[1], userId: 'IT-002', userName: 'Andi Pratama' },
    { ticketId: ticketIds[2], userId: 'IT-003', userName: 'Dedi Kurniawan' },
    { ticketId: ticketIds[4], userId: 'IT-004', userName: 'Rizal Siregar' },
    { ticketId: ticketIds[5], userId: 'IT-001', userName: 'Budi Santoso' },
    { ticketId: ticketIds[6], userId: 'IT-002', userName: 'Andi Pratama' },
  ];
  for (const m of data) {
    await db.insert(ticketMembers).values({ id: randomId('TM'), createdAt: ts('2026-09-08'), ...m });
  }
  console.log(`[SEED] ${data.length} ticket members berhasil.`);
}

export async function seed() {
  console.log('='.repeat(50));
  console.log('[SEED] Mulai seeding data...');
  console.log('='.repeat(50));

  await cleanup();
  const hash = await bcrypt.hash('password123', 10);

  await seedUsers(hash);
  await seedCategories();
  await seedSubcategories();
  await seedVendors();
  await seedTechnicians();

  const ticketIds = (await seedTickets()).map(t => t.id);
  await seedWorklogs(ticketIds);
  await seedComments(ticketIds);
  await seedInternalNotes(ticketIds);
  await seedAuditLogs(ticketIds);
  await seedAttachments(ticketIds);
  await seedTicketMembers(ticketIds);

  console.log('='.repeat(50));
  console.log('[SEED] Semua data berhasil dimasukkan!');
  console.log('[SEED] Default password untuk semua user: password123');
  console.log('='.repeat(50));
}
