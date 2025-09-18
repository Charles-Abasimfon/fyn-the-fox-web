import React from 'react';
import TopBar from '../../components/common/TopBar';

interface WorkOrdersLayoutProps {
  children: React.ReactNode;
}

export default function WorkOrdersLayout({ children }: WorkOrdersLayoutProps) {
  return (
    <div className='p-4 md:p-8'>
      <header>
        <TopBar />
      </header>
      <main>{children}</main>
    </div>
  );
}
