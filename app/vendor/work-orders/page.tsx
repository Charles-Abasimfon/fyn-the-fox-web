'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import VendorWorkOrdersTable, {
  VendorWorkOrderItem,
  VendorOrderStatus,
} from '@/components/dashboard/VendorWorkOrdersTable';
import VendorWorkOrderDetail from '@/components/dashboard/VendorWorkOrderDetail';
import EstimateForm from '@/components/dashboard/EstimateForm';
import WorkOrderChat from '@/components/dashboard/WorkOrderChat';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import {
  fetchComplaints,
  RawComplaint,
  updateComplaintStatus,
  acceptWorkOrder,
} from '@/lib/api/complaints';
import { createEstimate } from '@/lib/api/estimates';
import { ApiError } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';

const statusMapFromApi: Record<string, VendorOrderStatus> = {
  assigned: 'Assigned',
  completed: 'Completed',
  pending: 'Pending',
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  'estimate-needed': 'Estimate needed',
  'resident-confirmation': 'Resident confirmation',
  'pending-vendor-acceptance': 'Pending vendors acceptance',
};

function mapComplaintToVendorItem(c: RawComplaint): VendorWorkOrderItem {
  const tenantName = c.Complainant
    ? `${c.Complainant.first_name} ${c.Complainant.last_name}`
    : c.full_name || 'Unknown';

  // Try to get property address, fallback to apartment info or flattened address if not available
  const address = c.Property?.Address;
  let propertyAddress: string;
  if (address) {
    propertyAddress = [address.street, address.city].filter(Boolean).join(', ');
  } else if (c.Property?.name) {
    propertyAddress = c.Property.name;
  } else if (c.address) {
    propertyAddress = c.address;
  } else if (c.Complainant?.TenantInfo || c.unit_number) {
    const floor = c.Complainant?.TenantInfo?.floor_number;
    const apt = c.Complainant?.TenantInfo?.apartment_number || c.unit_number;
    propertyAddress = apt
      ? `Apt ${apt}${floor ? ', Floor ' + floor : ''}`
      : '-';
  } else {
    propertyAddress = '-';
  }

  const dt = c.eta ? new Date(c.eta) : null;
  const scheduledDate = dt
    ? dt.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '-';
  const scheduledTime = dt
    ? dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '-';
  const statusApi = c.status?.toLowerCase?.() || 'pending';
  const status = statusMapFromApi[statusApi] || 'Pending';
  return {
    id: c.id,
    tenantName,
    complaint: c.complain,
    propertyAddress,
    scheduledDate,
    scheduledTime,
    status,
  };
}

export default function VendorWorkOrdersPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const userId = (session as any)?.user?.id as string | undefined;

  const [items, setItems] = useState<VendorWorkOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<VendorWorkOrderItem | null>(null);

  // Standalone estimate form state
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);
  const [estimateWorkOrder, setEstimateWorkOrder] =
    useState<VendorWorkOrderItem | null>(null);
  const [creatingEstimate, setCreatingEstimate] = useState(false);

  // Standalone chat dialog state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWorkOrder, setChatWorkOrder] =
    useState<VendorWorkOrderItem | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch complaints and filter for this vendor
      const resp = await fetchComplaints({
        token: accessToken,
        page: 1,
        limit: 100,
      });
      const mine = resp.complaints.filter((c) => c.assigned_to === userId);
      setItems(mine.map(mapComplaintToVendorItem));
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to load work orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const withAction = async (
    item: VendorWorkOrderItem,
    next: 'accept' | 'complete' | 'estimate',
  ) => {
    if (!accessToken) return;
    try {
      if (next === 'accept') {
        await acceptWorkOrder({
          token: accessToken,
          id: String(item.id),
        });
      } else {
        const statusByAction: Record<'complete' | 'estimate', string> = {
          complete: 'completed',
          estimate: 'estimate-needed',
        };
        await updateComplaintStatus({
          token: accessToken,
          id: String(item.id),
          status: statusByAction[next],
        });
      }
      addToast({
        variant: 'success',
        title: 'Updated',
        description:
          next === 'accept'
            ? 'Work order accepted'
            : next === 'complete'
              ? 'Work order marked as completed'
              : 'Work order flagged for estimate',
      });
      await load();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Update failed';
      addToast({ variant: 'error', title: 'Action failed', description: msg });
    }
  };

  const handleCreateEstimate = async (data: {
    amount: number;
    description: string;
    attachment?: File | null;
  }) => {
    if (!estimateWorkOrder || !accessToken) return;
    setCreatingEstimate(true);
    try {
      await createEstimate({
        token: accessToken,
        workOrderId: String(estimateWorkOrder.id),
        payload: data,
      });
      addToast({
        variant: 'success',
        title: 'Estimate Created',
        description: 'Your estimate has been created successfully.',
      });
      setEstimateFormOpen(false);
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to create estimate';
      addToast({ variant: 'error', title: 'Error', description: msg });
    } finally {
      setCreatingEstimate(false);
    }
  };

  return (
    <div className='py-6 pt-8'>
      {loading && (
        <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm mb-6'>
          Loading work orders...
        </div>
      )}
      {error && !loading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load work orders</div>
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
          <VendorWorkOrdersTable
            items={items}
            onView={(item) => {
              setSelectedWorkOrder(item);
              setViewOpen(true);
            }}
            onChat={(item) => {
              setChatWorkOrder(item);
              setChatOpen(true);
            }}
            onAddEstimate={(item) => {
              setEstimateWorkOrder(item);
              setEstimateFormOpen(true);
            }}
            onAccept={(i) => withAction(i, 'accept')}
            onComplete={(i) => withAction(i, 'complete')}
            onNeedsEstimate={(i) => withAction(i, 'estimate')}
          />
          <VendorWorkOrderDetail
            workOrder={selectedWorkOrder}
            open={viewOpen}
            onOpenChange={setViewOpen}
          />

          {/* Standalone Estimate Form */}
          <EstimateForm
            workOrderId={String(estimateWorkOrder?.id || '')}
            workOrderDescription={estimateWorkOrder?.complaint || ''}
            open={estimateFormOpen}
            onOpenChange={setEstimateFormOpen}
            onSubmit={handleCreateEstimate}
            isLoading={creatingEstimate}
          />

          {/* Standalone Chat Dialog */}
          <CustomDialog
            open={chatOpen}
            onOpenChange={setChatOpen}
            className='max-w-lg'
          >
            <CustomDialogHeader title='Chat' />
            <CustomDialogBody className='flex flex-col'>
              <div className='flex-1 min-h-0 flex flex-col'>
                {accessToken && chatWorkOrder ? (
                  <WorkOrderChat
                    complaintId={String(chatWorkOrder.id)}
                    accessToken={accessToken}
                    currentUserId={userId}
                    currentUserName={
                      session?.user?.name ||
                      [
                        (session as any)?.user?.firstName,
                        (session as any)?.user?.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ') ||
                      undefined
                    }
                    currentUserRole={(session as any)?.user?.role || 'vendor'}
                  />
                ) : (
                  <div className='text-center py-8 text-[#BDBDBE]'>
                    Please sign in to use chat.
                  </div>
                )}
              </div>
            </CustomDialogBody>
          </CustomDialog>
        </>
      )}
    </div>
  );
}
