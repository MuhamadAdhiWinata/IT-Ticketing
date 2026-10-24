import { createError } from 'h3';

export function successResponse<T>(data: T, meta?: { total: number; page?: number; limit?: number }) {
  return meta ? { success: true, data, meta } : { success: true, data };
}

// Bentuk lama melempar objek biasa sehingga Nitro selalu menjawab 500;
// sekarang menghasilkan H3Error supaya kode status benar (401/403/400/405).
export function errorResponse(message: string, statusCode: number, details?: string[]) {
  return createError({ statusCode, statusMessage: message, data: details ? { details } : undefined });
}
