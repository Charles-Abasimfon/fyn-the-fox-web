'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import EstimatesTable, {
  EstimateItem,
} from '@/components/dashboard/EstimatesTable';
import ViewEstimate from '@/components/dashboard/ViewEstimate';
import {
  fetchEstimates,
  Estimate,
  sendEstimate,
  deleteEstimate,
  getEstimateAttachment,
} from '@/lib/api/estimates';
import { ApiError } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';

function mapEstimateToItem(
  estimate: Estimate & Record<string, any>,
): EstimateItem {
  const dateStr = estimate.created_at || estimate.createdAt;
  const createdDate = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '-';

  const amount =
    typeof estimate.amount === 'string'
      ? parseFloat(estimate.amount)
      : estimate.amount;

  // Calculate amount from EstimateItems if available
  const estimateItems = estimate.EstimateItems || [];
  const calculatedAmount =
    estimateItems.length > 0
      ? estimateItems.reduce((sum: number, item: any) => {
          const qty =
            typeof item.quantity === 'string'
              ? parseFloat(item.quantity)
              : item.quantity;
          const price =
            typeof item.unit_price === 'string'
              ? parseFloat(item.unit_price)
              : item.unit_price;
          return sum + qty * price;
        }, 0)
      : amount;

  return {
    id: estimate.id,
    workOrderId: estimate.work_order_id,
    workOrderDescription: estimate.description || 'Work Order',
    propertyAddress: '-',
    tenantName: '-',
    amount: calculatedAmount,
    description: estimate.description,
    status: estimate.status,
    createdAt: createdDate,
    attachmentUrl: estimate.attachment_url,
  };
}

export default function VendorEstimatesPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [items, setItems] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateItem | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchEstimates({
        token: accessToken,
        page: 1,
        limit: 100,
      });
      setItems(resp.estimates.map(mapEstimateToItem));
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to load estimates';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async (item: EstimateItem) => {
    if (!accessToken) return;
    try {
      await sendEstimate({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Estimate Sent',
        description: 'Estimate has been sent to the property manager.',
      });
      await load();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to send estimate';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleDelete = async (item: EstimateItem) => {
    if (!accessToken) return;
    try {
      await deleteEstimate({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Estimate Deleted',
        description: 'Estimate has been deleted.',
      });
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to delete estimate';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleViewAttachment = async (item: EstimateItem) => {
    if (!accessToken) return;
    try {
      const url = await getEstimateAttachment({
        token: accessToken,
        id: item.id,
      });
      if (url) {
        window.open(url, '_blank');
      } else {
        addToast({
          variant: 'error',
          title: 'No Attachment',
          description: 'No attachment found for this estimate.',
        });
      }
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to get attachment';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  return (
    <div className='py-6 pt-8'>
      {loading && (
        <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm mb-6'>
          Loading estimates...
        </div>
      )}
      {error && !loading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load estimates</div>
          <div className='text-red-300'>{error}</div>
          <button
            onClick={load}
            className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          <EstimatesTable
            items={items}
            onView={(item) => {
              setSelectedEstimate(item);
              setViewOpen(true);
            }}
            onSend={handleSend}
            onDelete={handleDelete}
            onViewAttachment={handleViewAttachment}
          />
          <ViewEstimate
            estimate={selectedEstimate}
            open={viewOpen}
            onOpenChange={setViewOpen}
            onDownloadAttachment={() => {
              if (selectedEstimate) {
                handleViewAttachment(selectedEstimate);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
