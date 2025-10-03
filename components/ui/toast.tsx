'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
  action?: React.ReactNode;
  onClose?: () => void;
}

export interface ToastInternal extends Required<Omit<ToastOptions, 'id'>> {
  id: string;
} // normalized

interface ToastContextValue {
  addToast: (opts: ToastOptions) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};

const genId = () => Math.random().toString(36).slice(2, 10);

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-[#27272B] border-[#3A3A3F] text-white',
  success: 'bg-[#172C20] border-[#1d3a28] text-[#00CB5C]',
  error: 'bg-[#2B1D1C] border-[#5e2c2a] text-[#FF6C6C]',
  warning: 'bg-[#271B16] border-[#4A2F14] text-[#F77F00]',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const tm = timers.current[id];
    if (tm) {
      clearTimeout(tm);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback(
    (opts: ToastOptions) => {
      const id = opts.id || genId();
      const toast: ToastInternal = {
        id,
        title: opts.title || '',
        description: opts.description || '',
        variant: opts.variant || 'default',
        duration: opts.duration ?? 4000,
        action: opts.action ?? null,
        onClose: opts.onClose || (() => {}),
      };
      setToasts((list) => [...list, toast]);
      if (toast.duration > 0) {
        timers.current[id] = setTimeout(() => {
          toast.onClose();
          removeToast(id);
        }, toast.duration);
      }
      return id;
    },
    [removeToast]
  );

  // Cleanup on unmount
  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const Toaster: React.FC<{
  toasts: ToastInternal[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className='fixed z-[60] bottom-4 right-4 flex w-full max-w-sm flex-col gap-3'>
      {toasts.map((t) => (
        <div
          key={t.id}
          role='status'
          className={cn(
            'group relative overflow-hidden rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right text-sm',
            variantStyles[t.variant]
          )}
        >
          <div className='flex items-start gap-3'>
            <div className='flex-1'>
              {t.title && (
                <div className='font-semibold leading-5 mb-0.5'>{t.title}</div>
              )}
              {t.description && (
                <div
                  className={cn(
                    'text-xs leading-relaxed opacity-90',
                    t.variant === 'default' ? 'text-[#BDBDBE]' : ''
                  )}
                >
                  {t.description}
                </div>
              )}
              {t.action && <div className='mt-2'>{t.action}</div>}
            </div>
            <button
              aria-label='Close'
              onClick={() => {
                t.onClose();
                onDismiss(t.id);
              }}
              className='opacity-60 hover:opacity-100 transition text-current'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='size-4'
              >
                <path d='M18 6L6 18' />
                <path d='M6 6l12 12' />
              </svg>
            </button>
          </div>
          <div className='absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-white/10 via-white/20 to-white/10' />
        </div>
      ))}
    </div>
  );
};
