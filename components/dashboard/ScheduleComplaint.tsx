'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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

interface ScheduleComplaintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: Complaint | null;
  onSchedule?: (payload: { complaint: Complaint; date: string }) => void;
}

const ScheduleComplaint: React.FC<ScheduleComplaintProps> = ({
  open,
  onOpenChange,
  complaint,
  onSchedule,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined
  );
  const [selectedTime, setSelectedTime] = React.useState<string>('');

  React.useEffect(() => {
    // Reset when opening for another complaint
    if (!open) {
      setSelectedDate(undefined);
      setSelectedTime('');
    }
  }, [open]);

  if (!complaint) return null;

  const handleSchedule = () => {
    if (!selectedDate) return;

    // Combine date and time into ISO string
    let dateTimeStr = '';
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      dateTimeStr = dateTime.toISOString();
    } else {
      // If no time selected, use start of day
      const dateTime = new Date(selectedDate);
      dateTime.setHours(0, 0, 0, 0);
      dateTimeStr = dateTime.toISOString();
    }

    onSchedule?.({ complaint, date: dateTimeStr });
    onOpenChange(false);
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title='Manage Schedule' />
      <CustomDialogBody>
        <div className='space-y-6'>
          {/* Complaint Info */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Complaint</label>
            <div className='bg-[#161616] border border-[#434343] rounded-lg p-3'>
              <div className='text-white font-semibold text-sm'>
                {complaint.name}
              </div>
              <div className='text-[#BDBDBE] text-xs mt-1'>
                {complaint.complaint}
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal bg-[#161616] border-[#434343] text-white hover:bg-[#1f1f1f] hover:text-white',
                    !selectedDate && 'text-[#BDBDBE]'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0 bg-[#141414] border-[#434343]'>
                <Calendar
                  mode='single'
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  className='bg-[#141414] text-white'
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>
              Select Time (Optional)
            </label>
            <input
              type='time'
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className='w-full bg-[#161616] border border-[#434343] rounded-md px-3 py-2 text-white text-sm outline-none focus:border-[#6B6B6B]'
            />
          </div>

          {/* Assigned Vendor Info */}
          {complaint.assignedTo !== '-' && (
            <div className='space-y-2'>
              <label className='font-medium text-[#BDBDBE]'>Assigned to</label>
              <div className='text-white font-semibold text-sm'>
                {complaint.assignedTo} • {complaint.assignedRole}
              </div>
            </div>
          )}
        </div>
      </CustomDialogBody>
      <CustomDialogFooter>
        <Button
          variant='outline'
          onClick={() => onOpenChange(false)}
          className='bg-transparent border-[#434343] text-white hover:bg-[#1f1f1f] hover:text-white'
        >
          Cancel
        </Button>
        <Button
          onClick={handleSchedule}
          disabled={!selectedDate}
          className='bg-[#F77F00] text-white hover:bg-[#f78f20] disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Set Schedule
        </Button>
      </CustomDialogFooter>
    </CustomDialog>
  );
};

export default ScheduleComplaint;
