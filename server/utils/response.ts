export function successResponse<T>(data: T, meta?: { total: number; page?: number; limit?: number }) {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function errorResponse(code: string, message: string, details?: string[]) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}
