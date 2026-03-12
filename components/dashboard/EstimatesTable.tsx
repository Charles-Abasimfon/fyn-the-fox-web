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
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Send,
  FileText,
  Trash2,
  Edit,
} from 'lucide-react';

export type EstimateStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface EstimateItem {
  id: string;
  workOrderId: string;
  workOrderDescription: string;
  propertyAddress: string;
  tenantName: string;
  amount: number;
  description: string;
  status: EstimateStatus;
  createdAt: string;
  attachmentUrl?: string;
}

export interface EstimatesTableProps {
  items: EstimateItem[];
  onView?: (item: EstimateItem) => void;
  onEdit?: (item: EstimateItem) => void;
  onSend?: (item: EstimateItem) => void | Promise<void>;
  onDelete?: (item: EstimateItem) => void | Promise<void>;
  onViewAttachment?: (item: EstimateItem) => void;
}

const getStatusStyles = (status: EstimateStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-[#1A1A2E] text-[#A0A6B1] border-[#1A1A2E]';
    case 'pending':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'approved':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'rejected':
      return 'bg-[#2B1D1C] text-[#EF4444] border-[#2B1D1C]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const getStatusLabel = (status: EstimateStatus) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

const EstimatesTable: React.FC<EstimatesTableProps> = ({
  items,
  onView,
  onEdit,
  onSend,
  onDelete,
  onViewAttachment,
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
          c.workOrderDescription.toLowerCase().includes(q) ||
          c.propertyAddress.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        : true,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className='bg-[#FFFFFF05] rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-white text-lg font-semibold'>Estimates</h2>
        {/* Search */}
        <div className='relative w-full sm:w-80'>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search estimates...'
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

      {/* Table */}
      <div className='overflow-x-auto mb-3 rounded-2xl overflow-hidden bg-[#FFFFFF05]'>
        <table className='w-full'>
          <thead>
            <tr className='bg-[#F4F4F50A] py-2'>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Work Order
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Property
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Amount
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Created
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
                <td colSpan={6} className='py-14 px-4'>
                  <div className='flex flex-col items-center justify-center text-center gap-3'>
                    <FileText className='size-10 opacity-80 text-white/50' />
                    <div className='text-white font-semibold'>
                      No estimates found
                    </div>
                    <p className='text-[#BDBDBE] text-sm max-w-[520px]'>
                      Your created estimates will appear here.
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
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className='border-b border-[#434343] hover:bg-[#FFFFFF08] transition-colors'
                >
                  <td className='py-4 px-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-white text-sm font-medium truncate max-w-[200px]'>
                        {row.workOrderDescription}
                      </span>
                      <span className='text-[#BDBDBE] text-xs'>
                        {row.tenantName}
                      </span>
                    </div>
                  </td>
                  <td className='py-4 px-4'>
                    <span className='text-white text-sm truncate max-w-[180px] block'>
                      {row.propertyAddress}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    <span className='text-white text-sm font-semibold'>
                      {formatCurrency(row.amount)}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    <span className='text-white text-sm'>{row.createdAt}</span>
                  </td>
                  <td className='py-4 px-4'>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
                        row.status,
                      )}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className='py-4 px-4'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-white/70 hover:text-white hover:bg-white/10'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='bg-[#1F1F1F] border-[#434343] text-white'
                      >
                        <DropdownMenuItem
                          onClick={() => onView?.(row)}
                          className='hover:bg-white/10 cursor-pointer'
                        >
                          <Eye className='mr-2 h-4 w-4' />
                          View details
                        </DropdownMenuItem>
                        {(row.status === 'draft' ||
                          row.status === 'pending') && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onEdit?.(row)}
                              className='hover:bg-white/10 cursor-pointer'
                            >
                              <Edit className='mr-2 h-4 w-4' />
                              Edit estimate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onSend?.(row)}
                              className='hover:bg-white/10 cursor-pointer'
                            >
                              <Send className='mr-2 h-4 w-4' />
                              Send to property manager
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => onViewAttachment?.(row)}
                          className='hover:bg-white/10 cursor-pointer'
                        >
                          <FileText className='mr-2 h-4 w-4' />
                          View attachment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        {(row.status === 'draft' ||
                          row.status === 'pending') && (
                          <DropdownMenuItem
                            onClick={() => onDelete?.(row)}
                            className='hover:bg-red-500/20 cursor-pointer text-red-400'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4'>
          <div className='text-[#BDBDBE] text-sm'>
            Showing {startIndex} to {endIndex} of {total} estimates
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            {getPageSeries(totalPages, currentPage).map((p, i) =>
              typeof p === 'string' ? (
                <span key={i} className='text-[#BDBDBE] px-2'>
                  {p}
                </span>
              ) : (
                <Button
                  key={i}
                  variant={p === currentPage ? 'default' : 'outline'}
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[#BDBDBE] text-sm'>Go to:</span>
            <input
              type='number'
              min={1}
              max={totalPages}
              value={gotoValue}
              onChange={(e) => setGotoValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(gotoValue, 10);
                  if (val >= 1 && val <= totalPages) {
                    setPage(val);
                  }
                }
              }}
              className='w-16 h-8 bg-[#141414] border border-[#434343] rounded-md px-2 text-sm text-white text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimatesTable;
