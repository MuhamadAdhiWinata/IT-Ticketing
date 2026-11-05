import DOMPurify from 'dompurify';

// Hanya tag yang dihasilkan editor Tiptap; form/input/select dibuang agar tidak bisa dipakai phishing.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'hr'];

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Konten lama tersimpan sebagai teks polos; konten baru berupa HTML dari Tiptap.
export function toSafeHtml(content: string | null | undefined): string {
  const raw = content ?? '';
  const isHtml = raw.trimStart().startsWith('<');
  if (!isHtml) return escapeHtml(raw).replace(/\n/g, '<br>');
  // ponytail: DOMPurify butuh DOM; saat SSR HTML di-escape, sanitasi asli jalan di client.
  if (typeof window === 'undefined') return escapeHtml(raw);
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel'] });
}

export function isRichTextEmpty(html: string): boolean {
  if (/<img\s/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
