'use client';
import React, { useState } from 'react';
import WorkOrderFormDialog, {
  WorkOrderFormValues,
} from '@/components/dashboard/WorkOrderForm';
import { useSession } from 'next-auth/react';
import { createWorkOrder } from '@/lib/api/workOrders';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export default function AddWorkOrderPage() {
  const [open, setOpen] = useState(true);
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (values: WorkOrderFormValues) => {
    if (!accessToken) return;
    try {
      await createWorkOrder({
        token: accessToken,
        payload: {
          complain: values.complain.trim(),
          user_id: values.user_id?.trim(),
          category: values.category.trim() || undefined,
          urgency: values.urgency.trim() || undefined,
          property_id: values.property_id?.trim(),
        },
      });
      addToast({
        variant: 'success',
        title: 'Work order created',
        description: 'New work order has been created',
      });
      router.push('/property-owner/work-orders');
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to create work order';
      addToast({ variant: 'error', title: 'Create failed', description: msg });
    }
  };

  return (
    <div className='py-6 pt-8'>
      <WorkOrderFormDialog
        title='Add Work Order'
        ctaLabel='Create Work Order'
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) router.push('/property-owner/work-orders');
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
