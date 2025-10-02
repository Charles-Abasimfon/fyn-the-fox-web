import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Expected API login response shape
interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
  };
  errors?: any;
  statusCode?: number;
}

// Helper to decode a JWT expiry (returns ms epoch) safely
function decodeJwtExpiry(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload?.exp) return payload.exp * 1000; // convert s -> ms
  } catch {
    return null;
  }
  return null;
}

// Helper to decode full JWT payload
function decodeJwtPayload(token: string | undefined): any {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch {
    return null;
  }
}

async function refreshAccessToken(params: {
  accessToken?: string;
  refreshToken?: string;
}): Promise<{
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  refreshTokenExpires?: number | null;
  error?: string;
}> {
  const { refreshToken } = params;
  if (!refreshToken) {
    return { ...params, error: 'NoRefreshToken' };
  }
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!rawBase) return { ...params, error: 'MissingApiBase' };
  const baseUrl = rawBase.replace(/\/$/, '');
  try {
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        // API spec: send refresh-token in Authorization header. Some APIs expect 'Bearer <token>'.
        // If your API expects bare token, adjust below accordingly.
        Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
      // body could be empty if API only uses header; keep empty object to be explicit
      body: JSON.stringify({}),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ...params, error: 'RefreshAccessTokenError' };
    }
    const newAccess = json?.data?.access_token as string | undefined;
    const newRefresh = json?.data?.refresh_token as string | undefined;
    if (!newAccess || !newRefresh) {
      return { ...params, error: 'MalformedRefreshResponse' };
    }
    const accessTokenExpires =
      decodeJwtExpiry(newAccess) || Date.now() + 10 * 60 * 1000; // fallback 10m
    const refreshTokenExpires = decodeJwtExpiry(newRefresh); // may be 15m according to spec
    return {
      accessToken: newAccess,
      refreshToken: newRefresh,
      accessTokenExpires,
      refreshTokenExpires,
    };
  } catch (e) {
    console.error('Failed to refresh token', e);
    return { ...params, error: 'RefreshAccessTokenError' };
  }
}

const handler = NextAuth({
  // debug enabled for temporary investigation; disable when resolved
  debug: true,
  // NOTE: Removed custom cookies block so NextAuth can auto-select cookie names.
  // In production over HTTPS it will likely issue: __Secure-next-auth.session-token
  // (prefixed) rather than next-auth.session-token. Look for that name in DevTools.
  session: { strategy: 'jwt', maxAge: 60 * 60 },
  pages: { signIn: '/sign-in' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!rawBase) {
          throw new Error('NEXT_PUBLIC_API_BASE_URL env var not set');
        }
        const baseUrl = rawBase.replace(/\/$/, '');
        try {
          try {
            new URL(baseUrl);
          } catch {
            throw new Error(`Invalid NEXT_PUBLIC_API_BASE_URL: ${baseUrl}`);
          }

          const endpoint = `${baseUrl}/auth/login`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            let errMsg = 'Login failed';
            try {
              errMsg = (await res.json()).message || errMsg;
            } catch {
              /* ignore */
            }
            throw new Error(errMsg);
          }
          const json = await res.json();
          if (!json?.success || !json?.data?.access_token) {
            throw new Error(json?.message || 'Invalid login response');
          }
          return {
            id: json.data.access_token,
            accessToken: json.data.access_token,
            refreshToken: json.data.refresh_token,
          } as any;
        } catch (e: any) {
          console.error('Authorize error', e);
          throw new Error(e.message || 'Internal error');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('[auth][jwt] initial sign-in user present');
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires =
          decodeJwtExpiry(token.accessToken as string) ||
          Date.now() + 10 * 60 * 1000; // 10m fallback
        token.refreshTokenExpires =
          decodeJwtExpiry(token.refreshToken as string) ||
          Date.now() + 15 * 60 * 1000; // 15m fallback

        // Decode JWT payload to extract user info
        const payload = decodeJwtPayload(token.accessToken as string);
        if (payload) {
          token.userId = payload.id;
          token.email = payload.email;
          token.firstName = payload.first_name;
          token.lastName = payload.last_name;
          token.role = payload.role;
        }

        return token;
      }

      // If we don't have expiry info, return as-is.
      if (!token.accessTokenExpires) return token;

      const now = Date.now();

      // Access token still valid
      if (now < (token.accessTokenExpires as number) - 5 * 1000) {
        // small safety window
        return token;
      }

      // If refresh token appears expired, flag error => sign out
      if (
        token.refreshTokenExpires &&
        now >= (token.refreshTokenExpires as number)
      ) {
        return { ...token, error: 'RefreshTokenExpired' };
      }

      // Attempt refresh
      console.log('[auth][jwt] access token expired, attempting refresh');
      const refreshed = await refreshAccessToken({
        accessToken: token.accessToken as string | undefined,
        refreshToken: token.refreshToken as string | undefined,
      });

      if (refreshed.error || !refreshed.accessToken) {
        return {
          ...token,
          error: refreshed.error || 'RefreshAccessTokenError',
        };
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken || token.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
        refreshTokenExpires:
          refreshed.refreshTokenExpires || token.refreshTokenExpires,
        error: undefined,
      };
    },
    async session({ session, token }) {
      console.log('[auth][session] building session for userId:', token.userId);
      // Populate session with access token and user info
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;

      // Populate user object with decoded JWT data
      if (token.userId) {
        session.user = {
          id: token.userId as string,
          email: token.email as string,
          name: `${token.firstName || ''} ${token.lastName || ''}`.trim(),
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          role: token.role as string,
        };
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: { async signOut() {} },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
