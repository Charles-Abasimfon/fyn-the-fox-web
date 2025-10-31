'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export interface WorkOrderFormValues {
  complain: string;
  category: string;
  urgency: string; // low | medium | high
  eta?: string; // ISO datetime string
  user_id?: string;
  property_id?: string;
}

interface WorkOrderFormDialogProps {
  title: string;
  ctaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<WorkOrderFormValues>;
  onSubmit: (values: WorkOrderFormValues) => void | Promise<void>;
}

const defaults: WorkOrderFormValues = {
  complain: '',
  category: '',
  urgency: 'medium',
  eta: '',
  user_id: '',
  property_id: '',
};

const Input = (
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) => {
  const { label, className, ...rest } = props;
  return (
    <div className='space-y-2'>
      <label className='font-medium text-[#BDBDBE]'>{label}</label>
      <input
        className={cn(
          'w-full h-10 bg-[#141414] border border-[#292828] rounded-md px-3 text-white text-sm font-medium placeholder:text-[#BDBDBE] outline-none focus:border-[#6B6B6B]',
          className
        )}
        {...rest}
      />
    </div>
  );
};

const WorkOrderFormDialog: React.FC<WorkOrderFormDialogProps> = ({
  title,
  ctaLabel,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = React.useState<WorkOrderFormValues>({
    ...defaults,
    ...(initialValues as any),
  });

  React.useEffect(() => {
    if (open) {
      setValues({ ...defaults, ...(initialValues as any) });
    }
  }, [open, initialValues]);

  const disabled = !values.complain.trim() || !values.urgency.trim();

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title={title} />
      <CustomDialogBody>
        <div className='space-y-6'>
          <Input
            label='Complaint'
            placeholder='e.g., Leaking pipe in kitchen'
            value={values.complain}
            onChange={(e) =>
              setValues((v) => ({ ...v, complain: e.target.value }))
            }
          />
          <Input
            label='Category'
            placeholder='e.g., plumbing, electrical'
            value={values.category}
            onChange={(e) =>
              setValues((v) => ({ ...v, category: e.target.value }))
            }
          />
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>Urgency</label>
            <Select
              value={values.urgency}
              onValueChange={(v) =>
                setValues((prev) => ({ ...prev, urgency: v }))
              }
            >
              <SelectTrigger className='w-full h-10 bg-[#141414] border border-[#292828] rounded-md px-3 text-white text-sm font-medium outline-none focus:border-[#6B6B6B]'>
                <SelectValue placeholder='Select urgency' />
              </SelectTrigger>
              <SelectContent className='bg-[#0F0F0F] border-[#292828] text-white'>
                <SelectItem value='low'>Low</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='high'>High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            label='User ID (Tenant)'
            placeholder='Tenant UUID'
            value={values.user_id || ''}
            onChange={(e) =>
              setValues((v) => ({ ...v, user_id: e.target.value }))
            }
          />
          <Input
            label='Property ID'
            placeholder='Property UUID'
            value={values.property_id || ''}
            onChange={(e) =>
              setValues((v) => ({ ...v, property_id: e.target.value }))
            }
          />
          <div className='space-y-2'>
            <label className='font-medium text-[#BDBDBE]'>ETA (optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'w-full h-10 bg-[#141414] border border-[#292828] rounded-md px-3 text-white text-sm font-medium text-left outline-none focus:border-[#6B6B6B]',
                    !values.eta && 'text-[#BDBDBE]'
                  )}
                >
                  {(() => {
                    if (!values.eta) return 'Pick a date';
                    const d = new Date(values.eta);
                    if (isNaN(d.getTime())) return 'Pick a date';
                    return d.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                    });
                  })()}
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0 bg-[#0F0F0F] border-[#292828] text-white'>
                <div className='p-2'>
                  <Calendar
                    mode='single'
                    selected={
                      values.eta &&
                      !isNaN(new Date(values.eta as string).getTime())
                        ? new Date(values.eta as string)
                        : undefined
                    }
                    onSelect={(date) => {
                      setValues((prev) => ({
                        ...prev,
                        eta: date ? new Date(date).toISOString() : '',
                      }));
                    }}
                  />
                  <div className='flex justify-end gap-2 p-2 pt-0'>
                    <button
                      type='button'
                      className='px-3 py-1.5 rounded-md text-xs bg-[#1E1E1E] border border-[#292828] hover:bg-[#232323]'
                      onClick={() =>
                        setValues((prev) => ({ ...prev, eta: '' }))
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CustomDialogBody>
      <CustomDialogFooter>
        <button
          disabled={disabled}
          onClick={() => !disabled && onSubmit(values)}
          className={cn(
            'h-11 px-6 rounded-[10px] font-semibold w-full',
            disabled
              ? 'bg-[#F77F00]/40 text-white/70 cursor-not-allowed'
              : 'bg-[#F77F00] text-white hover:bg-[#f78f20]'
          )}
        >
          {ctaLabel}
        </button>
      </CustomDialogFooter>
    </CustomDialog>
  );
};

export default WorkOrderFormDialog;
