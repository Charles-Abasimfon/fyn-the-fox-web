'use client';
import React, { useEffect, useState } from 'react';
import WorkOrderFormDialog, {
  WorkOrderFormValues,
} from '@/components/dashboard/WorkOrderForm';
import { useSession } from 'next-auth/react';
import { fetchWorkOrderById, updateWorkOrder } from '@/lib/api/workOrders';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api/auth';
import { useParams, useRouter } from 'next/navigation';

export default function EditWorkOrderPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [open, setOpen] = useState(true);
  const [initial, setInitial] = useState<Partial<WorkOrderFormValues> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!accessToken || !id) return;
      setLoading(true);
      setError(null);
      try {
        const wo = await fetchWorkOrderById({ token: accessToken, id });
        setInitial({
          complain: wo.complain,
          category: wo.category || '',
          urgency: wo.urgency || 'medium',
          eta: wo.eta || '',
        });
      } catch (e: any) {
        const msg =
          e instanceof ApiError ? e.message : 'Failed to load work order';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, id]);

  const handleSubmit = async (values: WorkOrderFormValues) => {
    if (!accessToken || !id) return;
    try {
      await updateWorkOrder({
        token: accessToken,
        id,
        payload: {
          complain: values.complain.trim(),
          category: values.category.trim() || undefined,
          urgency: values.urgency.trim() || undefined,
          eta: values.eta?.trim() || null,
          scheduled_date: null,
          status: 'resident-confirmation',
        },
      });
      addToast({
        variant: 'success',
        title: 'Work order updated',
        description: 'Work order changes saved',
      });
      router.push('/property-owner/work-orders');
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to update work order';
      addToast({ variant: 'error', title: 'Update failed', description: msg });
    }
  };

  if (loading) {
    return (
      <div className='py-6 pt-8'>
        <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm mb-6'>
          Loading work order...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className='py-6 pt-8'>
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load work order</div>
          <div className='text-red-300'>{error}</div>
          <button
            onClick={() => router.push('/property-owner/work-orders')}
            className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='py-6 pt-8'>
      <WorkOrderFormDialog
        title='Edit Work Order'
        ctaLabel='Save Changes'
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) router.push('/property-owner/work-orders');
        }}
        initialValues={initial ?? undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
