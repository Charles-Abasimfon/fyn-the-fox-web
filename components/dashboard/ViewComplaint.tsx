'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';

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

interface ViewComplaintProps {
  complaint: Complaint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Match badge styles exactly with ComplaintsTable
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

const getStatusBadge = (status: string) => {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
        status
      )}`}
    >
      <img src={getStatusIcon(status)} alt={status} className='flex-shrink-0' />
      {status}
    </span>
  );
};

const ViewComplaint = ({
  complaint,
  open,
  onOpenChange,
}: ViewComplaintProps) => {
  if (!complaint) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title='Complaint'
        rightSlot={getStatusBadge(complaint.status)}
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          {/* Tenant Name */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant name</label>
            <div className='text-white font-bold text-[20px]'>
              {complaint.name}
            </div>
          </div>

          {/* Tenant Complaint */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Tenant complaint
            </label>
            <div className='text-white font-semibold leading-relaxed'>
              {complaint.complaint}
            </div>
          </div>

          {/* Tenant Address */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant address</label>
            <div className='text-white font-semibold'>
              {complaint.propertyAddress}
            </div>
          </div>

          {/* Tenant Unit */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant unit</label>
            <div className='text-white font-semibold'>{complaint.units}</div>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Status</label>
            <div className='pt-1.5'>{getStatusBadge(complaint.status)}</div>
          </div>

          {/* Assigned To */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Assigned to</label>
            <div className='text-white font-semibold'>
              {complaint.assignedTo} • {complaint.assignedRole}
            </div>
          </div>

          {/* Scheduled Date */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Scheduled date</label>
            <div className='text-white font-semibold'>
              {complaint.scheduledDate} • {complaint.scheduledTime}
            </div>
          </div>
        </div>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default ViewComplaint;
