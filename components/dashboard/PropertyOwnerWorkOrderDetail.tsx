'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import { User, MapPin, Calendar } from 'lucide-react';

export type WorkOrderStatus =
  | 'Assigned'
  | 'Completed'
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Estimate needed'
  | 'Resident confirmation'
  | 'Pending vendors acceptance';

interface WorkOrder {
  id: string | number;
  name: string;
  complaint: string;
  propertyAddress: string;
  units: string;
  assignedTo: string;
  assignedRole: string;
  scheduledDate: string;
  scheduledTime: string;
  status: WorkOrderStatus;
}

interface PropertyOwnerWorkOrderDetailProps {
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

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const PropertyOwnerWorkOrderDetail = ({
  workOrder,
  open,
  onOpenChange,
}: PropertyOwnerWorkOrderDetailProps) => {
  if (!workOrder) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-lg'>
      <CustomDialogHeader
        title='Work Order Details'
        rightSlot={getStatusBadge(workOrder.status)}
      />

      <CustomDialogBody>
        <div className='space-y-4'>
          {/* Tenant Name */}
          <div className='flex items-start gap-3'>
            <div className='bg-[#FFFFFF0D] p-2 rounded-lg'>
              <User className='h-4 w-4 text-[#BDBDBE]' />
            </div>
            <div>
              <label className='text-[#BDBDBE] text-sm'>Tenant</label>
              <div className='text-white font-medium'>{workOrder.name}</div>
            </div>
          </div>

          {/* Complaint */}
          <div className='space-y-2'>
            <label className='text-[#BDBDBE] text-sm'>Complaint</label>
            <div className='text-white bg-[#FFFFFF08] rounded-lg p-3'>
              {workOrder.complaint}
            </div>
          </div>

          {/* Property Address */}
          <div className='flex items-start gap-3'>
            <div className='bg-[#FFFFFF0D] p-2 rounded-lg'>
              <MapPin className='h-4 w-4 text-[#BDBDBE]' />
            </div>
            <div>
              <label className='text-[#BDBDBE] text-sm'>Property Address</label>
              <div className='text-white font-medium'>
                {workOrder.propertyAddress}
              </div>
              {workOrder.units !== '-' && (
                <div className='text-[#BDBDBE] text-sm'>
                  Unit: {workOrder.units}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vendor */}
          {workOrder.assignedTo !== '-' && (
            <div className='flex items-start gap-3'>
              <div className='bg-[#FFFFFF0D] p-2 rounded-lg'>
                <User className='h-4 w-4 text-[#BDBDBE]' />
              </div>
              <div>
                <label className='text-[#BDBDBE] text-sm'>
                  Assigned Vendor
                </label>
                <div className='text-white font-medium'>
                  {workOrder.assignedTo}
                </div>
                <div className='text-[#BDBDBE] text-sm'>
                  {workOrder.assignedRole}
                </div>
              </div>
            </div>
          )}

          {/* Schedule */}
          {workOrder.scheduledDate !== '-' && (
            <div className='flex items-start gap-3'>
              <div className='bg-[#FFFFFF0D] p-2 rounded-lg'>
                <Calendar className='h-4 w-4 text-[#BDBDBE]' />
              </div>
              <div>
                <label className='text-[#BDBDBE] text-sm'>Scheduled</label>
                <div className='text-white font-medium'>
                  {workOrder.scheduledDate} • {workOrder.scheduledTime}
                </div>
              </div>
            </div>
          )}
        </div>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default PropertyOwnerWorkOrderDetail;
