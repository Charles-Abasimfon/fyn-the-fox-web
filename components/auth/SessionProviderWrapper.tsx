'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

// Inner watcher: only sign out when the refresh token is actually expired.
// Do NOT auto sign out on transient refresh failures — allow client fetch to retry.
function SessionErrorWatcher() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error === 'RefreshTokenExpired') {
      signOut({ callbackUrl: '/sign-in' });
    }
  }, [session?.error]);
  return null;
}

export default function SessionProviderWrapper({ children }: Props) {
  return (
    <SessionProvider>
      <SessionErrorWatcher />
      {children}
    </SessionProvider>
  );
}
