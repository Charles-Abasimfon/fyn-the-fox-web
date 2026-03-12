'use client';

import React, { useState, useRef } from 'react';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Upload, X, FileText } from 'lucide-react';
import { InvoiceItemPayload, InvoiceItemType } from '@/lib/api/invoices';

interface InvoiceFormProps {
  workOrderId: string;
  workOrderDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    description: string;
    items: InvoiceItemPayload[];
    file?: File | null;
  }) => Promise<void>;
  isLoading?: boolean;
}

const defaultItem = (): InvoiceItemPayload => ({
  name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  type: 'service',
});

const itemTypes: { value: InvoiceItemType; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'other', label: 'Other' },
];

const InvoiceForm = ({
  workOrderId,
  workOrderDescription,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: InvoiceFormProps) => {
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<InvoiceItemPayload[]>([defaultItem()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    setItems([...items, defaultItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItemPayload,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate items
    let hasItemError = false;
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}_name`] = 'Item name is required';
        hasItemError = true;
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        hasItemError = true;
      }
      if (item.unit_price <= 0) {
        newErrors[`item_${index}_price`] = 'Unit price must be greater than 0';
        hasItemError = true;
      }
    });

    if (hasItemError) {
      newErrors.items = 'Please fix item errors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      description: description.trim(),
      items: items.map((item) => ({
        ...item,
        name: item.name.trim(),
        description: item.description || '',
      })),
      file: file,
    });

    // Reset form on success
    setDescription('');
    setItems([defaultItem()]);
    setErrors({});
    setFile(null);
  };

  const handleClose = () => {
    setDescription('');
    setItems([defaultItem()]);
    setErrors({});
    setFile(null);
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <CustomDialog open={open} onOpenChange={handleClose} className='max-w-2xl'>
      <CustomDialogHeader title='Create Invoice' />

      <CustomDialogBody>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Work Order Info */}
          <div className='bg-[#FFFFFF08] rounded-lg p-4'>
            <Label className='text-[#BDBDBE] text-sm'>Work Order</Label>
            <div className='text-white font-medium mt-1'>
              {workOrderDescription}
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-white'>
              Invoice Description <span className='text-red-400'>*</span>
            </Label>
            <textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Describe the work completed...'
              rows={2}
              className='w-full bg-[#141414] border border-[#434343] rounded-md px-3 py-2 text-white placeholder:text-[#BDBDBE] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none'
            />
            {errors.description && (
              <p className='text-red-400 text-sm'>{errors.description}</p>
            )}
          </div>

          {/* Line Items */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-white'>
                Line Items <span className='text-red-400'>*</span>
              </Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addItem}
                className='gap-1'
              >
                <Plus className='h-4 w-4' />
                Add Item
              </Button>
            </div>

            {errors.items && (
              <p className='text-red-400 text-sm'>{errors.items}</p>
            )}

            <div className='space-y-4 max-h-[300px] overflow-y-auto'>
              {items.map((item, index) => (
                <div
                  key={index}
                  className='bg-[#FFFFFF08] rounded-lg p-4 space-y-3'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-white font-medium text-sm'>
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeItem(index)}
                        className='p-1 hover:bg-red-500/20 rounded text-red-400'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    {/* Item Name */}
                    <div className='col-span-2 sm:col-span-1'>
                      <Label className='text-[#BDBDBE] text-xs mb-1 block'>
                        Name <span className='text-red-400'>*</span>
                      </Label>
                      <input
                        type='text'
                        value={item.name}
                        onChange={(e) =>
                          updateItem(index, 'name', e.target.value)
                        }
                        placeholder='Item name'
                        className='w-full h-9 bg-[#FFFFFF0D] border border-white/20 rounded-lg px-3 text-sm text-white placeholder:text-white/40 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                      />
                      {errors[`item_${index}_name`] && (
                        <p className='text-red-400 text-xs mt-1'>
                          {errors[`item_${index}_name`]}
                        </p>
                      )}
                    </div>

                    {/* Item Type */}
                    <div className='col-span-2 sm:col-span-1'>
                      <Label className='text-[#BDBDBE] text-xs mb-1 block'>
                        Type
                      </Label>
                      <Select
                        value={item.type}
                        onValueChange={(value) =>
                          updateItem(index, 'type', value as InvoiceItemType)
                        }
                      >
                        <SelectTrigger className='w-full h-9 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white text-sm'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent className='bg-[#1c1c1c] border-[#434343]'>
                          {itemTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className='text-white focus:bg-[#F77F00] focus:text-white'
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <Label className='text-[#BDBDBE] text-xs mb-1 block'>
                        Quantity <span className='text-red-400'>*</span>
                      </Label>
                      <input
                        type='number'
                        min='1'
                        step='1'
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className='w-full h-9 bg-[#FFFFFF0D] border border-white/20 rounded-lg px-3 text-sm text-white outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className='text-red-400 text-xs mt-1'>
                          {errors[`item_${index}_quantity`]}
                        </p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div>
                      <Label className='text-[#BDBDBE] text-xs mb-1 block'>
                        Unit Price <span className='text-red-400'>*</span>
                      </Label>
                      <div className='relative'>
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBE] text-sm'>
                          $
                        </span>
                        <input
                          type='number'
                          min='0'
                          step='0.01'
                          value={item.unit_price || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'unit_price',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder='0.00'
                          className='w-full h-9 bg-[#FFFFFF0D] border border-white/20 rounded-lg pl-7 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                        />
                      </div>
                      {errors[`item_${index}_price`] && (
                        <p className='text-red-400 text-xs mt-1'>
                          {errors[`item_${index}_price`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className='flex justify-end pt-2 border-t border-[#434343]'>
                    <span className='text-[#BDBDBE] text-sm'>
                      Subtotal:{' '}
                      <span className='text-white font-medium'>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Attachment */}
          <div className='space-y-2'>
            <Label className='text-white'>Attachment (Optional)</Label>
            <div className='space-y-2'>
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className='border-2 border-dashed border-[#434343] rounded-lg p-6 text-center cursor-pointer hover:border-[#F77F00] hover:bg-[#FFFFFF08] transition-colors'
                >
                  <Upload className='h-8 w-8 mx-auto mb-2 text-[#BDBDBE]' />
                  <p className='text-white text-sm font-medium'>
                    Click to upload file
                  </p>
                  <p className='text-[#BDBDBE] text-xs mt-1'>
                    PDF, PNG, JPG up to 10MB
                  </p>
                </div>
              ) : (
                <div className='bg-[#FFFFFF08] rounded-lg p-3 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-[#F77F00]/20 p-2 rounded-lg'>
                      <FileText className='h-5 w-5 text-[#F77F00]' />
                    </div>
                    <div>
                      <p className='text-white text-sm font-medium truncate max-w-[200px]'>
                        {file.name}
                      </p>
                      <p className='text-[#BDBDBE] text-xs'>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={removeFile}
                    className='p-1 hover:bg-red-500/20 rounded text-red-400'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type='file'
                accept='.pdf,.png,.jpg,.jpeg'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
          </div>

          {/* Total */}
          <div className='bg-[#F77F00]/10 rounded-lg p-4 flex items-center justify-between'>
            <span className='text-white font-medium'>Total Amount</span>
            <span className='text-white text-2xl font-bold'>
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='flex-1 bg-[#F77F00] hover:bg-[#f78f20]'
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </CustomDialogBody>
    </CustomDialog>
  );
};

export default InvoiceForm;
