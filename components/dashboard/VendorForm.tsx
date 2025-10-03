'use client';

import React from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
} from '@/components/ui/custom-dialog';
import type { VendorRow } from './VendorsTable';
import { cn } from '@/lib/utils';

// Updated form values to support API creation payload
export interface VendorFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string; // required for creation
  phone_number: string;
  type: string; // maps from designation input, normalize to kebab-case
  service_area: string; // comma separated in UI, will split into array
  preferred_contact_method: string; // phone | email
}

interface VendorFormDialogProps {
  title: string;
  ctaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: VendorFormValues;
  onSubmit: (values: VendorFormValues) => void | Promise<void>;
  requirePassword?: boolean;
}

const emptyValues: VendorFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone_number: '',
  type: '',
  service_area: '',
  preferred_contact_method: 'phone',
};

function isValidEmail(email: string) {
  // simple email check
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
        className={cn(
          'w-full h-10 bg-[#141414] border border-[#292828] rounded-md px-3 text-white text-sm font-medium placeholder:text-[#BDBDBE] outline-none focus:border-[#6B6B6B]'
        )}
        {...rest}
      />
    </div>
  );
};

export const VendorFormDialog: React.FC<VendorFormDialogProps> = ({
  title,
  ctaLabel,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  requirePassword = true,
}) => {
  const [values, setValues] = React.useState<VendorFormValues>(
    initialValues ?? emptyValues
  );

  React.useEffect(() => {
    if (open) {
      setValues(initialValues ?? emptyValues);
    }
  }, [open, initialValues]);

  const disabled =
    !values.first_name.trim() ||
    !values.last_name.trim() ||
    !values.type.trim() ||
    (requirePassword && !values.password.trim()) ||
    !values.phone_number.trim() ||
    !isValidEmail(values.email.trim());

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title={title} />
      <CustomDialogBody>
        <div className='space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='First Name'
              placeholder='e.g., John'
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
            placeholder='e.g., example@email.com'
            type='email'
            value={values.email}
            onChange={(e) =>
              setValues((v) => ({ ...v, email: e.target.value }))
            }
          />
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
            label='Phone Number'
            placeholder='e.g., 1234567890'
            value={values.phone_number}
            onChange={(e) =>
              setValues((v) => ({ ...v, phone_number: e.target.value }))
            }
          />
          <Input
            label='Service Type'
            placeholder='e.g., Internet Provider'
            value={values.type}
            onChange={(e) => setValues((v) => ({ ...v, type: e.target.value }))}
          />
          <Input
            label='Service Area(s) (comma separated)'
            placeholder='e.g., California, Nevada'
            value={values.service_area}
            onChange={(e) =>
              setValues((v) => ({ ...v, service_area: e.target.value }))
            }
          />
          <Input
            label='Preferred Contact Method (phone/email)'
            placeholder='phone'
            value={values.preferred_contact_method}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                preferred_contact_method: e.target.value,
              }))
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

export const AddVendorDialog: React.FC<
  Omit<VendorFormDialogProps, 'title' | 'ctaLabel'>
> = (props) => (
  <VendorFormDialog
    title='Add Vendor'
    ctaLabel='Add Vendor'
    requirePassword={true}
    {...props}
  />
);

export const EditVendorDialog: React.FC<
  Omit<VendorFormDialogProps, 'title' | 'ctaLabel' | 'initialValues'> & {
    vendor: VendorRow | null;
  }
> = ({ vendor, ...rest }) => (
  <VendorFormDialog
    title='Edit Vendor'
    ctaLabel='Save Changes'
    requirePassword={false}
    initialValues={
      vendor
        ? {
            first_name: vendor.name.split(' ')[0] ?? '',
            last_name: vendor.name.split(' ').slice(1).join(' ') || '',
            email: vendor.email,
            password: '', // user can set new password if needed
            phone_number: '', // not stored in current row shape
            type: vendor.designation,
            service_area: '',
            preferred_contact_method: 'phone',
          }
        : emptyValues
    }
    {...rest}
  />
);
