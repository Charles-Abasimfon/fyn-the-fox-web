'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import OverviewCard from '@/components/dashboard/OverviewCard';
import VendorWorkOrdersTable, {
  VendorWorkOrderItem,
  VendorOrderStatus,
} from '@/components/dashboard/VendorWorkOrdersTable';
import ViewWorkOrder from '@/components/dashboard/ViewWorkOrder';
import {
  fetchComplaints,
  RawComplaint,
  updateComplaintStatus,
  acceptWorkOrder,
} from '@/lib/api/complaints';
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
    : 'Unknown';

  // Try to get property address, fallback to apartment info if not available
  const address = c.Property?.Address;
  let propertyAddress: string;
  if (address) {
    propertyAddress = [address.street, address.city].filter(Boolean).join(', ');
  } else if (c.Property?.name) {
    propertyAddress = c.Property.name;
  } else if (c.Complainant?.TenantInfo) {
    const floor = c.Complainant.TenantInfo.floor_number;
    const apt = c.Complainant.TenantInfo.apartment_number;
    propertyAddress = `Apt ${apt}, Floor ${floor}`;
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

export default function VendorDashboardPage() {
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

  const stats = useMemo(() => {
    const total = items.length;
    const open = items.filter((i) => i.status !== 'Completed').length;
    const completed = items.filter((i) => i.status === 'Completed').length;
    const pendingAcceptance = items.filter(
      (i) => i.status === 'Pending vendors acceptance'
    ).length;
    return { total, open, completed, pendingAcceptance };
  }, [items]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      // Reuse complaints endpoint but filter client-side for this vendor
      const resp = await fetchComplaints({
        token: accessToken,
        page: 1,
        limit: 50,
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
    next: 'accept' | 'complete' | 'estimate'
  ) => {
    if (!accessToken) return;
    try {
      if (next === 'accept') {
        // Use dedicated accept work order endpoint
        await acceptWorkOrder({
          token: accessToken,
          id: String(item.id),
        });
      } else {
        // Use status update endpoint for complete and estimate
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

  return (
    <div className='py-6 pt-8'>
      {/* Stat cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        <OverviewCard
          title='My work orders'
          count={stats.total}
          icon='/icons/complaint.svg'
          updatedTime='Just now'
          linkText='View all work orders'
          linkHref='/vendor/work-orders'
        />
        <OverviewCard
          title='Open work orders'
          count={stats.open}
          icon='/icons/in-progress.svg'
          updatedTime='Just now'
          linkText='View open work orders'
          linkHref='/vendor/work-orders'
        />
        <OverviewCard
          title='Completed work orders'
          count={stats.completed}
          icon='/icons/completed.svg'
          updatedTime='Just now'
          linkText='View completed work orders'
          linkHref='/vendor/work-orders'
        />
        <OverviewCard
          title='Pending acceptance'
          count={stats.pendingAcceptance}
          icon='/icons/assigned.svg'
          updatedTime='Just now'
          linkText='Review'
          linkHref='/vendor/work-orders'
        />
      </div>

      {/* Table */}
      <div className='mt-8'>
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
              onAccept={(i) => withAction(i, 'accept')}
              onComplete={(i) => withAction(i, 'complete')}
              onNeedsEstimate={(i) => withAction(i, 'estimate')}
            />
            <ViewWorkOrder
              workOrder={selectedWorkOrder}
              open={viewOpen}
              onOpenChange={setViewOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}
