'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import { FileText, Download, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid';

interface Invoice {
  id: string;
  workOrderId: string;
  workOrderDescription: string;
  propertyAddress: string;
  tenantName: string;
  amount: number;
  description: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  attachmentUrl?: string;
}

interface ViewInvoiceProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadAttachment?: () => void;
}

const getStatusStyles = (status: InvoiceStatus) => {
  switch (status) {
    case 'draft':
      return 'bg-[#2A2A2A] text-[#BDBDBE] border-[#2A2A2A]';
    case 'pending':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'approved':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'rejected':
      return 'bg-[#2B1D1C] text-[#EF4444] border-[#2B1D1C]';
    case 'paid':
      return 'bg-[#1C2A3B] text-[#3B82F6] border-[#1C2A3B]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const getStatusLabel = (status: InvoiceStatus) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'paid':
      return 'Paid';
    default:
      return status;
  }
};

const getStatusBadge = (status: InvoiceStatus) => {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border ${getStatusStyles(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const ViewInvoice = ({
  invoice,
  open,
  onOpenChange,
  onDownloadAttachment,
}: ViewInvoiceProps) => {
  if (!invoice) return null;

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title='Invoice Details'
        rightSlot={getStatusBadge(invoice.status)}
      />

      <CustomDialogBody>
        <div className='space-y-6'>
          {/* Amount */}
          <div className='bg-[#FFFFFF08] rounded-lg p-4 flex items-center gap-4'>
            <div className='bg-[#F77F00]/20 rounded-full p-3'>
              <DollarSign className='h-6 w-6 text-[#F77F00]' />
            </div>
            <div>
              <label className='text-[#BDBDBE] text-sm'>Invoice Amount</label>
              <div className='text-white font-bold text-2xl'>
                {formatCurrency(invoice.amount)}
              </div>
            </div>
          </div>

          {/* Work Order Info */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE] text-sm'>
              Work Order
            </label>
            <div className='text-white font-medium'>
              {invoice.workOrderDescription}
            </div>
            <div className='text-[#BDBDBE] text-sm'>{invoice.tenantName}</div>
          </div>

          {/* Property Address */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE] text-sm'>
              Property Address
            </label>
            <div className='text-white'>{invoice.propertyAddress}</div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE] text-sm'>
              Description
            </label>
            <div className='text-white bg-[#FFFFFF08] rounded-lg p-3'>
              {invoice.description}
            </div>
          </div>

          {/* Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE] text-sm flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Due Date
              </label>
              <div className='text-white'>{invoice.dueDate || 'Not set'}</div>
            </div>
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE] text-sm flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Created
              </label>
              <div className='text-white'>{invoice.createdAt}</div>
            </div>
          </div>

          {/* Attachment */}
          {invoice.attachmentUrl && (
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE] text-sm'>
                Attachment
              </label>
              <Button
                variant='outline'
                className='w-full justify-start gap-2'
                onClick={onDownloadAttachment}
              >
                <FileText className='h-4 w-4' />
                Download attachment
                <Download className='h-4 w-4 ml-auto' />
              </Button>
            </div>
          )}
        </div>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default ViewInvoice;
