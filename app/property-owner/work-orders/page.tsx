'use client';
import React, { useCallback, useEffect, useState } from 'react';
import WorkOrdersTable, {
  WorkOrder,
  VendorOption,
} from '@/components/dashboard/WorkOrdersTable';
import PropertyOwnerWorkOrderDetail from '@/components/dashboard/PropertyOwnerWorkOrderDetail';
import WorkOrderChat from '@/components/dashboard/WorkOrderChat';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  fetchComplaints,
  RawComplaint,
  assignVendor,
  setSchedule,
} from '@/lib/api/complaints';
import { ApiError } from '@/lib/api/auth';
import { fetchVendors, RawVendor } from '@/lib/api/vendors';
import {
  Estimate,
  fetchEstimatesByWorkOrder,
  approveEstimate,
  rejectEstimate,
} from '@/lib/api/estimates';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { retractVendorFromProperty } from '@/lib/api/properties';

// Map RawComplaint (API) -> WorkOrder (UI)
function mapComplaintToWorkOrder(c: RawComplaint): WorkOrder {
  const complainantName = c.Complainant
    ? `${c.Complainant.first_name} ${c.Complainant.last_name}`
    : c.full_name || 'Unknown';
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
    : c.Property?.name || c.address || '-';
  const units =
    c.Complainant?.TenantInfo?.apartment_number || c.unit_number || '-';

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
    propertyId:
      (c as any).property_id ?? (c.property_id === null ? '' : c.property_id),
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

  // View work order detail state
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null,
  );
  const [viewOpen, setViewOpen] = useState(false);

  // Standalone estimates dialog state
  const [estimatesOpen, setEstimatesOpen] = useState(false);
  const [estimatesWorkOrder, setEstimatesWorkOrder] =
    useState<WorkOrder | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);

  // Standalone chat dialog state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWorkOrder, setChatWorkOrder] = useState<WorkOrder | null>(null);

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

  // Load estimates for a specific work order
  const loadEstimates = useCallback(
    async (workOrderId: string) => {
      if (!accessToken) return;
      setLoadingEstimates(true);
      try {
        const data = await fetchEstimatesByWorkOrder({
          token: accessToken,
          workOrderId,
        });
        setEstimates(data);
      } catch (e) {
        console.error('Failed to load estimates:', e);
      } finally {
        setLoadingEstimates(false);
      }
    },
    [accessToken],
  );

  const handleApproveEstimate = async (estimateId: string) => {
    if (!accessToken || !estimatesWorkOrder) return;
    try {
      await approveEstimate({ token: accessToken, id: estimateId });
      addToast({
        variant: 'success',
        title: 'Estimate Approved',
        description: 'The estimate has been approved.',
      });
      loadEstimates(String(estimatesWorkOrder.id));
      load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to approve estimate';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleRejectEstimate = async (estimateId: string) => {
    if (!accessToken || !estimatesWorkOrder) return;
    try {
      await rejectEstimate({ token: accessToken, id: estimateId });
      addToast({
        variant: 'success',
        title: 'Estimate Rejected',
        description: 'The estimate has been rejected.',
      });
      loadEstimates(String(estimatesWorkOrder.id));
      load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to reject estimate';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

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
          onView={(wo) => {
            setSelectedWorkOrder(wo);
            setViewOpen(true);
          }}
          onChat={(wo) => {
            setChatWorkOrder(wo);
            setChatOpen(true);
          }}
          onEstimates={(wo) => {
            setEstimatesWorkOrder(wo);
            setEstimatesOpen(true);
            loadEstimates(String(wo.id));
          }}
        />
      )}

      {/* Work Order Detail Dialog (details only) */}
      <PropertyOwnerWorkOrderDetail
        workOrder={selectedWorkOrder}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      {/* Standalone Estimates Dialog */}
      <CustomDialog
        open={estimatesOpen}
        onOpenChange={setEstimatesOpen}
        className='max-w-lg'
      >
        <CustomDialogHeader title='Estimates' />
        <CustomDialogBody>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-[#BDBDBE] text-sm'>
                {estimates.length} estimate(s)
              </span>
            </div>

            {loadingEstimates ? (
              <div className='text-center py-8 text-[#BDBDBE]'>
                Loading estimates...
              </div>
            ) : estimates.length === 0 ? (
              <div className='text-center py-8'>
                <FileText className='h-10 w-10 mx-auto mb-3 text-[#BDBDBE]/50' />
                <p className='text-[#BDBDBE]'>No estimates yet</p>
                <p className='text-[#BDBDBE] text-sm mt-1'>
                  Vendor will submit estimates for approval
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {estimates.map((estimate) => {
                  const amount =
                    typeof estimate.amount === 'string'
                      ? parseFloat(estimate.amount)
                      : estimate.amount;

                  return (
                    <div
                      key={estimate.id}
                      className='bg-[#FFFFFF08] rounded-lg p-4 space-y-3'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='text-white font-semibold text-lg'>
                          {formatCurrency(amount)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            estimate.status === 'approved'
                              ? 'bg-[#172C20] text-[#00CB5C]'
                              : estimate.status === 'rejected'
                                ? 'bg-[#2B1D1C] text-[#EF4444]'
                                : 'bg-[#271B16] text-[#F77F00]'
                          }`}
                        >
                          {estimate.status.charAt(0).toUpperCase() +
                            estimate.status.slice(1)}
                        </span>
                      </div>
                      <p className='text-[#BDBDBE] text-sm'>
                        {estimate.description}
                      </p>
                      <div className='flex items-center gap-4 text-xs text-[#BDBDBE]'>
                        <span className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {new Date(
                            estimate.created_at || estimate.createdAt || '',
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Approve/Reject buttons for pending estimates */}
                      {estimate.status === 'pending' && (
                        <div className='flex gap-2 pt-2'>
                          <Button
                            size='sm'
                            onClick={() => handleApproveEstimate(estimate.id)}
                            className='flex-1 bg-[#172C20] hover:bg-[#1e3a2a] text-[#00CB5C]'
                          >
                            <CheckCircle className='h-4 w-4 mr-1' />
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => handleRejectEstimate(estimate.id)}
                            className='flex-1 bg-[#2B1D1C] hover:bg-[#3a2625] text-[#EF4444]'
                          >
                            <XCircle className='h-4 w-4 mr-1' />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CustomDialogBody>
      </CustomDialog>

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
                currentUserId={(session as any)?.user?.id}
                currentUserName={
                  session?.user?.name ||
                  [session?.user?.firstName, session?.user?.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                  undefined
                }
                currentUserRole={
                  (session as any)?.user?.role || 'property_owner'
                }
              />
            ) : (
              <div className='text-center py-8 text-[#BDBDBE]'>
                Please sign in to use chat.
              </div>
            )}
          </div>
        </CustomDialogBody>
      </CustomDialog>
    </div>
  );
};

export default WorkOrdersPage;
