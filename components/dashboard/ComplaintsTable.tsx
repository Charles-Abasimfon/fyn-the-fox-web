'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Eye,
  UserPlus,
  UserX,
  CalendarCheck,
  Trash2,
} from 'lucide-react';

interface Complaint {
  id: number;
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

interface ComplaintsTableProps {
  complaints: Complaint[];
  onViewComplaint?: (c: Complaint) => void | Promise<void>;
  onAssignComplaint?: (c: Complaint) => void | Promise<void>;
  onUnassignComplaint?: (c: Complaint) => void | Promise<void>;
  onManageSchedule?: (c: Complaint) => void | Promise<void>;
  onDeleteComplaint?: (c: Complaint) => void | Promise<void>;
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
  onViewComplaint,
  onAssignComplaint,
  onUnassignComplaint,
  onManageSchedule,
  onDeleteComplaint,
}) => {
  return (
    <div className='bg-[#FFFFFF0D] rounded-lg mt-8 overflow-hidden'>
      {/* Header */}
      {/* <div className='flex items-center justify-between mb-6'>
        <h2 className='text-white text-lg font-semibold'>Recent complaints</h2>
        <div className='flex items-center gap-4'>
          <select className='bg-[#FFFFFF0D] border border-[#FFFFFF20] rounded px-3 py-1 text-white text-sm'>
            <option>All status</option>
            <option>Assigned</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Scheduled</option>
            <option>In Progress</option>
          </select>
          <select className='bg-[#FFFFFF0D] border border-[#FFFFFF20] rounded px-3 py-1 text-white text-sm'>
            <option>Custom date</option>
          </select>
        </div>
      </div> */}

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
            {complaints.map((complaint) => (
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
                        onClick={() => onViewComplaint?.(complaint)}
                        className='py-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                      >
                        <img src='/icons/eye.svg' alt='View' />
                        <span className='text-sm font-medium'>
                          View Complaint
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className='bg-[#434343]' />
                      <DropdownMenuItem
                        onClick={() => onAssignComplaint?.(complaint)}
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
                        <img src='/icons/calendar.svg' alt='Manage Schedule' />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintsTable;
