import React from 'react';
import VendorTopBar from '@/components/common/VendorTopBar';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <div className='p-4 md:p-8'>
      <header>
        <VendorTopBar />
      </header>
      <main>{children}</main>
    </div>
  );
}
