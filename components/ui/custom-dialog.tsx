'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const CustomDialog = ({
  open,
  onOpenChange,
  children,
  className,
}: CustomDialogProps) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] sm:backdrop-blur data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className={cn(
            // Wrapper that positions the close button and panel side-by-side
            'fixed right-4 inset-y-4 z-50 flex items-start gap-3 p-0 bg-transparent border-0 shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-2 data-[state=open]:slide-in-from-right-2',
            className
          )}
        >
          {/* Close button sits outside to the left, no overlap */}
          <DialogPrimitive.Close
            className='rounded-full p-2 text-white opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/50 bg-[#201F1F] backdrop-blur-sm'
            aria-label='Close'
          >
            <X className='h-4 w-4' />
          </DialogPrimitive.Close>

          {/* The actual sheet panel */}
          <div className='w-[560px] max-w-[calc(100vw-6rem)] bg-[#201F1F] rounded-2xl shadow-lg overflow-hidden flex h-full max-h-full flex-col'>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const CustomDialogHeader = ({
  title,
  rightSlot,
}: {
  title: string;
  rightSlot?: React.ReactNode;
}) => {
  return (
    <div className='flex items-center justify-between p-6 pb-4 flex-none'>
      <DialogPrimitive.Title asChild>
        <h2 className='text-[20px] font-semibold text-white'>{title}</h2>
      </DialogPrimitive.Title>
      {rightSlot}
    </div>
  );
};

const CustomDialogBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'px-8 pr-10 py-6 pt-5 flex-1 overflow-y-auto min-h-0 custom-scrollbar',
        className
      )}
    >
      {children}
    </div>
  );
};

const CustomDialogFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  if (!children) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-end p-6 pt-4 border-t border-[#434343] flex-none',
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
  CustomDialogFooter,
};
