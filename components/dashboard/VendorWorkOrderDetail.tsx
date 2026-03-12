'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';

export type VendorOrderStatus =
  | 'Assigned'
  | 'Completed'
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Estimate needed'
  | 'Resident confirmation'
  | 'Pending vendors acceptance';

interface WorkOrder {
  id: string;
  tenantName: string;
  complaint: string;
  propertyAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VendorOrderStatus;
}

interface VendorWorkOrderDetailProps {
  workOrder: WorkOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const getStatusBadge = (status: string) => {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
        status,
      )}`}
    >
      <img src={getStatusIcon(status)} alt={status} className='flex-shrink-0' />
      {status}
    </span>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const VendorWorkOrderDetail = ({
  workOrder,
  open,
  onOpenChange,
}: VendorWorkOrderDetailProps) => {
  if (!workOrder) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-lg'>
      <CustomDialogHeader
        title='Work Order'
        rightSlot={getStatusBadge(workOrder.status)}
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant name</label>
            <div className='text-white font-bold text-[20px]'>
              {workOrder.tenantName}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Complaint description
            </label>
            <div className='text-white font-semibold leading-relaxed'>
              {workOrder.complaint}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Property address
            </label>
            <div className='text-white font-semibold'>
              {workOrder.propertyAddress}
            </div>
          </div>

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

export default VendorWorkOrderDetail;
