'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import ViewComplaint from './ViewComplaint';
import AssignComplaint from './AssignComplaint';
import ScheduleComplaint from './ScheduleComplaint';

export interface WorkOrder {
  id: number | string;
  name: string;
  complaint: string;
  propertyAddress: string;
  propertyId: string; // API id of the property
  units: string;
  assignedTo: string;
  assignedRole: string;
  vendorId?: string | null; // currently assigned vendor id if any
  scheduledDate: string; // e.g. "Apr 12, 2023"
  scheduledTime: string; // e.g. "14:00"
  status:
    | 'Assigned'
    | 'Completed'
    | 'Pending'
    | 'Scheduled'
    | 'In Progress'
    | 'Estimate needed'
    | 'Resident confirmation'
    | 'Pending vendors acceptance';
}

export interface VendorOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkOrdersTableProps {
  workOrders: WorkOrder[];
  onView?: (wo: WorkOrder) => void | Promise<void>;
  onAssign?: (wo: WorkOrder) => void | Promise<void>;
  onUnassign?: (wo: WorkOrder) => void | Promise<void>;
  onManageSchedule?: (wo: WorkOrder) => void | Promise<void>;
  onDelete?: (wo: WorkOrder) => void | Promise<void>;
  onEdit?: (wo: WorkOrder) => void | Promise<void>;
  // New optional props for vendor assignment wiring
  vendors?: VendorOption[];
  onAssignVendor?: (payload: {
    complaint: WorkOrder;
    vendor: VendorOption;
  }) => void | Promise<void>;
  onScheduleSet?: (payload: { complaint: WorkOrder; date: string }) => void;
  onRetractVendorFromProperty?: (payload: {
    complaint: WorkOrder;
  }) => void | Promise<void>;
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

const WorkOrdersTable: React.FC<WorkOrdersTableProps> = ({
  workOrders,
  onView,
  onAssign,
  onUnassign,
  onManageSchedule,
  onDelete,
  onEdit,
  vendors = [],
  onAssignVendor,
  onScheduleSet,
  onRetractVendorFromProperty,
}) => {
  const [statusFilter, setStatusFilter] = useState<
    | 'All'
    | 'Assigned'
    | 'Completed'
    | 'Pending'
    | 'Scheduled'
    | 'In Progress'
    | 'Estimate needed'
    | 'Resident confirmation'
    | 'Pending vendors acceptance'
  >('All');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(8);
  const [gotoValue, setGotoValue] = useState('');

  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const dateLabel = useMemo(
    () => (date ? formatDate(date) : 'Custom date'),
    [date]
  );

  const filtered = useMemo(() => {
    const sameDay = (dateStr: string) => {
      if (!date) return true; // no filter
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return true; // tolerate malformed strings
      const dOnly = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
      const sel = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dOnly.getTime() === sel.getTime();
    };
    const q = search.trim().toLowerCase();
    return workOrders.filter((c) => {
      const byStatus =
        statusFilter === 'All' ? true : c.status === statusFilter;
      const byDate = sameDay(c.scheduledDate);
      const bySearch = !q
        ? true
        : c.name.toLowerCase().includes(q) ||
          c.complaint.toLowerCase().includes(q) ||
          c.propertyAddress.toLowerCase().includes(q) ||
          c.assignedTo.toLowerCase().includes(q) ||
          c.assignedRole.toLowerCase().includes(q);
      return byStatus && byDate && bySearch;
    });
  }, [workOrders, statusFilter, date, search]);

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

  const handleView = (wo: WorkOrder) => {
    setSelected(wo);
    setOpenView(true);
    onView?.(wo);
  };
  const handleAssign = (wo: WorkOrder) => {
    setSelected(wo);
    setOpenAssign(true);
    onAssign?.(wo);
  };
  const handleSchedule = (wo: WorkOrder) => {
    setSelected(wo);
    setOpenSchedule(true);
    onManageSchedule?.(wo);
  };

  return (
    <div className='bg-[#FFFFFF05] rounded-lg overflow-hidden'>
      {/* Header */}
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-white text-lg font-semibold'>All work orders</h2>
      </div>

      {/* <div className='px-4'> */}
      {/* Filters + search */}
      <div className='flex items-center justify-between pb-4 pl-4'>
        {/* Search */}
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
        {/* Right-side: placeholder for future actions */}
        <div className='flex flex-col gap-3 px-4 sm:flex-row sm:items-center'>
          {/* Grouped filters */}
          <div className='flex w-full sm:w-auto flex-col items-stretch rounded-md border border-[#434343] overflow-hidden sm:inline-flex sm:flex-row sm:divide-x sm:divide-[#434343]'>
            {/* Status */}
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
                <SelectItem value='Assigned'>Assigned</SelectItem>
                <SelectItem value='Completed'>Completed</SelectItem>
                <SelectItem value='Pending'>Pending</SelectItem>
                <SelectItem value='Scheduled'>Scheduled</SelectItem>
                <SelectItem value='In Progress'>In Progress</SelectItem>
                <SelectItem value='Estimate needed'>Estimate needed</SelectItem>
                <SelectItem value='Resident confirmation'>
                  Resident confirmation
                </SelectItem>
                <SelectItem value='Pending vendors acceptance'>
                  Pending vendors acceptance
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date filter */}
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
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto mx-3 mb-3 rounded-2xl overflow-hidden bg-[#FFFFFF05]'>
        <table className='w-full'>
          <thead>
            <tr className='bg-[#F4F4F50A] py-2'>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Name & Work Order
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Property Address
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Units
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Assigned to
              </th>
              <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                Scheduled date
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
                <td colSpan={7} className='py-14 px-4'>
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
              pageRows.map((c) => (
                <tr
                  key={c.id}
                  className='border-b border-[#FFFFFF10] hover:bg-[#FFFFFF05]'
                >
                  <td className='py-4 px-4'>
                    <div>
                      <div className='text-white font-semibold text-sm'>
                        {c.name}
                      </div>
                      <div className='text-[#BDBDBE] text-xs font-medium'>
                        {c.complaint}
                      </div>
                    </div>
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {c.propertyAddress}
                  </td>
                  <td className='py-4 px-4 text-white font-medium text-sm'>
                    {c.units}
                  </td>
                  <td className='py-4 px-4'>
                    <div>
                      <div className='text-white text-sm font-medium'>
                        {c.assignedTo}
                      </div>
                      <div className='text-[#BDBDBE] text-xs font-medium'>
                        {c.assignedRole}
                      </div>
                    </div>
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
                          onClick={() => handleView(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                        >
                          <img src='/icons/eye.svg' alt='View' />
                          <span className='text-sm font-medium'>
                            View Work Order
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => onEdit?.(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                        >
                          <img src='/icons/user.svg' alt='Edit' />
                          <span className='text-sm font-medium'>
                            Edit Work Order
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => handleAssign(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                        >
                          <img src='/icons/user.svg' alt='Update' />
                          <span className='text-sm font-medium'>
                            Update Work Order
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-[#434343]' />
                        <DropdownMenuItem
                          onClick={() => handleSchedule(c)}
                          className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                        >
                          <img src='/icons/calendar.svg' alt='Schedule' />
                          <span className='text-sm font-medium'>
                            Manage Schedule
                          </span>
                        </DropdownMenuItem>
                        {c.vendorId ? (
                          <>
                            <DropdownMenuSeparator className='bg-[#434343]' />
                            <DropdownMenuItem
                              onClick={() =>
                                onRetractVendorFromProperty?.({ complaint: c })
                              }
                              className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                            >
                              <img
                                src='/icons/user-x.svg'
                                alt='Retract Vendor'
                              />
                              <span className='text-sm font-medium'>
                                Retract Vendor from Property
                              </span>
                            </DropdownMenuItem>
                          </>
                        ) : null}
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

      {/* Dialogs */}
      <ViewComplaint
        complaint={selected as any}
        open={openView}
        onOpenChange={setOpenView}
      />
      <AssignComplaint
        complaint={selected as any}
        open={openAssign}
        onOpenChange={setOpenAssign}
        vendors={vendors}
        onAssign={({ complaint, vendor }) => {
          if (selected) onAssignVendor?.({ complaint: selected, vendor });
        }}
      />
      <ScheduleComplaint
        complaint={selected as any}
        open={openSchedule}
        onOpenChange={setOpenSchedule}
        onSchedule={({ complaint, date }) => {
          if (selected) onScheduleSet?.({ complaint: selected, date });
        }}
      />
    </div>
  );
};

export default WorkOrdersTable;
