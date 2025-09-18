import React from 'react';
import TopBar from '../../components/common/TopBar';

interface VendorsLayoutProps {
  children: React.ReactNode;
}

export default function VendorsLayout({ children }: VendorsLayoutProps) {
  return (
    <div className='p-4 md:p-8'>
      <header>
        <TopBar />
      </header>
      <main>{children}</main>
    </div>
  );
}
