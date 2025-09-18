import React from 'react';
import TopBar from '../../components/common/TopBar';

interface OverviewLayoutProps {
  children: React.ReactNode;
}

export default function OverviewLayout({ children }: OverviewLayoutProps) {
  return (
    <div className='p-8'>
      <header className='overview-header'>
        <TopBar />
      </header>
      <main className='overview-content'>{children}</main>
    </div>
  );
}
