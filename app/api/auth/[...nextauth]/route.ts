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

const handler = NextAuth({
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
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        try {
          const [, payload] = (token.accessToken as string).split('.');
          const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
          token.accessTokenExpires = decoded.exp
            ? decoded.exp * 1000
            : Date.now() + 3600 * 1000;
        } catch {
          token.accessTokenExpires = Date.now() + 3600 * 1000;
        }
      }
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      )
        return token;
      return { ...token, error: 'RefreshAccessTokenError' };
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
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
