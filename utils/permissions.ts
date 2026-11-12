// RBAC dinamis. Peran, klaim, dan menu tersimpan di DB (tabel roles, permissions, role_permissions, menus)
// dan diatur SYSTEM_ADMIN. File ini: katalog bawaan (benih DB + cadangan saat DB belum dimuat) dan
// registry sinkron `roleHas` yang dipakai server maupun UI.
export const ADMIN_ROLE = 'SYSTEM_ADMIN';

export interface PermissionDef { key: string; label: string; group: string }
export interface MenuDef { id: string; label: string; icon: string; section: string; sortOrder: number }
export interface RoleDef { id: string; name: string; description: string; claims: string[] }
export type RbacMatrix = Record<string, string[]>;

export const CLAIM = {
  IT: 'it.access',
  TRIAGE: 'ticket.triage',
  DUTY: 'ticket.duty',
  INTAKE: 'ticket.intake',
  DELETE_TICKET: 'ticket.delete',
  VIEW_ALL_WORKLOGS: 'worklog.view_all',
  MANAGE_MASTER: 'master.manage',
  MANAGE_SETTINGS: 'settings.manage',
} as const;

// Menu "access" (kelola hak akses) khusus SYSTEM_ADMIN: tidak punya klaim, tidak bisa diberikan ke peran lain.
export const ACCESS_MENU = 'access';

// Klaim operasional tiket: milik PM / Duty Engineer. SYSTEM_ADMIN hanya mengurus sistem (hak akses, master, pengaturan)
// sehingga TIDAK otomatis lolos klaim ini; beri lewat peran lain bila perlu.
export const OPERATIONAL_CLAIMS: string[] = [CLAIM.TRIAGE, CLAIM.DUTY];

export const MENUS: MenuDef[] = [
  { id: 'tracking', label: 'Tracking', icon: 'Search', section: 'Menu Utama', sortOrder: 10 },
  { id: 'my-tickets', label: 'Tiket Saya', icon: 'ClipboardList', section: 'Menu Utama', sortOrder: 20 },
  { id: 'dashboard', label: 'Dashboard', icon: 'Kanban', section: 'Menu Utama', sortOrder: 30 },
  { id: 'my-work', label: 'Pekerjaan Saya', icon: 'Briefcase', section: 'Menu Utama', sortOrder: 40 },
  { id: 'daily-work', label: 'Log Harian', icon: 'CalendarDays', section: 'Menu Utama', sortOrder: 50 },
  { id: 'reports', label: 'Laporan', icon: 'FileSpreadsheet', section: 'Menu Utama', sortOrder: 60 },
  { id: 'admin', label: 'Master Data', icon: 'Settings', section: 'Data Master', sortOrder: 70 },
  { id: 'settings', label: 'Pengaturan', icon: 'SlidersHorizontal', section: 'Pengaturan', sortOrder: 80 },
  { id: 'mcp-token', label: 'Token MCP', icon: 'KeyRound', section: 'Pengaturan', sortOrder: 90 },
  { id: ACCESS_MENU, label: 'Hak Akses', icon: 'ShieldCheck', section: 'Pengaturan', sortOrder: 100 },
];

export const PERMISSIONS: PermissionDef[] = [
  ...MENUS.filter(m => m.id !== ACCESS_MENU).map(m => ({ key: `menu.${m.id}`, label: `Menu ${m.label}`, group: 'Menu' })),
  { key: CLAIM.IT, label: 'Akses tim IT (kerjakan tiket, catatan internal, jadi Pelaksana, token MCP)', group: 'Tiket' },
  { key: CLAIM.TRIAGE, label: 'PM: akui, triase, mulai dikerjakan, tugaskan pelaksana, tutup tiket', group: 'Tiket' },
  { key: CLAIM.DUTY, label: 'Konfirmasi Duty Engineer untuk Insiden P1/P2', group: 'Tiket' },
  { key: CLAIM.INTAKE, label: 'Buat tiket atas nama pengguna dan pilih Kanal Asal', group: 'Tiket' },
  { key: CLAIM.DELETE_TICKET, label: 'Hapus tiket', group: 'Tiket' },
  { key: CLAIM.VIEW_ALL_WORKLOGS, label: 'Lihat Log Harian semua worker', group: 'Tiket' },
  { key: CLAIM.MANAGE_MASTER, label: 'Kelola data master dan pengguna', group: 'Administrasi' },
  { key: CLAIM.MANAGE_SETTINGS, label: 'Ubah pengaturan perusahaan', group: 'Administrasi' },
];

const REQUESTER = ['menu.tracking', 'menu.my-tickets'];
const IT = [...REQUESTER, CLAIM.IT, 'menu.dashboard', 'menu.my-work', 'menu.daily-work', 'menu.mcp-token'];

export const DEFAULT_ROLES: RoleDef[] = [
  { id: 'USER_NON_IT', name: 'Pengguna (Non-IT)', description: 'Pemohon tiket', claims: REQUESTER },
  { id: 'IT_WORKER', name: 'IT Worker', description: 'Pelaksana tim IT', claims: IT },
  { id: 'PM', name: 'PM', description: 'Triase dan penugasan tiket', claims: [...IT, CLAIM.TRIAGE, CLAIM.INTAKE] },
  { id: 'DUTY_ENGINEER', name: 'Duty Engineer', description: 'Konfirmasi insiden P1/P2', claims: [...IT, CLAIM.DUTY, CLAIM.INTAKE] },
  { id: ADMIN_ROLE, name: 'System Admin', description: 'Administrator sistem: semua klaim kecuali operasional tiket (PM/Duty), tidak dapat diubah', claims: PERMISSIONS.map(p => p.key).filter(k => !OPERATIONAL_CLAIMS.includes(k)) },
];

let matrix: RbacMatrix = Object.fromEntries(DEFAULT_ROLES.map(r => [r.id, r.claims]));

export const setRbacMatrix = (m: RbacMatrix) => { matrix = m; };
export const getRbacMatrix = (): RbacMatrix => matrix;

// SYSTEM_ADMIN lolos semua klaim non-operasional: terkunci di kode agar admin tidak bisa mengunci dirinya sendiri.
export const roleHas = (role: string | null | undefined, key: string): boolean =>
  !!role && ((role === ADMIN_ROLE && !OPERATIONAL_CLAIMS.includes(key)) || !!matrix[role]?.includes(key));

export const claimsOf = (role: string | null | undefined): string[] =>
  role === ADMIN_ROLE ? PERMISSIONS.map(p => p.key).filter(k => !OPERATIONAL_CLAIMS.includes(k)) : (role ? matrix[role] ?? [] : []);

export const rolesWith = (key: string): string[] =>
  [...new Set([ADMIN_ROLE, ...Object.keys(matrix)])].filter(r => roleHas(r, key));

export const menuAllowed = (role: string | null | undefined, menuId: string): boolean =>
  menuId === ACCESS_MENU ? role === ADMIN_ROLE : roleHas(role, `menu.${menuId}`);
