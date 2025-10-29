'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { cn } from '@/lib/utils';

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
          <Input
            label='Urgency (low, medium, high)'
            placeholder='medium'
            value={values.urgency}
            onChange={(e) =>
              setValues((v) => ({ ...v, urgency: e.target.value }))
            }
          />
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
          <Input
            label='ETA (optional ISO datetime)'
            placeholder='2025-10-28T14:00:00Z'
            value={values.eta || ''}
            onChange={(e) => setValues((v) => ({ ...v, eta: e.target.value }))}
          />
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
