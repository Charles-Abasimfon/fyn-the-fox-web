'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { cn } from '@/lib/utils';
import type { VendorRow } from './VendorsTable';
import { Trash, Trash2 } from 'lucide-react';

interface ViewVendorProps {
  vendor: VendorRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (v: VendorRow) => void;
  onDelete?: (v: VendorRow) => void;
}

const ViewVendor: React.FC<ViewVendorProps> = ({
  vendor,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  if (!vendor) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title='Vendor'
        rightSlot={
          <button
            onClick={() => onDelete?.(vendor)}
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-semibold',
              'bg-[#27272B] text-[#FF6C6C] hover:bg-[#27272B]/80'
            )}
          >
            <Trash2 size={16} />
            Delete Vendor
          </button>
        }
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Vendor name</label>
            <div className='text-white font-bold text-[20px]'>
              {vendor.name}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Vendor Email</label>
            <div className='text-white font-semibold'>{vendor.email}</div>
          </div>

          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Designation</label>
            <div className='text-white font-semibold'>{vendor.designation}</div>
          </div>

          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Registration date
            </label>
            <div className='text-white font-semibold'>
              {vendor.registeredOn}
            </div>
          </div>
        </div>
      </CustomDialogBody>

      <CustomDialogFooter>
        <button
          onClick={() => onEdit?.(vendor)}
          className={cn(
            'h-11 px-6 rounded-[10px] font-semibold w-full',
            'bg-[#F77F00] text-white hover:bg-[#f78f20]'
          )}
        >
          Edit Info
        </button>
      </CustomDialogFooter>
    </CustomDialog>
  );
};

export default ViewVendor;
