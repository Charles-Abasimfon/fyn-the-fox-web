'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import { cn } from '@/lib/utils';

export interface TenantFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  floor_number?: string;
  apartment_number?: string;
  password: string;
  property_id: string;
}

interface TenantFormDialogProps {
  title: string;
  ctaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<TenantFormValues>;
  onSubmit: (values: TenantFormValues) => void | Promise<void>;
}

const defaults: TenantFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  floor_number: '',
  apartment_number: '',
  password: '',
  property_id: '',
};

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

const Input = (
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) => {
  const { label, className, ...rest } = props;
  return (
    <div className='space-y-2'>
      <label className='font-medium text-[#BDBDBE]'>{label}</label>
      <input
        className='w-full h-10 bg-[#141414] border border-[#292828] rounded-md px-3 text-white text-sm font-medium placeholder:text-[#BDBDBE] outline-none focus:border-[#6B6B6B]'
        {...rest}
      />
    </div>
  );
};

const TenantFormDialog: React.FC<TenantFormDialogProps> = ({
  title,
  ctaLabel,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = React.useState<TenantFormValues>({
    ...defaults,
    ...(initialValues as any),
  });

  React.useEffect(() => {
    if (open) setValues({ ...defaults, ...(initialValues as any) });
  }, [open, initialValues]);

  const disabled =
    !values.first_name.trim() ||
    !values.last_name.trim() ||
    !isValidEmail(values.email.trim()) ||
    !values.password.trim() ||
    !values.property_id.trim();

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title={title} />
      <CustomDialogBody>
        <div className='space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='First Name'
              placeholder='e.g., Jane'
              value={values.first_name}
              onChange={(e) =>
                setValues((v) => ({ ...v, first_name: e.target.value }))
              }
            />
            <Input
              label='Last Name'
              placeholder='e.g., Doe'
              value={values.last_name}
              onChange={(e) =>
                setValues((v) => ({ ...v, last_name: e.target.value }))
              }
            />
          </div>
          <Input
            label='Email'
            type='email'
            placeholder='example@email.com'
            value={values.email}
            onChange={(e) =>
              setValues((v) => ({ ...v, email: e.target.value }))
            }
          />
          <Input
            label='Phone Number'
            placeholder='e.g., 1234567890'
            value={values.phone_number || ''}
            onChange={(e) =>
              setValues((v) => ({ ...v, phone_number: e.target.value }))
            }
          />
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='Floor Number'
              placeholder='e.g., 01'
              value={values.floor_number || ''}
              onChange={(e) =>
                setValues((v) => ({ ...v, floor_number: e.target.value }))
              }
            />
            <Input
              label='Apartment Number'
              placeholder='e.g., 3B'
              value={values.apartment_number || ''}
              onChange={(e) =>
                setValues((v) => ({ ...v, apartment_number: e.target.value }))
              }
            />
          </div>
          <Input
            label='Password'
            type='password'
            placeholder='Strong password'
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
          />
          <Input
            label='Property ID'
            placeholder='Property UUID'
            value={values.property_id}
            onChange={(e) =>
              setValues((v) => ({ ...v, property_id: e.target.value }))
            }
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

export default TenantFormDialog;
