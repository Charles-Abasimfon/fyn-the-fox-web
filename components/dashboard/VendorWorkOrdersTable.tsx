'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

export type VendorOrderStatus =
  | 'Assigned'
  | 'Completed'
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Estimate needed'
  | 'Resident confirmation'
  | 'Pending vendors acceptance';

export interface VendorWorkOrderItem {
  id: string;
  tenantName: string;
  complaint: string;
  propertyAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VendorOrderStatus;
}

export interface VendorWorkOrdersTableProps {
  items: VendorWorkOrderItem[];
  onAccept?: (item: VendorWorkOrderItem) => void | Promise<void>;
  onComplete?: (item: VendorWorkOrderItem) => void | Promise<void>;
  onNeedsEstimate?: (item: VendorWorkOrderItem) => void | Promise<void>;
  onView?: (item: VendorWorkOrderItem) => void;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Assigned':
    case 'Pending':
    case 'Scheduled':
    case 'In Progress':
    case 'Estimate needed':
    case 'Resident confirmation':
    case 'Pending vendors acceptance':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Completed':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Assigned':
      return '/icons/assigned.svg';
    case 'Completed':
      return '/icons/completed-16.svg';
    case 'In Progress':
      return '/icons/dot.svg';
    default:
      return '/icons/dot.svg';
  }
};

const VendorWorkOrdersTable: React.FC<VendorWorkOrdersTableProps> = ({
  items,
  onAccept,
  onComplete,
  onNeedsEstimate,
  onView,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [gotoValue, setGotoValue] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) =>
      q
        ? c.tenantName.toLowerCase().includes(q) ||
          c.complaint.toLowerCase().includes(q) ||
          c.propertyAddress.toLowerCase().includes(q)
        : true
    );
  }, [items, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(currentPage * pageSize, total);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getPageSeries = (n: number, cur: number) => {
    const pages: (number | string)[] = [];
    if (n <= 7) {
      for (let i = 1; i <= n; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (cur <= 4) {
      pages.push(2, 3, 4, '...', n);
      return pages;
    }
    if (cur >= n - 3) {
      pages.push('...', n - 3, n - 2, n - 1, n);
      return pages;
    }
    pages.push('...', cur - 1, cur, cur + 1, '...', n);
    return pages;
  };

  return (
    <div className='bg-[#FFFFFF05] rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-white text-lg font-semibold'>My work orders</h2>
        {/* Search */}
        <div className='relative w-full sm:w-80'>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search'
            className='w-full h-9 bg-[#141414] border border-[#434343] rounded-md px-3 text-sm font-medium text-white placeholder:text-[#BDBDBE] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pl-8'
          />
          <span className='pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#BDBDBE]'>
            <svg
              className='size-4'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <circle cx='11' cy='11' r='7' />
              <path d='M21 21l-4-4' />
            </svg>
          </span>
        </div>
      </div>

      {/* Table - responsive container */}
      <div className='overflow-x-auto mb-3 rounded-2xl overflow-hidden bg-[#FFFFFF05]'>
        <table className='w-full'>
          <thead>
            <tr className='bg-[#F4F4F50A] py-2'>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Tenant & Complaint
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Property Address
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Scheduled
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Status
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-14 px-4'>
                  <div className='flex flex-col items-center justify-center text-center gap-3'>
                    <img
                      src='/icons/complaint.svg'
                      alt='No results'
                      className='size-10 opacity-80'
                    />
                    <div className='text-white font-semibold'>
                      No work orders found
                    </div>
                    <p className='text-[#BDBDBE] text-sm max-w-[520px]'>
                      New work orders assigned to you will appear here.
                    </p>
                    <div className='pt-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='cursor-pointer'
                        onClick={() => setSearch('')}
                      >
                        Clear search
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((c) => (
                <tr
                  key={c.id}
                  className='border-b border-[#FFFFFF10] hover:bg-[#FFFFFF05]'
                >
                  <td className='py-4 px-4'>
                    <div>
                      <div className='text-white font-semibold text-sm'>
                        {c.tenantName}
                      </div>
                      <div className='text-[#BDBDBE] text-xs font-medium'>
                        {c.complaint}
                      </div>
                    </div>
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {c.propertyAddress}
                  </td>
                  <td className='py-4 px-4'>
                    <div>
                      <div className='text-white text-sm font-medium'>
                        {c.scheduledDate}
                      </div>
                      <div className='text-white text-center font-medium text-sm flex items-center gap-2 justify-center'>
                        <span className='size-1 rounded-full bg-white'></span>
                        {c.scheduledTime}
                      </div>
                    </div>
                  </td>
                  <td className='py-4 px-4'>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
                        c.status
                      )}`}
                    >
                      <img
                        src={getStatusIcon(c.status)}
                        alt={c.status}
                        className='flex-shrink-0'
                      />
                      {c.status}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className='text-[#BDBDBE] hover:text-white inline-flex items-center justify-center rounded-md p-1.5 hover:bg-[#FFFFFF12]'
                          aria-label='Open actions'
                        >
                          <MoreVertical className='w-5 h-5' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-64 bg-[#27272B] border-[#434343] text-white px-4'
                      >
                        <DropdownMenuItem
                          onClick={() => onView?.(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                        >
                          <img src='/icons/eye.svg' alt='View' />
                          <span className='text-sm font-medium'>
                            View Details
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => onAccept?.(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          disabled={c.status !== 'Pending vendors acceptance'}
                        >
                          <img src='/icons/user.svg' alt='Accept' />
                          <span className='text-sm font-medium'>
                            Accept Work Order
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => onComplete?.(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          disabled={c.status === 'Completed'}
                        >
                          <img src='/icons/completed-16.svg' alt='Complete' />
                          <span className='text-sm font-medium'>
                            Mark Completed
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => onNeedsEstimate?.(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          disabled={
                            c.status === 'Completed' ||
                            c.status === 'Estimate needed'
                          }
                        >
                          <img
                            src='/icons/in-progress.svg'
                            alt='Estimate needed'
                          />
                          <span className='text-sm font-medium'>
                            Needs Estimate
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer - pagination */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-3 text-xs text-[#BDBDBE]'>
          {/* Left: Rows per page */}
          <div className='flex items-center gap-2'>
            <span className='whitespace-nowrap'>Rows per Page</span>
            <select
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className='h-7 bg-transparent border border-[#434343] text-white rounded-md px-2'
            >
              <option value='8'>8</option>
              <option value='10'>10</option>
              <option value='20'>20</option>
              <option value='50'>50</option>
            </select>
          </div>

          {/* Middle: page numbers + Next + Go to Page */}
          <div className='flex items-center gap-2 flex-wrap'>
            <button
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              disabled={currentPage <= 1}
              className='h-7 px-3 rounded-md border text-white inline-flex items-center gap-1 bg-[#FFFFFF0A] border-[#E2E8F00F] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFFFFF12]'
            >
              <ChevronLeft className='w-4 h-4' />
              <span>Prev</span>
            </button>
            {getPageSeries(totalPages, currentPage).map((p, idx) =>
              p === '...' ? (
                <span key={`e-${idx}`} className='px-2'>
                  ...
                </span>
              ) : (
                <button
                  key={p as number}
                  onClick={() => setPage(p as number)}
                  className={
                    'h-7 min-w-7 px-2 rounded-md border text-white bg-[#FFFFFF0A] border-[#E2E8F00F] hover:bg-[#FFFFFF12] ' +
                    ((p as number) === currentPage ? 'font-semibold' : '')
                  }
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className='h-7 px-3 rounded-md border text-white inline-flex items-center gap-1 bg-[#FFFFFF0A] border-[#E2E8F00F] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFFFFF12]'
            >
              <span>Next</span>
              <ChevronRight className='w-4 h-4' />
            </button>
            <span className='ml-3'>Go to Page</span>
            <input
              type='number'
              min={1}
              max={totalPages}
              placeholder={`${currentPage}`}
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              className='h-7 w-16 bg-transparent border border-[#434343] rounded-md px-2 text-white'
            />
            <button
              onClick={() => {
                const n = Number(gotoValue);
                if (!Number.isFinite(n)) return;
                const clamped = Math.min(Math.max(1, n), totalPages);
                setPage(clamped);
                setGotoValue('');
              }}
              className='h-7 px-3 rounded-md border text-white bg-[#FFFFFF0A] border-[#E2E8F00F] hover:bg-[#FFFFFF12] inline-flex items-center gap-1'
            >
              Go
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>

          <div className='ml-auto sm:ml-0 whitespace-nowrap'>
            Showing {startIndex} - {endIndex} of {total}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorWorkOrdersTable;
