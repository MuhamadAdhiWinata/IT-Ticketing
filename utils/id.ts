// Pembuat ID otomatis untuk master data (Kategori, Project/Kendala, Sub Modul,
// Perusahaan, Divisi, Pengguna).
//
// Nomor berikutnya dihitung dari ID tertinggi yang sudah ada, bukan dari jumlah
// record. `length + 1` menghasilkan ID yang menabrak data lama begitu ada record
// dihapus: dengan 26 record tersisa, ID berikutnya dihitung "027" padahal "027"
// masih terpakai, lalu INSERT gagal sebagai Duplicate entry.
//
// Hanya ID berformat `PREFIX-NNN` (1-4 digit) yang dihitung. Yang diabaikan:
//   - ID seed non-numerik: `COMP-MAJU`, `DIV-KEUANGAN`
//   - Sisa ID lama berformat timestamp: `CAT-1792466679026`
// Keduanya tidak mungkin bentrok dengan hasil karena formatnya berbeda.

export function nextId(list: Array<{ id: string }>, prefix: string): string {
  const pattern = new RegExp(`^${prefix}-(\\d{1,4})$`);

  const highest = list
    .map((item) => Number(item.id.match(pattern)?.[1]))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);

  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}
