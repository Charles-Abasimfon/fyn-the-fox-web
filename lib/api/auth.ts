export interface ApiBaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T | null;
  errors?: any;
  statusCode?: number;
}

class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
import { getRuntimeApiBase } from './config';

const getBaseUrl = (): string => {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
};

async function handleJson<T>(res: Response): Promise<ApiBaseResponse<T>> {
  let json: ApiBaseResponse<T> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore parse error */
  }
  if (!res.ok) {
    const msg = json?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return json || { success: true, message: 'Success', data: null };
}

export interface ForgotPasswordPayload {
  email: string;
}
export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  const base = getBaseUrl();
  const res = await fetch(`${base}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email.trim() }),
  });
  return handleJson<null>(res);
};

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
export const resetPassword = async (payload: ResetPasswordPayload) => {
  const base = getBaseUrl();
  const res = await fetch(`${base}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: payload.token.trim(),
      newPassword: payload.newPassword,
    }),
  });
  return handleJson<null>(res);
};

export { ApiError };
