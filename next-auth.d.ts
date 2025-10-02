import NextAuth, { DefaultSession } from 'next-auth';

// Augment the built-in types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user?: {
      name?: string | null;
      email?: string | null;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: string;
  }
}
