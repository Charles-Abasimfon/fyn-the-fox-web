import React from 'react';
import TopBar from '@/components/common/TopBar';

export default function HospitalityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='p-4 md:p-8'>
      <header>
        <TopBar />
      </header>
      <main>{children}</main>
    </div>
  );
}
