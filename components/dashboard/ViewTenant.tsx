'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { cn } from '@/lib/utils';

export interface TenantDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  TenantInfo?: {
    floor_number?: number | string | null;
    apartment_number?: string | null;
    Property?: { id: string; name: string } | null;
  } | null;
}

interface ViewTenantProps {
  tenant: TenantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

const ViewTenant: React.FC<ViewTenantProps> = ({
  tenant,
  open,
  onOpenChange,
  onDelete,
}) => {
  if (!tenant) return null;
  const name = `${tenant.first_name} ${tenant.last_name}`.trim();
  const unit = tenant.TenantInfo?.apartment_number ?? '-';
  const floor = tenant.TenantInfo?.floor_number ?? '-';
  const property = tenant.TenantInfo?.Property?.name ?? '-';

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title='Tenant'
        rightSlot={
          <button
            onClick={() => onDelete?.(tenant.id)}
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-semibold',
              'bg-[#27272B] text-[#FF6C6C] hover:bg-[#27272B]/80'
            )}
          >
            <img src='/icons/delete.svg' alt='Delete' />
            Delete Tenant
          </button>
        }
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Name</label>
            <div className='text-white font-bold text-[20px]'>{name}</div>
          </div>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Email</label>
            <div className='text-white font-semibold'>{tenant.email}</div>
          </div>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Phone</label>
            <div className='text-white font-semibold'>
              {tenant.phone_number || '-'}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE]'>Floor</label>
              <div className='text-white font-semibold'>{String(floor)}</div>
            </div>
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE]'>Apartment</label>
              <div className='text-white font-semibold'>{unit}</div>
            </div>
          </div>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Property</label>
            <div className='text-white font-semibold'>{property}</div>
          </div>
        </div>
      </CustomDialogBody>

      <CustomDialogFooter>
        <button
          onClick={() => onOpenChange(false)}
          className='h-11 px-6 rounded-[10px] font-semibold w-full bg-[#F77F00] text-white hover:bg-[#f78f20]'
        >
          Close
        </button>
      </CustomDialogFooter>
    </CustomDialog>
  );
};

export default ViewTenant;
