'use client';

import React, { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';

interface Props {
  children: React.ReactNode;
}

// Inner watcher to auto sign out when token error is flagged
function SessionErrorWatcher() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
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
