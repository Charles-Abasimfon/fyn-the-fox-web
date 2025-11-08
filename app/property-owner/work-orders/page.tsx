'use client';
import React, { useCallback, useEffect, useState } from 'react';
import WorkOrdersTable, {
  WorkOrder,
  VendorOption,
} from '@/components/dashboard/WorkOrdersTable';
import { useSession } from 'next-auth/react';
import {
  fetchComplaints,
  RawComplaint,
  assignVendor,
  setSchedule,
} from '@/lib/api/complaints';
import { ApiError } from '@/lib/api/auth';
import { fetchVendors, RawVendor } from '@/lib/api/vendors';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { retractVendorFromProperty } from '@/lib/api/properties';

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
    'pending-vendor-acceptance': 'Pending vendors acceptance',
  };
  const status = statusMap[c.status.toLowerCase()] || 'Pending';

  return {
    id: c.id,
    name: complainantName,
    complaint: c.complain,
    propertyAddress,
    propertyId: c.property_id,
    units,
    assignedTo: vendorName,
    assignedRole: vendorRole,
    vendorId: c.Vendor?.id || null,
    scheduledDate,
    scheduledTime,
    status,
  };
}

const WorkOrdersPage = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorsLoading, setVendorsLoading] = useState(false);

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

  const mapVendor = useCallback((v: RawVendor): VendorOption => {
    const roleRaw = v.VendorInfo?.type || 'Unknown';
    const role = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);
    return {
      id: v.id,
      name: `${v.first_name} ${v.last_name}`.trim(),
      email: (v as any).email || 'unknown@example.com',
      role,
    };
  }, []);

  const loadVendors = useCallback(async () => {
    if (!accessToken) return;
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const resp = await fetchVendors({
        token: accessToken,
        page: 1,
        limit: 20,
      });
      setVendors(resp.vendors.map(mapVendor));
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load vendors';
      setVendorsError(msg);
    } finally {
      setVendorsLoading(false);
    }
  }, [accessToken, mapVendor]);

  useEffect(() => {
    load();
    loadVendors();
  }, [load, loadVendors]);

  return (
    <div className='py-6 pt-8'>
      <div className='flex items-center justify-end mb-3'>
        <button
          onClick={() => router.push('/property-owner/work-orders/add')}
          className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
        >
          Add Work Order
        </button>
      </div>
      {vendorsLoading && (
        <div className='bg-[#FFFFFF0D] rounded-lg p-4 text-center text-white/70 text-xs mb-3'>
          Loading vendors...
        </div>
      )}
      {vendorsError && !vendorsLoading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-4 text-red-400 text-xs mb-3 flex items-center justify-between'>
          <span>{vendorsError}</span>
          <button
            onClick={loadVendors}
            className='px-3 py-1 rounded-md bg-[#F77F00] text-white text-xs font-medium hover:bg-[#f78f20]'
          >
            Retry
          </button>
        </div>
      )}
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
        <WorkOrdersTable
          workOrders={workOrders}
          vendors={vendors}
          onAssignVendor={({ complaint, vendor }) => {
            (async () => {
              if (!accessToken) return;
              try {
                await assignVendor({
                  token: accessToken,
                  payload: {
                    complaint_id: String(complaint.id),
                    vendor_id: vendor.id,
                  },
                });
                addToast({
                  variant: 'success',
                  title: 'Vendor assigned',
                  description: `${vendor.name} was assigned to the work order`,
                });
                load();
              } catch (e: any) {
                const msg =
                  e instanceof ApiError ? e.message : 'Failed to assign vendor';
                addToast({
                  variant: 'error',
                  title: 'Assignment failed',
                  description: msg,
                });
              }
            })();
          }}
          onScheduleSet={({ complaint, date }) => {
            (async () => {
              if (!accessToken) return;
              try {
                await setSchedule({
                  token: accessToken,
                  payload: {
                    complaint_id: String(complaint.id),
                    date: date,
                  },
                });
                addToast({
                  variant: 'success',
                  title: 'Schedule set',
                  description: 'Work order schedule has been updated',
                });
                load();
              } catch (e: any) {
                const msg =
                  e instanceof ApiError ? e.message : 'Failed to set schedule';
                addToast({
                  variant: 'error',
                  title: 'Schedule failed',
                  description: msg,
                });
              }
            })();
          }}
          onRetractVendorFromProperty={({ complaint }) => {
            (async () => {
              if (!accessToken) return;
              try {
                await retractVendorFromProperty({
                  token: accessToken,
                  payload: {
                    property_id: String((complaint as any).propertyId),
                    vendor_id: String((complaint as any).vendorId),
                  },
                });
                addToast({
                  variant: 'success',
                  title: 'Vendor retracted',
                  description: 'Vendor has been retracted from the property',
                });
                load();
              } catch (e: any) {
                const msg =
                  e instanceof ApiError
                    ? e.message
                    : 'Failed to retract vendor';
                addToast({
                  variant: 'error',
                  title: 'Retraction failed',
                  description: msg,
                });
              }
            })();
          }}
          onEdit={(wo) =>
            router.push(`/property-owner/work-orders/${wo.id}/edit`)
          }
        />
      )}
    </div>
  );
};

export default WorkOrdersPage;
