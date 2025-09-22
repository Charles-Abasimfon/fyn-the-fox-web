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

type VendorFormValues = Pick<VendorRow, 'name' | 'email' | 'designation'>;

interface VendorFormDialogProps {
  title: string;
  ctaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: VendorFormValues;
  onSubmit: (values: VendorFormValues) => void | Promise<void>;
}

const emptyValues: VendorFormValues = {
  name: '',
  email: '',
  designation: '',
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
    !values.name.trim() ||
    !values.designation.trim() ||
    !isValidEmail(values.email.trim());

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader title={title} />
      <CustomDialogBody>
        <div className='space-y-6'>
          <Input
            label='Vendors Name'
            placeholder='e.g., John Doe'
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
          <Input
            label='Vendors Email'
            placeholder='e.g., example@email.com'
            type='email'
            value={values.email}
            onChange={(e) =>
              setValues((v) => ({ ...v, email: e.target.value }))
            }
          />
          <Input
            label='Vendors Designation'
            placeholder='e.g., Plumber'
            value={values.designation}
            onChange={(e) =>
              setValues((v) => ({ ...v, designation: e.target.value }))
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
  <VendorFormDialog title='Add Vendor' ctaLabel='Add Vendor' {...props} />
);

export const EditVendorDialog: React.FC<
  Omit<VendorFormDialogProps, 'title' | 'ctaLabel' | 'initialValues'> & {
    vendor: VendorRow | null;
  }
> = ({ vendor, ...rest }) => (
  <VendorFormDialog
    title='Edit Vendor'
    ctaLabel='Save Changes'
    initialValues={
      vendor
        ? {
            name: vendor.name,
            email: vendor.email,
            designation: vendor.designation,
          }
        : emptyValues
    }
    {...rest}
  />
);

export type { VendorFormValues };
