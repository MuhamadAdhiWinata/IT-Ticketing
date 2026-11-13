// Spesifikasi kolom import CSV per jenis data. Dipakai server (validasi, template, ekspor) dan UI (petunjuk kolom).
// Urutan array = urutan impor yang disarankan: data induk lebih dulu (Perusahaan sebelum Divisi sebelum Pengguna).
export interface ImportColumn { name: string; required?: boolean; hint: string }
export interface ImportDataset {
  key: string;
  label: string;
  desc: string;
  columns: readonly ImportColumn[];
  example: readonly string[];
}

export const IMPORT_DATASETS = [
  {
    key: 'companies', label: 'Perusahaan', desc: 'Master Perusahaan/PT.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. COMP-001' },
      { name: 'nama', required: true, hint: 'Nama perusahaan (unik)' },
    ],
    example: ['COMP-001', 'PT Contoh Sejahtera'],
  },
  {
    key: 'divisions', label: 'Divisi', desc: 'Master Divisi; tiap divisi milik satu perusahaan. Impor Perusahaan lebih dulu.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. DIV-001' },
      { name: 'perusahaan', required: true, hint: 'id atau nama perusahaan yang sudah ada' },
      { name: 'nama', required: true, hint: 'Nama divisi' },
    ],
    example: ['DIV-001', 'COMP-001', 'Keuangan'],
  },
  {
    key: 'users', label: 'Pengguna', desc: 'Akun pengguna. Impor Perusahaan dan Divisi lebih dulu bila dipakai.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. USR-001' },
      { name: 'nama', required: true, hint: 'Nama lengkap' },
      { name: 'email', required: true, hint: 'Email login (unik)' },
      { name: 'peran', required: true, hint: 'id peran: USER_NON_IT, IT_WORKER, PM, DUTY_ENGINEER, SYSTEM_ADMIN, atau peran buatan sendiri' },
      { name: 'perusahaan', hint: 'id atau nama perusahaan; kosong = dari divisi' },
      { name: 'divisi', hint: 'id atau nama divisi' },
      { name: 'departemen', hint: 'Wajib bila divisi kosong' },
      { name: 'unit', hint: 'LNY, IIE, REN, atau Holding' },
      { name: 'pic', hint: 'YA atau TIDAK (PIC unit)' },
      { name: 'password', hint: 'Min. 8 karakter. Kosong: akun baru diberi password acak (ditampilkan sekali), akun lama tidak diubah' },
    ],
    example: ['USR-001', 'Rina Wulandari', 'rina@perusahaan.co.id', 'USER_NON_IT', 'PT Contoh Sejahtera', 'Keuangan', '', 'IIE', 'TIDAK', ''],
  },
  {
    key: 'categories', label: 'Kategori', desc: 'Kategori layanan IT (mis. Support IT, IT Programmer).',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. CAT-01' },
      { name: 'nama', required: true, hint: 'Nama kategori (unik)' },
    ],
    example: ['CAT-03', 'Infrastruktur'],
  },
  {
    key: 'projectKendala', label: 'Aplikasi / Kendala', desc: 'Aplikasi (IT Programmer) atau Kendala (Support IT) di bawah satu kategori. Impor Kategori lebih dulu.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. SCAT-001' },
      { name: 'kategori', required: true, hint: 'id atau nama kategori yang sudah ada' },
      { name: 'nama', required: true, hint: 'Nama aplikasi / kendala' },
    ],
    example: ['SCAT-001', 'IT Programmer', 'Aplikasi Contoh'],
  },
  {
    key: 'submodules', label: 'Modul', desc: 'Modul di bawah satu Aplikasi / Kendala. Impor Aplikasi / Kendala lebih dulu.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. SMOD-001' },
      { name: 'aplikasi', required: true, hint: 'id atau nama aplikasi/kendala (pakai id bila namanya kembar)' },
      { name: 'nama', required: true, hint: 'Nama modul' },
    ],
    example: ['SMOD-001', 'SCAT-001', 'Modul Contoh'],
  },
  {
    key: 'vendors', label: 'Vendor', desc: 'Vendor tujuan delegasi tiket.',
    columns: [
      { name: 'id', required: true, hint: 'Kode unik, mis. VND-001' },
      { name: 'nama', required: true, hint: 'Nama vendor (unik)' },
      { name: 'kontak', hint: 'Nama kontak' },
      { name: 'email', hint: 'Email kontak' },
      { name: 'telepon', hint: 'Nomor telepon' },
      { name: 'alamat', hint: 'Alamat' },
    ],
    example: ['VND-001', 'PT Vendor Contoh', 'Budi', 'budi@vendor.co.id', '08123456789', 'Jakarta'],
  },
] as const satisfies readonly ImportDataset[];

export type ImportKey = (typeof IMPORT_DATASETS)[number]['key'];
// Daftar bertipe longgar (kolom opsional punya `required` bertipe boolean | undefined) untuk iterasi.
export const IMPORT_LIST: readonly (ImportDataset & { key: ImportKey })[] = IMPORT_DATASETS;
export const IMPORT_KEYS = IMPORT_DATASETS.map(d => d.key) as [ImportKey, ...ImportKey[]];
