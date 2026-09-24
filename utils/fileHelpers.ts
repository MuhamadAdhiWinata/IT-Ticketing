const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const PDF_EXTS = ['pdf'];

function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx > -1 ? fileName.slice(idx + 1).toLowerCase() : '';
}

export function isImage(fileName: string): boolean {
  return IMAGE_EXTS.includes(getExt(fileName));
}

export function isPdf(fileName: string): boolean {
  return PDF_EXTS.includes(getExt(fileName));
}

export type FileTypeCategory = 'image' | 'pdf' | 'document' | 'other';

export function getFileType(fileName: string): FileTypeCategory {
  const ext = getExt(fileName);
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (PDF_EXTS.includes(ext)) return 'pdf';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'rtf', 'odt', 'ods', 'odp'].includes(ext)) return 'document';
  return 'other';
}

export function getFileExtLabel(fileName: string): string {
  const ext = getExt(fileName);
  return ext ? ext.toUpperCase() : 'FILE';
}
