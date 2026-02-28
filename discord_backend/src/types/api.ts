export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: unknown;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string, errors?: unknown): ApiResponse {
  return {
    success: false,
    error,
    errors,
  };
}
