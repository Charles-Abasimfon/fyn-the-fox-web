'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreVertical,
  Pencil,
  RefreshCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface VendorRow {
  id: number | string;
  name: string;
  email: string;
  designation: string; // e.g. Plumbing, Electrician
  registeredOn: string; // formatted date e.g. "Apr 12, 2023 - 14:00"
  status: 'Active' | 'In-active' | 'Assigned';
}

export interface VendorsTableProps {
  vendors: VendorRow[];
  onAddVendor?: () => void | Promise<void>;
  onViewVendor?: (v: VendorRow) => void | Promise<void>;
  onEditVendor?: (v: VendorRow) => void | Promise<void>;
  onDeleteVendor?: (v: VendorRow) => void | Promise<void>;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'In-active':
    case 'Assigned':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Active':
      return '/icons/dot-green.svg';
    case 'Assigned':
      return '/icons/dot.svg';
    case 'In-active':
    default:
      return '/icons/dot.svg';
  }
};

const VendorsTable: React.FC<VendorsTableProps> = ({
  vendors,
  onAddVendor,
  onViewVendor,
  onEditVendor,
  onDeleteVendor,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Active' | 'In-active' | 'Assigned'
  >('All');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(8);
  const [gotoValue, setGotoValue] = useState<string>('');

  const dateLabel = useMemo(
    () =>
      date
        ? date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Custom date',
    [date]
  );

  const filtered = useMemo(() => {
    const matchesStatus = (s: string) =>
      statusFilter === 'All' ? true : s === statusFilter;
    const matchesDate = (reg: string) => {
      if (!date) return true;
      // try to parse "Apr 12, 2023" at the beginning of the string
      const firstPart = reg.split('-')[0].trim();
      const d = new Date(firstPart);
      if (isNaN(d.getTime())) return true; // tolerate malformed
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const sel = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dOnly.getTime() === sel.getTime();
    };
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const byStatus = matchesStatus(v.status);
      const byDate = matchesDate(v.registeredOn);
      const bySearch = !q
        ? true
        : v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.designation.toLowerCase().includes(q);
      return byStatus && byDate && bySearch;
    });
  }, [vendors, statusFilter, date, search]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, date, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const getPageSeries = (n: number, cur: number) => {
    // returns array of numbers and '...'
    const pages: (number | string)[] = [];
    if (n <= 7) {
      for (let i = 1; i <= n; i++) pages.push(i);
      return pages;
    }
    const add = (x: number | string) => pages.push(x);
    add(1);
    if (cur <= 4) {
      add(2);
      add(3);
      add(4);
      add('...');
      add(n);
      return pages;
    }
    if (cur >= n - 3) {
      add('...');
      add(n - 3);
      add(n - 2);
      add(n - 1);
      add(n);
      return pages;
    }
    add('...');
    add(cur - 1);
    add(cur);
    add(cur + 1);
    add('...');
    add(n);
    return pages;
  };

  return (
    <div className='bg-[#FFFFFF05] rounded-lg overflow-hidden'>
      {/* Header with title and actions */}
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-white text-lg font-semibold'>All vendors</h2>
      </div>

      <div className='flex items-center justify-between pb-4'>
        {/* Filters row */}
        <div className='flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:flex-1'>
          {/* Grouped filters with dividers (match ComplaintsTable) */}
          <div className='flex w-full sm:w-auto flex-col items-stretch rounded-md border border-[#434343] overflow-hidden sm:inline-flex sm:flex-row sm:divide-x sm:divide-[#434343]'>
            {/* Status Select */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger
                size='default'
                className='w-full min-w-0 justify-between bg-transparent border-0 border-b border-[#434343] sm:border-b-0 rounded-none text-white h-9 px-4 cursor-pointer sm:w-auto sm:min-w-[160px]'
              >
                <SelectValue placeholder='All status' />
              </SelectTrigger>
              <SelectContent className='p-0 bg-[#141414] border-transparent text-white w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]'>
                <SelectItem value='All'>All status</SelectItem>
                <SelectItem value='Active'>Active</SelectItem>
                <SelectItem value='In-active'>In-active</SelectItem>
                <SelectItem value='Assigned'>Assigned</SelectItem>
              </SelectContent>
            </Select>

            {/* Date popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className='data-[placeholder]:text-muted-foreground flex items-center justify-between gap-2 bg-transparent h-9 px-4 text-sm text-white whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 rounded-none border-0 hover:bg-transparent hover:text-white w-full min-w-0 cursor-pointer sm:w-[180px]'
                  aria-label='Custom date'
                >
                  <span className='truncate'>{dateLabel}</span>
                  <svg
                    className='size-4 text-white'
                    viewBox='0 0 16 16'
                    fill='currentColor'
                    xmlns='http://www.w3.org/2000/svg'
                    aria-hidden
                  >
                    <path d='M4.5 6.5l3.5 3.5 3.5-3.5H4.5z' />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align='end'
                className='w-auto overflow-hidden p-0 bg-[#141414] border-[#434343] text-white'
              >
                <Calendar
                  mode='single'
                  selected={date}
                  captionLayout='dropdown'
                  onSelect={(d) => setDate(d)}
                />
                <div className='flex items-center justify-end p-2 pt-0'>
                  <button
                    className='h-8 px-3 text-sm text-[#BDBDBE] hover:text-white rounded-md hover:bg-[#FFFFFF12]'
                    onClick={() => setDate(undefined)}
                  >
                    Clear
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search input */}
          <div className='relative flex-1 min-w-[280px] max-w-sm'>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search'
              className='w-full max-w-md h-9 bg-[#141414] border border-[#434343] rounded-md px-3 text-sm font-medium text-white placeholder:text-[#BDBDBE] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pl-8'
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
        <div className='flex items-center gap-2 px-4'>
          <Button
            className='cursor-pointer px-8 font-bold'
            onClick={() => onAddVendor?.()}
          >
            Add Vendor
          </Button>
          {/* refresh icon placeholder */}
          <button
            className='text-white bg-[#FFFFFF0A] hover:text-white inline-flex items-center justify-center rounded-full p-2 hover:bg-[#FFFFFF12]'
            aria-label='Refresh'
            onClick={() => {
              // no-op for now
            }}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto mx-3 mb-3 rounded-2xl overflow-hidden bg-[#FFFFFF05]'>
        <table className='w-full'>
          <thead>
            <tr className='bg-[#F4F4F50A] py-2'>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Vendor & email
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Designation
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Registered on
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
                      src='/icons/user-business.svg'
                      alt='No vendors'
                      className='size-10 opacity-80'
                    />
                    <div className='text-white font-semibold'>
                      No vendors found
                    </div>
                    <p className='text-[#BDBDBE] text-sm max-w-[520px]'>
                      Try adjusting your filters or search query.
                    </p>
                    <div className='pt-1'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='cursor-pointer'
                        onClick={() => {
                          setStatusFilter('All');
                          setDate(undefined);
                          setSearch('');
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((v) => (
                <tr
                  key={v.id}
                  className='border-b border-[#FFFFFF10] hover:bg-[#FFFFFF05]'
                >
                  <td className='py-4 px-4'>
                    <div>
                      <div className='text-white font-semibold text-sm'>
                        {v.name}
                      </div>
                      <div className='text-[#BDBDBE] text-xs font-medium'>
                        {v.email}
                      </div>
                    </div>
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {v.designation}
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {v.registeredOn}
                  </td>
                  <td className='py-4 px-4'>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
                        v.status
                      )}`}
                    >
                      <img
                        src={getStatusIcon(v.status)}
                        alt={v.status}
                        className='flex-shrink-0'
                      />
                      {v.status}
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
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          onClick={() => onViewVendor?.(v)}
                        >
                          <img src='/icons/eye.svg' alt='View' />
                          <span className='text-sm font-medium'>
                            View Vendor Details
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          onClick={() => onEditVendor?.(v)}
                        >
                          <img src='/icons/user.svg' alt='View' />
                          <span className='text-sm font-medium'>
                            Edit Vendor Info
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          onClick={() => onDeleteVendor?.(v)}
                        >
                          <img src='/icons/delete.svg' alt='Delete' />
                          <span className='text-sm font-medium'>
                            Delete Vendor
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
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const size = parseInt(v, 10);
                setPageSize(size);
                setPage(1);
              }}
            >
              <SelectTrigger
                size='sm'
                className='h-7 bg-transparent border-[#434343] text-white'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='bg-[#141414] border-transparent text-white'>
                <SelectItem value='8'>8</SelectItem>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Middle: page numbers + Next + Go to Page */}
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Prev */}
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

          {/* Right: showing summary */}
          <div className='ml-auto sm:ml-0 whitespace-nowrap'>
            Showing {startIndex} - {endIndex} of {total}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorsTable;
