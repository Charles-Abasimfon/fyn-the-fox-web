'use client';

import React, { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  MoreVertical,
  Eye,
  UserPlus,
  UserX,
  CalendarCheck,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import ViewComplaint from './ViewComplaint';
import AssignComplaint from './AssignComplaint';

interface Complaint {
  id: string;
  name: string;
  complaint: string;
  propertyAddress: string;
  units: string;
  assignedTo: string;
  assignedRole: string;
  scheduledDate: string;
  scheduledTime: string;
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

interface VendorOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ComplaintsTableProps {
  complaints: Complaint[];
  vendors?: VendorOption[];
  onViewComplaint?: (c: Complaint) => void | Promise<void>;
  onAssignComplaint?: (c: Complaint) => void | Promise<void>;
  onUnassignComplaint?: (c: Complaint) => void | Promise<void>;
  onManageSchedule?: (c: Complaint) => void | Promise<void>;
  onDeleteComplaint?: (c: Complaint) => void | Promise<void>;
  onAssignVendor?: (payload: {
    complaint: Complaint;
    vendor: VendorOption;
  }) => void;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Assigned':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Completed':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'Pending':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Scheduled':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'In Progress':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Estimate needed':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Resident confirmation':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'Pending vendors acceptance':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
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

const ComplaintsTable: React.FC<ComplaintsTableProps> = ({
  complaints,
  vendors,
  onViewComplaint,
  onAssignComplaint,
  onUnassignComplaint,
  onManageSchedule,
  onDeleteComplaint,
  onAssignVendor,
}) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Filters state
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
  const filtersActive = statusFilter !== 'All' || !!date;

  const vendorList: VendorOption[] = vendors || [];

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsViewDialogOpen(true);
    onViewComplaint?.(complaint);
  };

  const handleAssignComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsAssignDialogOpen(true);
    onAssignComplaint?.(complaint);
  };

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

  // Light client-side filtering based on selected status and date range
  const filteredComplaints = useMemo(() => {
    const sameDay = (dateStr: string) => {
      if (!date) return true; // no filter
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true; // tolerate malformed
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const sel = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dOnly.getTime() === sel.getTime();
    };

    return complaints.filter((c) => {
      const byStatus =
        statusFilter === 'All' ? true : c.status === statusFilter;
      const byDate = sameDay(c.scheduledDate);
      return byStatus && byDate;
    });
  }, [complaints, statusFilter, date]);
  return (
    <>
      {/* Filters group OUTSIDE the table card */}
      <div className='mb-3 px-1'>
        {/* Optional title inside the card (kept as before) */}
        <div className='pb-3'>
          <h2 className='text-white text-lg font-semibold'>
            Recent complaints
          </h2>
        </div>
        <div className='flex w-full flex-col items-stretch rounded-md border border-[#434343] overflow-hidden sm:inline-flex sm:w-auto sm:flex-row sm:divide-x sm:divide-[#434343]'>
          {/* Status filter - styled like Select and merged into the group */}
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

          {/* Mobile separation is handled via a bottom border on the Status trigger */}

          {/* Date filter - Popover with single-date Calendar, caret only */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className='data-[placeholder]:text-muted-foreground flex items-center justify-between gap-2 bg-transparent h-9 px-4 text-sm text-white whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 rounded-none border-0 hover:bg-transparent hover:text-white w-full min-w-0 cursor-pointer sm:w-[180px]'
                aria-label='Custom date'
              >
                <span className='truncate'>{dateLabel}</span>
                {/* match Select's down arrow */}
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
                onSelect={(d) => {
                  setDate(d);
                }}
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

      <div className='bg-[#FFFFFF0D] rounded-lg overflow-hidden mt-4'>
        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-[#F4F4F50A] py-2'>
                <th className='text-left py-4 px-4 text-white text-xs font-semibold whitespace-nowrap'>
                  Name & Complaint
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
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className='py-14 px-4'>
                    <div className='flex flex-col items-center justify-center text-center gap-3'>
                      <img
                        src='/icons/complaint.svg'
                        alt='No complaints'
                        className='size-10 opacity-80'
                      />
                      <div className='text-white font-semibold'>
                        {filtersActive
                          ? 'No results match your filters'
                          : 'No complaints yet'}
                      </div>
                      <p className='text-[#BDBDBE] text-sm max-w-[520px]'>
                        {filtersActive
                          ? 'Try adjusting your filters or clearing them to see more results.'
                          : "When complaints are created, they'll show up here."}
                      </p>
                      {filtersActive && (
                        <div className='pt-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setStatusFilter('All');
                              setDate(undefined);
                            }}
                            className='cursor-pointer'
                          >
                            Clear filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className='border-b border-[#FFFFFF10] hover:bg-[#FFFFFF05]'
                  >
                    <td className='py-4 px-4'>
                      <div>
                        <div className='text-white font-semibold text-sm'>
                          {complaint.name}
                        </div>
                        <div className='text-[#BDBDBE] text-xs font-medium'>
                          {complaint.complaint}
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-4 text-white font-medium text-sm'>
                      {complaint.propertyAddress}
                    </td>
                    <td className='py-4 px-4 text-white font-medium text-sm'>
                      {complaint.units}
                    </td>
                    <td className='py-4 px-4'>
                      <div>
                        <div className='text-white text-sm font-medium'>
                          {complaint.assignedTo}
                        </div>
                        <div className='text-[#BDBDBE] text-xs font-medium'>
                          {complaint.assignedRole}
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-4'>
                      <div>
                        <div className='text-white text-sm font-medium'>
                          {complaint.scheduledDate}
                        </div>
                        <div className='text-white text-center font-medium text-sm flex items-center gap-2 justify-center'>
                          <span className='size-1 rounded-full bg-white'></span>
                          {complaint.scheduledTime}
                        </div>
                      </div>
                    </td>
                    <td className='py-4 px-4'>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
                          complaint.status
                        )}`}
                      >
                        <img
                          src={getStatusIcon(complaint.status)}
                          alt={complaint.status}
                          className='flex-shrink-0'
                        />
                        {complaint.status}
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
                            onClick={() => handleViewComplaint(complaint)}
                            className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          >
                            <img src='/icons/eye.svg' alt='View' />
                            <span className='text-sm font-medium'>
                              View Complaint
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='bg-[#434343]' />
                          <DropdownMenuItem
                            onClick={() => handleAssignComplaint(complaint)}
                            className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          >
                            <img src='/icons/user.svg' alt='View' />
                            <span className='text-sm font-medium'>
                              Assign Complaint
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='bg-[#434343]' />
                          <DropdownMenuItem
                            onClick={() => onUnassignComplaint?.(complaint)}
                            className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          >
                            <img src='/icons/user.svg' alt='View' />
                            <span className='text-sm font-medium'>
                              Unassign Complaint
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='bg-[#434343]' />
                          <DropdownMenuItem
                            onClick={() => onManageSchedule?.(complaint)}
                            className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                          >
                            <img
                              src='/icons/calendar.svg'
                              alt='Manage Schedule'
                            />
                            <span className='text-sm font-medium'>
                              Manage Schedule Date
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='bg-[#434343]' />
                          <DropdownMenuItem
                            onClick={() => onDeleteComplaint?.(complaint)}
                            className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
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
        </div>

        {/* Close card container */}
      </div>

      <ViewComplaint
        complaint={selectedComplaint}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
      <AssignComplaint
        complaint={selectedComplaint}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        vendors={vendorList}
        onAssign={({ complaint, vendor }) => {
          onAssignVendor?.({ complaint, vendor });
        }}
      />
    </>
  );
};

export default ComplaintsTable;
