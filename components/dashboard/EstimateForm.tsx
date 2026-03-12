'use client';

import React, { useState, useEffect } from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';

interface EstimateFormProps {
  workOrderId: string;
  workOrderDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    amount: number;
    description: string;
    attachment?: File | null;
  }) => Promise<void>;
  isLoading?: boolean;
  // For edit mode
  initialData?: {
    amount: number;
    description: string;
  };
  mode?: 'create' | 'edit';
}

const EstimateForm = ({
  workOrderId,
  workOrderDescription,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialData,
  mode = 'create',
}: EstimateFormProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setAmount(String(initialData.amount));
      setDescription(initialData.description);
    } else if (mode === 'create') {
      setAmount('');
      setDescription('');
      setAttachment(null);
    }
  }, [initialData, mode, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({
          ...errors,
          attachment: 'File size must be less than 10MB',
        });
        return;
      }
      setAttachment(file);
      setErrors({ ...errors, attachment: '' });
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      amount: parseFloat(amount),
      description: description.trim(),
      attachment,
    });

    // Reset form on success
    if (mode === 'create') {
      setAmount('');
      setDescription('');
      setAttachment(null);
      setErrors({});
    }
  };

  return (
    <CustomDialog open={open} onOpenChange={onOpenChange} className='max-w-md'>
      <CustomDialogHeader
        title={mode === 'edit' ? 'Edit Estimate' : 'Create Estimate'}
      />

      <CustomDialogBody>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Work Order Info */}
          <div className='bg-[#FFFFFF08] rounded-lg p-4'>
            <Label className='text-[#BDBDBE] text-sm'>Work Order</Label>
            <div className='text-white font-medium mt-1'>
              {workOrderDescription}
            </div>
          </div>

          {/* Amount */}
          <div className='space-y-2'>
            <Label htmlFor='amount' className='text-white'>
              Estimated Amount <span className='text-red-400'>*</span>
            </Label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBE]'>
                $
              </span>
              <input
                id='amount'
                type='number'
                step='0.01'
                min='0'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
                className='w-full h-10 bg-[#141414] border border-[#434343] rounded-md pl-8 pr-3 text-white placeholder:text-[#BDBDBE] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
              />
            </div>
            {errors.amount && (
              <p className='text-red-400 text-sm'>{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-white'>
              Description <span className='text-red-400'>*</span>
            </Label>
            <textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Describe the work to be done and cost breakdown...'
              rows={4}
              className='w-full bg-[#141414] border border-[#434343] rounded-md px-3 py-2 text-white placeholder:text-[#BDBDBE] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none'
            />
            {errors.description && (
              <p className='text-red-400 text-sm'>{errors.description}</p>
            )}
          </div>

          {/* Attachment */}
          <div className='space-y-2'>
            <Label className='text-white'>
              Attachment (Quote/Estimate Document)
            </Label>
            {attachment ? (
              <div className='flex items-center gap-3 bg-[#FFFFFF08] rounded-lg p-3'>
                <FileText className='h-5 w-5 text-[#F77F00]' />
                <div className='flex-1 min-w-0'>
                  <p className='text-white text-sm truncate'>
                    {attachment.name}
                  </p>
                  <p className='text-[#BDBDBE] text-xs'>
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type='button'
                  onClick={removeAttachment}
                  className='p-1 hover:bg-white/10 rounded'
                >
                  <X className='h-4 w-4 text-[#BDBDBE]' />
                </button>
              </div>
            ) : (
              <label className='flex flex-col items-center justify-center gap-2 h-24 bg-[#FFFFFF08] border border-dashed border-[#434343] rounded-lg cursor-pointer hover:bg-[#FFFFFF10] transition-colors'>
                <Upload className='h-6 w-6 text-[#BDBDBE]' />
                <span className='text-[#BDBDBE] text-sm'>
                  Click to upload estimate document
                </span>
                <input
                  type='file'
                  accept='.pdf,.doc,.docx,.png,.jpg,.jpeg'
                  onChange={handleFileChange}
                  className='hidden'
                />
              </label>
            )}
            {errors.attachment && (
              <p className='text-red-400 text-sm'>{errors.attachment}</p>
            )}
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='flex-1 bg-[#F77F00] hover:bg-[#f78f20]'
              disabled={isLoading}
            >
              {isLoading
                ? mode === 'edit'
                  ? 'Saving...'
                  : 'Creating...'
                : mode === 'edit'
                  ? 'Save Changes'
                  : 'Create Estimate'}
            </Button>
          </div>
        </form>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default EstimateForm;
