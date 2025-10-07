'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';

interface WorkOrder {
  id: string;
  tenantName: string;
  complaint: string;
  propertyAddress: string;
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

interface ViewWorkOrderProps {
  workOrder: WorkOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Match badge styles exactly with VendorWorkOrdersTable
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

const ViewWorkOrder = ({
  workOrder,
  open,
  onOpenChange,
}: ViewWorkOrderProps) => {
  if (!workOrder) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title='Work Order Details'
        rightSlot={getStatusBadge(workOrder.status)}
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          {/* Tenant Name */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant name</label>
            <div className='text-white font-bold text-[20px]'>
              {workOrder.tenantName}
            </div>
          </div>

          {/* Complaint Description */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Complaint description
            </label>
            <div className='text-white font-semibold leading-relaxed'>
              {workOrder.complaint}
            </div>
          </div>

          {/* Property Address */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Property address
            </label>
            <div className='text-white font-semibold'>
              {workOrder.propertyAddress}
            </div>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Status</label>
            <div className='pt-1.5'>{getStatusBadge(workOrder.status)}</div>
          </div>

          {/* Scheduled Date */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Scheduled date</label>
            <div className='text-white font-semibold'>
              {workOrder.scheduledDate} • {workOrder.scheduledTime}
            </div>
          </div>
        </div>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default ViewWorkOrder;
