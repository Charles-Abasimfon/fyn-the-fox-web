import NextAuth, { DefaultSession } from 'next-auth';

// Augment the built-in types
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      firstName?: string;
      lastName?: string;
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
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    firstName?: string;
    lastName?: string;
    role?: string;
    error?: string;
  }
}
