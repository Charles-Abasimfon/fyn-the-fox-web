'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export interface Complaint {
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

export interface Vendor {
  id: string;
  name: string;
  email: string;
  role: string; // e.g. Plumber, Electrician
}

interface AssignComplaintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: Complaint | null;
  vendors: Vendor[];
  onAssign?: (payload: { complaint: Complaint; vendor: Vendor }) => void;
}

const getStatusBadge = (label: string) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border bg-[#271B16] text-[#F77F00] border-[#271B16]'
      )}
    >
      <img src={'/icons/assigned.svg'} alt={label} className='flex-shrink-0' />
      {label}
    </span>
  );
};

const AssignComplaint: React.FC<AssignComplaintProps> = ({
  open,
  onOpenChange,
  complaint,
  vendors,
  onAssign,
}) => {
  const [search, setSearch] = React.useState('');
  const [vendorId, setVendorId] = React.useState<string>('');

  React.useEffect(() => {
    // Reset selector when opening for another complaint
    if (!open) {
      setVendorId('');
      setSearch('');
    }
  }, [open]);

  if (!complaint) return null;

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.role.toLowerCase().includes(q)
    );
  });

  const selectedVendor = vendors.find((v) => v.id === vendorId) || null;

  const handleAssign = () => {
    if (!selectedVendor) return;
    onAssign?.({ complaint, vendor: selectedVendor });
    onOpenChange(false);
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title='Assign Complaint' />
      <CustomDialogBody>
        <div className='space-y-6'>
          {/* Assigned to */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Assigned to</label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger
                size='auto'
                className='w-full justify-between bg-[#161616] border-[#434343] text-white items-start'
              >
                {selectedVendor ? (
                  <div className='flex flex-col text-left py-[2px]'>
                    <span className='font-semibold leading-5'>
                      {selectedVendor.name}
                    </span>
                    <span className='text-sm leading-5'>
                      <span className='text-[#BDBDBE]'>
                        {selectedVendor.email}
                      </span>
                      <span className='mx-1 text-[#BDBDBE]'>|</span>
                      <span className='text-white font-semibold'>
                        {selectedVendor.role}
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className='text-[#BDBDBE]'>Choose Vendor</span>
                )}
              </SelectTrigger>
              <SelectContent className='p-0 bg-[#141414] border-transparent text-white w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]'>
                {/* Search */}
                <div className='sticky top-0 z-10 bg-[#141414] p-3]'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#BDBDBE]' />
                    <input
                      type='text'
                      placeholder='Search'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className='w-full bg-[#141414] text-white placeholder:text-[#BDBDBE] rounded-md py-2 pl-10 pr-3 text-sm outline-none border border-[#434343] focus:border-[#6B6B6B]'
                    />
                  </div>
                </div>

                <div className='py-1 max-h-[280px] overflow-y-auto'>
                  {filtered.length === 0 && (
                    <div className='px-3 py-4 text-sm text-[#BDBDBE]'>
                      No vendors found
                    </div>
                  )}
                  {filtered.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      className='px-3 hover:bg-[#FFFFFF12] focus:bg-[#FFFFFF12] hover:text-white focus:text-white'
                    >
                      <div className='flex flex-col'>
                        <span className='font-semibold'>{v.name}</span>
                        <span className='text-sm'>
                          <span className='text-[#BDBDBE]'>{v.email}</span>
                          <span className='mx-1 text-[#BDBDBE]'>|</span>
                          <span className='text-white font-semibold'>
                            {v.role}
                          </span>
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Tenant name */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant name</label>
            <div className='text-white font-bold text-[20px]'>
              {complaint.name}
            </div>
          </div>

          {/* Tenant complaint */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Tenant complaint
            </label>
            <div className='text-white font-semibold leading-relaxed'>
              {complaint.complaint}
            </div>
          </div>

          {/* Tenant address */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant address</label>
            <div className='text-white font-semibold'>
              {complaint.propertyAddress}
            </div>
          </div>

          {/* Tenant unit */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Tenant unit</label>
            <div className='text-white font-semibold'>{complaint.units}</div>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Status</label>
            <div className='pt-1.5'>{getStatusBadge('Unassigned')}</div>
          </div>

          {/* Scheduled date */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Scheduled date</label>
            <div className='text-white font-semibold'>
              {complaint.scheduledDate} • {complaint.scheduledTime}
            </div>
          </div>
        </div>
      </CustomDialogBody>

      <CustomDialogFooter>
        <button
          onClick={handleAssign}
          disabled={!selectedVendor}
          className={cn(
            'h-11 px-6 rounded-[10px] font-semibold w-full',
            selectedVendor
              ? 'bg-[#F77F00] text-white hover:bg-[#f78f20]'
              : 'bg-[#F77F00]/40 text-white/70 cursor-not-allowed'
          )}
        >
          Assign
        </button>
      </CustomDialogFooter>
    </CustomDialog>
  );
};

export default AssignComplaint;
