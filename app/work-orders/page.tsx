'use client';
import React, { useCallback, useEffect, useState } from 'react';
import WorkOrdersTable, {
  WorkOrder,
} from '@/components/dashboard/WorkOrdersTable';
import { useSession } from 'next-auth/react';
import { fetchComplaints, RawComplaint } from '@/lib/api/complaints';
import { ApiError } from '@/lib/api/auth';

// Map RawComplaint (API) -> WorkOrder (UI)
function mapComplaintToWorkOrder(c: RawComplaint): WorkOrder {
  const complainantName = c.Complainant
    ? `${c.Complainant.first_name} ${c.Complainant.last_name}`
    : 'Unknown';
  const vendorName = c.Vendor
    ? `${c.Vendor.first_name} ${c.Vendor.last_name}`
    : '-';
  const vendorRole = c.Vendor?.VendorInfo?.type
    ? c.Vendor.VendorInfo.type.charAt(0).toUpperCase() +
      c.Vendor.VendorInfo.type.slice(1)
    : '-';
  const address = c.Property?.Address;
  const propertyAddress = address
    ? [address.street, address.city].filter(Boolean).join(', ')
    : c.Property?.name || '-';
  const units = c.Complainant?.TenantInfo?.apartment_number || '-';

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

  const statusMap: Record<string, WorkOrder['status']> = {
    assigned: 'Assigned',
    completed: 'Completed',
    pending: 'Pending',
    scheduled: 'Scheduled',
    'in-progress': 'In Progress',
  };
  const status = statusMap[c.status.toLowerCase()] || 'Pending';

  return {
    id: c.id,
    name: complainantName,
    complaint: c.complain,
    propertyAddress,
    units,
    assignedTo: vendorName,
    assignedRole: vendorRole,
    scheduledDate,
    scheduledTime,
    status,
  };
}

const WorkOrdersPage = () => {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return; // session not ready
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchComplaints({
        token: accessToken,
        page: 1,
        limit: 20,
      });
      setWorkOrders(resp.complaints.map(mapComplaintToWorkOrder));
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to load work orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

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
      {!loading && !error && <WorkOrdersTable workOrders={workOrders} />}
    </div>
  );
};

export default WorkOrdersPage;
