// CSV minimal (RFC 4180): kutip ganda, "" = satu kutip, sel boleh berisi baris baru, BOM dibuang.
// Pemisah (koma, titik koma, atau tab) dibaca dari baris "sep=," (dipakai Excel) atau dideteksi dari baris header:
// Excel berlokal Indonesia menyimpan CSV dengan titik koma.
export function parseCsv(text: string): string[][] {
  let src = text.replace(/^\uFEFF/, '');
  let delim = '';
  const sep = /^sep=(.)\r?\n/i.exec(src);
  if (sep) { delim = sep[1]!; src = src.slice(sep[0].length); }
  if (!delim) {
    const head = src.split(/\r?\n/, 1)[0] ?? '';
    delim = [',', ';', '\t'].map(d => ({ d, n: head.split(d).length })).sort((a, b) => b.n - a.n)[0]!.d;
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch !== '"') cell += ch;
      else if (src[i + 1] === '"') { cell += '"'; i++; }
      else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += ch;
  }
  if (quoted) throw new Error('Tanda kutip (") tidak ditutup; periksa isi file');
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

// Awalan ' mencegah sel diperlakukan sebagai rumus saat dibuka di Excel (=, +, -, @).
const guard = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

// Baris "sep=," membuat Excel (apa pun lokalnya) memisah kolom dengan koma; parseCsv membuangnya lagi.
export function toCsv(headers: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  const q = (v: string | number | null | undefined) => `"${guard(String(v ?? '')).replace(/"/g, '""')}"`;
  return `\uFEFFsep=,\r\n${[headers, ...rows].map(r => r.map(q).join(',')).join('\r\n')}\r\n`;
}
