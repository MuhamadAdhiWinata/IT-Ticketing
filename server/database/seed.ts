import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcryptjs';
import { db } from './client';
import { users, categories, subcategories, vendors, technicians } from './schema';

export async function seed() {
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Insert users individually
  for (const u of [
    { id: 'USR-001', name: 'Rina Wulandari', email: 'rina.wulandari@company.co.id', passwordHash: defaultPassword, role: 'USER_NON_IT', department: 'Finance & Accounting', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'IT-001', name: 'Budi Santoso', email: 'budi.santoso@it.company.co.id', passwordHash: defaultPassword, role: 'IT_WORKER', department: 'IT Support & Hardware', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'IT-002', name: 'Andi Pratama', email: 'andi.pratama@it.company.co.id', passwordHash: defaultPassword, role: 'IT_WORKER', department: 'Software Engineering', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'IT-003', name: 'Dedi Kurniawan', email: 'dedi.kurniawan@it.company.co.id', passwordHash: defaultPassword, role: 'IT_WORKER', department: 'Network & Infrastructure', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 'IT-004', name: 'Rizal Siregar', email: 'rizal.siregar@it.company.co.id', passwordHash: defaultPassword, role: 'IT_WORKER', department: 'DevOps & Database', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { id: 'ADMIN-001', name: 'Administrator IT', email: 'sysadmin@company.co.id', passwordHash: defaultPassword, role: 'SYSTEM_ADMIN', department: 'Enterprise IT Governance', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  ]) {
    await db.insert(users).values(u).onDuplicateKeyUpdate({ set: u });
  }

  for (const c of [
    { id: 'CAT-01', name: 'Support IT' },
    { id: 'CAT-02', name: 'IT Programmer' },
  ]) {
    await db.insert(categories).values(c).onDuplicateKeyUpdate({ set: c });
  }

  for (const s of [
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
    { id: 'SUB-019', categoryId: 'CAT-02', name: 'Release, Deployment, dan Distribusi ERP Desktop Dev Trial' },
    { id: 'SUB-020', categoryId: 'CAT-02', name: 'Release, Deployment, dan Distribusi ERP Desktop Production' },
    { id: 'SUB-021', categoryId: 'CAT-02', name: 'Maintenance ERP Web' },
    { id: 'SUB-022', categoryId: 'CAT-02', name: 'Penanganan Bug ERP Web' },
    { id: 'SUB-023', categoryId: 'CAT-02', name: 'Permintaan Penambahan Fitur Baru ERP Web' },
    { id: 'SUB-024', categoryId: 'CAT-02', name: 'Perubahan Fitur Sistem (Modifikasi) ERP Web' },
    { id: 'SUB-025', categoryId: 'CAT-02', name: 'Release dan Pengujian Lingkungan Dev Trial' },
    { id: 'SUB-026', categoryId: 'CAT-02', name: 'Release dan Deployment ERP Web Production' },
    { id: 'SUB-027', categoryId: 'CAT-02', name: 'Integrasi API & Webhook Service Eksternal' },
    { id: 'SUB-028', categoryId: 'CAT-02', name: 'Optimasi Performa Query & Tuning Database' },
  ]) {
    await db.insert(subcategories).values(s).onDuplicateKeyUpdate({ set: s });
  }

  for (const v of [
    { id: 'VND-01', name: 'PT Mitra Solusi Printer', serviceType: 'Perbaikan Printer, Mesin Fotokopi, dan Suplai Toner', contactPerson: 'Pak Bambang Sudibyo', phone: '0812-9988-7711' },
    { id: 'VND-02', name: 'PT Telkom Akses Prima', serviceType: 'Infrastruktur Fiber Optic, Backbone Internet, Router Cisco', contactPerson: 'Ibu Ratna Dewi', phone: '0811-3322-1144' },
    { id: 'VND-03', name: 'CV Sentra Servis Komputer', serviceType: 'Pergantian Motherboard, Reballing Chipset, Panel LCD', contactPerson: 'Pak Dimas Anggoro', phone: '0813-5566-7788' },
  ]) {
    await db.insert(vendors).values(v).onDuplicateKeyUpdate({ set: v });
  }

  for (const t of [
    { id: 'TEK-01', name: 'Pak Joko Susanto', specialty: 'Teknisi Listrik Gedung & Crimping Kabel UTP', phone: '0878-1122-3344' },
    { id: 'TEK-02', name: 'Mas Fajar Nugroho', specialty: 'Teknisi PABX & Setting Telepon Meja', phone: '0896-4455-6677' },
  ]) {
    await db.insert(technicians).values(t).onDuplicateKeyUpdate({ set: t });
  }

  console.log('[SEED] Data master berhasil dimasukkan.');
  console.log('[SEED] Default password for all users: password123');
}
