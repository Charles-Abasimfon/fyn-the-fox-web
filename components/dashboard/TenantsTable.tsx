'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TenantRow {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  unit?: string;
  registeredOn?: string;
}

export interface TenantsTableProps {
  tenants: TenantRow[];
  onAddTenant?: () => void | Promise<void>;
  onView?: (t: TenantRow) => void | Promise<void>;
  onDelete?: (t: TenantRow) => void | Promise<void>;
}

const TenantsTable: React.FC<TenantsTableProps> = ({
  tenants,
  onAddTenant,
  onView,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [gotoValue, setGotoValue] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.unit || '').toLowerCase().includes(q)
      );
    });
  }, [tenants, search]);

  useEffect(() => setPage(1), [search]);

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

  return (
    <div className='bg-[#FFFFFF05] rounded-lg overflow-hidden'>
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-white text-lg font-semibold'>All tenants</h2>
        <div className='flex items-center gap-2'>
          <Button
            className='cursor-pointer px-8 font-bold'
            onClick={() => onAddTenant?.()}
          >
            Add Tenant
          </Button>
        </div>
      </div>

      <div className='flex items-center justify-between pb-4 pl-4'>
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

      <div className='overflow-x-auto mx-3 mb-3 rounded-2xl overflow-hidden bg-[#FFFFFF05]'>
        <table className='w-full'>
          <thead>
            <tr className='bg-[#F4F4F50A] py-2'>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Tenant
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Email
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Unit
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Registered On
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
                      src='/icons/user.svg'
                      alt='No tenants'
                      className='size-10 opacity-80'
                    />
                    <div className='text-white font-semibold'>
                      No tenants found
                    </div>
                    <p className='text-[#BDBDBE] text-sm max-w-[520px]'>
                      Try adjusting your search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((t) => (
                <tr
                  key={t.id}
                  className='border-b border-[#FFFFFF10] hover:bg-[#FFFFFF05]'
                >
                  <td className='py-4 px-4'>
                    <div className='text-white font-semibold text-sm'>
                      {t.name}
                    </div>
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {t.email}
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {t.unit || '-'}
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {t.registeredOn || '-'}
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
                        className='w-48 bg-[#27272B] border-[#434343] text-white px-4'
                      >
                        <DropdownMenuItem
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          onClick={() => onView?.(t)}
                        >
                          <img src='/icons/eye.svg' alt='View' />
                          <span className='text-sm font-medium'>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          onClick={() => onDelete?.(t)}
                        >
                          <img src='/icons/delete.svg' alt='Delete' />
                          <span className='text-sm font-medium'>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-3 text-xs text-[#BDBDBE]'>
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

          <div className='flex items-center gap-2 flex-wrap'>
            <button
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              disabled={currentPage <= 1}
              className='h-7 px-3 rounded-md border text-white inline-flex items-center gap-1 bg-[#FFFFFF0A] border-[#E2E8F00F] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFFFFF12]'
            >
              <ChevronLeft className='w-4 h-4' />
              <span>Prev</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              )
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={
                    'h-7 min-w-7 px-2 rounded-md border text-white bg-[#FFFFFF0A] border-[#E2E8F00F] hover:bg-[#FFFFFF12] ' +
                    (p === currentPage ? 'font-semibold' : '')
                  }
                >
                  {p}
                </button>
              ))}
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

export default TenantsTable;
