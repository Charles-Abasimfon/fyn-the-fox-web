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
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            // Reduce blur on mobile for better performance
            'sm:backdrop-blur'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // Mobile-first: full screen overlay with safe area support, Desktop: side sheet with close button
            'fixed inset-4 z-50 flex flex-col p-0 bg-transparent border-0 shadow-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2',
            // Desktop: side sheet behavior
            'sm:inset-y-4 sm:left-auto sm:right-4 sm:flex-row sm:items-start sm:gap-3',
            'sm:data-[state=closed]:slide-out-to-right-2 sm:data-[state=open]:slide-in-from-right-2',
            className
          )}
        >
          {/* Close button - mobile: inside panel, desktop: outside to the left */}
          <DialogPrimitive.Close
            className={cn(
              // Mobile: absolute top-right inside panel
              'absolute top-4 right-4 z-10 rounded-full p-2 text-white opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/50 bg-[#201F1F] backdrop-blur-sm',
              // Desktop: positioned outside to the left
              'sm:relative sm:top-0 sm:right-0 sm:order-first sm:flex-shrink-0'
            )}
            aria-label='Close'
          >
            <X className='h-4 w-4' />
          </DialogPrimitive.Close>

          {/* The actual sheet panel */}
          <div
            className={cn(
              // Mobile: full screen with rounded top corners
              'w-full h-full bg-[#201F1F] rounded-t-2xl shadow-lg overflow-hidden flex flex-col',
              // Desktop: fixed width side sheet with all rounded corners
              'sm:w-[640px] sm:max-w-[calc(100vw-6rem)] sm:h-full sm:max-h-full sm:rounded-2xl'
            )}
          >
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
    <div
      className={cn(
        // Mobile: more compact padding, account for close button
        'flex items-center justify-between p-4 pr-12 pb-3 flex-none',
        // Desktop: standard padding
        'sm:p-6 sm:pr-6 sm:pb-4'
      )}
    >
      <DialogPrimitive.Title asChild>
        <h2
          className={cn(
            // Mobile: smaller text
            'text-lg font-semibold text-white',
            // Desktop: larger text
            'sm:text-[20px]'
          )}
        >
          {title}
        </h2>
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
        // Mobile: reduced padding for better space utilization
        'px-4 py-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar',
        // Desktop: more generous padding
        'sm:px-8 sm:pr-10 sm:py-6 sm:pt-5',
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
        // Mobile: more compact padding
        'flex items-center justify-end p-4 pt-3 border-t border-[#434343] flex-none',
        // Desktop: standard padding
        'sm:p-6 sm:pt-4',
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
