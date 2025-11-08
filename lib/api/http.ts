'use client';

import { getSession, signOut } from 'next-auth/react';
import { ApiError } from './auth';
import { getRuntimeApiBase } from './config';

let latestAccessToken: string | undefined;

/**
 * fetchWithAuth
 * - Attaches Authorization: Bearer <token>
 * - On 401, calls backend refresh-token endpoint with refresh token (Bearer)
 * - If refresh succeeds: retries once with new access token
 * - If refresh fails due to invalid/expired refresh token: silently signs out the user
 * - If still 401 after retry: signs out and throws a generic 401 to halt further work
 */
export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
  token: string
): Promise<Response> {
  const doFetch = async (bearer: string) => {
    const headers = new Headers(init.headers as HeadersInit);
    headers.set('Authorization', `Bearer ${bearer}`);
    return fetch(url, { ...init, headers });
  };

  const first = await doFetch(latestAccessToken || token);
  if (first.status !== 401) return first;

  // On 401: call backend refresh endpoint directly using refresh-token as Bearer
  const session = await getSession();
  const refreshToken = (session as any)?.refreshToken as string | undefined;
  try {
    const base = getRuntimeApiBase();
    if (!refreshToken) throw new Error('Missing refresh token');
    const res = await fetch(`${base}/auth/refresh-token`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    // If refresh indicates invalid/expired refresh token, sign out user immediately
    const isInvalidRefresh =
      (!res.ok || json?.success === false) &&
      typeof json?.message === 'string' &&
      json.message.toLowerCase().includes('invalid or expired refresh token');
    if (isInvalidRefresh || json?.statusCode === 400) {
      // Sign out silently and redirect to sign-in; avoid leaking technical errors to UI
      await signOut({ callbackUrl: '/sign-in', redirect: true });
      throw new ApiError('Please sign in again', 401);
    }

    if (res.ok) {
      const newAccess = json?.data?.access_token as string | undefined;
      const newRefresh = json?.data?.refresh_token as string | undefined;
      // Retry once with refreshed access token and cache it for subsequent calls
      if (newAccess) {
        latestAccessToken = newAccess;
        const second = await doFetch(newAccess);
        if (second.status === 401) {
          await signOut({ callbackUrl: '/sign-in', redirect: true });
          throw new ApiError('Please sign in again', 401);
        }
        return second;
      }
    }
  } catch {
    // fall through to sign out
  }
  const hadError = Boolean((session as any)?.error);
  // Throw only after attempting refresh
  await signOut({ callbackUrl: '/sign-in', redirect: true });
  throw new ApiError('Please sign in again', 401);
}
