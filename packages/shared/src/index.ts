/** Shared API error codes between web and api */
export const ApiErrorCode = {
  OK: 0,
  VALIDATION: 400001,
  UNAUTHORIZED: 401001,
  FORBIDDEN: 403001,
  NOT_FOUND: 404001,
  CONFLICT: 409001,
  RATE_LIMIT: 429001,
  LOCKED: 423001,
  SERVER: 500001,
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  code: number;
  message?: string;
  data?: T;
}
