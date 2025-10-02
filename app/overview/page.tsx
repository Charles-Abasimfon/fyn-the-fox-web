'use client';
import React, { useEffect, useState, useCallback } from 'react';
import OverviewCard from '@/components/dashboard/OverviewCard';
import ComplaintsTable from '@/components/dashboard/ComplaintsTable';
import VendorsList from '@/components/dashboard/VendorsList';
import { useSession } from 'next-auth/react';
import { fetchComplaints, RawComplaint } from '@/lib/api/complaints';
import { fetchVendors, RawVendor } from '@/lib/api/vendors';
import {
  fetchDashboardStats,
  DashboardStatsResponse,
} from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/auth';

// Local interfaces mirroring the expected props of the imported components
interface Complaint {
  id: string;
  name: string;
  complaint: string;
  propertyAddress: string;
  units: string;
  assignedTo: string;
  assignedRole: string;
  scheduledDate: string;
  scheduledTime: string;
  status:
    | 'Assigned'
    | 'Completed'
    | 'Pending'
    | 'Scheduled'
    | 'In Progress'
    | 'Estimate needed'
    | 'Resident confirmation'
    | 'Pending vendors acceptance';
}

interface VendorListItem {
  id: number; // Keep numeric ID for VendorsList component; we'll map index
  name: string;
  service: string;
  status: 'Active' | 'In-active';
}

interface AssignVendorOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

const OverviewPage = () => {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [complaintsData, setComplaintsData] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [vendorsList, setVendorsList] = useState<VendorListItem[]>([]);
  const [assignVendors, setAssignVendors] = useState<AssignVendorOption[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);

  const mapComplaint = useCallback((c: RawComplaint): Complaint => {
    const complainantName = c.Complainant
      ? `${c.Complainant.first_name} ${c.Complainant.last_name}`
      : 'Unknown';
    const vendorName = c.Vendor
      ? `${c.Vendor.first_name} ${c.Vendor.last_name}`
      : '-';
    const vendorRole = c.Vendor?.VendorInfo?.type || '-';
    const address = c.Property?.Address;
    const propertyAddress = address
      ? [address.street, address.city].filter(Boolean).join(', ')
      : c.Property?.name || '-';
    const units = c.Complainant?.TenantInfo?.apartment_number || '-';

    // Interpret scheduling: use eta if present
    const dt = c.eta ? new Date(c.eta) : null;
    const scheduledDate = dt
      ? dt.toLocaleDateString(undefined, {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      : '-';
    const scheduledTime = dt
      ? dt.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

    // Map API status (lowercase) to UI statuses - keep capitalization rules
    const statusMap: Record<string, Complaint['status']> = {
      assigned: 'Assigned',
      completed: 'Completed',
      pending: 'Pending',
      scheduled: 'Scheduled',
      'in-progress': 'In Progress',
    };
    const uiStatus = statusMap[c.status.toLowerCase()] || 'Pending';

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
      status: uiStatus,
    };
  }, []);

  const loadComplaints = useCallback(async () => {
    if (!accessToken) return; // session not ready
    setComplaintsLoading(true);
    setComplaintsError(null);
    try {
      const resp = await fetchComplaints({
        token: accessToken,
        page: 1,
        limit: 10,
      });
      const mapped = resp.complaints.map(mapComplaint);
      setComplaintsData(mapped);
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to load complaints';
      setComplaintsError(msg);
    } finally {
      setComplaintsLoading(false);
    }
  }, [accessToken, mapComplaint]);

  const loadStats = useCallback(async () => {
    if (!accessToken) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const s = await fetchDashboardStats({ token: accessToken });
      setStats(s);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load stats';
      setStatsError(msg);
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken]);

  const mapVendor = useCallback(
    (v: RawVendor, index: number): VendorListItem => {
      const roleRaw = v.VendorInfo?.type || 'Service';
      const role = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);
      const status: VendorListItem['status'] =
        v.VendorInfo?.status === 'active' ? 'Active' : 'In-active';
      return {
        id: index + 1, 
        name: `${v.first_name} ${v.last_name}`.trim(),
        service: role,
        status,
      };
    },
    []
  );

  const mapAssignVendor = useCallback((v: RawVendor): AssignVendorOption => {
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
        limit: 10,
      });
      const list = resp.vendors.map(mapVendor);
      const assignOpts = resp.vendors.map(mapAssignVendor);
      setVendorsList(list);
      setAssignVendors(assignOpts);
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load vendors';
      setVendorsError(msg);
    } finally {
      setVendorsLoading(false);
    }
  }, [accessToken, mapVendor, mapAssignVendor]);

  useEffect(() => {
    loadComplaints();
    loadVendors();
    loadStats();
  }, [loadComplaints, loadVendors, loadStats]);

  const anyLoading = complaintsLoading || vendorsLoading;

  return (
    <div className='py-6 pt-8'>
      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
        {statsError && !statsLoading && (
          <div className='md:col-span-2 lg:col-span-4 bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-4 text-red-400 text-sm flex items-center justify-between'>
            <span>{statsError}</span>
            <button
              onClick={loadStats}
              className='px-3 py-1 rounded-md bg-[#F77F00] text-white text-xs font-medium hover:bg-[#f78f20]'
            >
              Retry
            </button>
          </div>
        )}
        <OverviewCard
          title='Total Complaints'
          count={stats?.total_complaints ?? 0}
          icon='/icons/complaint.svg'
          iconAlt='Total complaints icon'
          updatedTime={statsLoading ? 'Loading...' : 'Just now'}
          linkText='View all complaints'
          linkHref='/complaints'
        />
        <OverviewCard
          title='Open complaints'
          count={stats?.open_complaints ?? 0}
          icon='/icons/in-progress.svg'
          iconAlt='Open complaints icon'
          updatedTime={statsLoading ? 'Loading...' : 'Just now'}
          linkText='View open complaint'
          linkHref='/complaints/open'
        />
        <OverviewCard
          title='Resolved complaints'
          count={stats?.resolved_complaints ?? 0}
          icon='/icons/completed.svg'
          iconAlt='Resolved complaints icon'
          updatedTime={statsLoading ? 'Loading...' : 'Just now'}
          linkText='View resolved complaint'
          linkHref='/complaints/resolved'
        />
        <OverviewCard
          title='Assigned vendors'
          count={stats?.assigned_vendors ?? 0}
          icon='/icons/user-business.svg'
          iconAlt='Assigned vendors icon'
          updatedTime={statsLoading ? 'Loading...' : 'Just now'}
          linkText='View assigned vendors'
          linkHref='/vendors'
        />
      </div>

      {/* Main Content Area */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mt-12'>
        {/* Complaints Table - Takes 2/3 of the space on large screens */}
        <div className='lg:col-span-3'>
          {complaintsLoading && (
            <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm'>
              Loading complaints...
            </div>
          )}
          {complaintsError && !complaintsLoading && (
            <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4'>
              <div className='font-semibold'>Failed to load complaints</div>
              <div className='text-red-300'>{complaintsError}</div>
              <button
                onClick={loadComplaints}
                className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
              >
                Retry
              </button>
            </div>
          )}
          {!complaintsLoading && !complaintsError && (
            <ComplaintsTable
              complaints={complaintsData}
              vendors={assignVendors}
              onAssignVendor={({ complaint, vendor }) => {
                // Placeholder: integrate with assignment endpoint
                console.log(
                  'Assign vendor',
                  vendor.id,
                  'to complaint',
                  complaint.id
                );
              }}
            />
          )}
        </div>

        {/* Vendors List - Takes 1/3 of the space on large screens */}
        <div className='lg:col-span-1'>
          {vendorsLoading && (
            <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm'>
              Loading vendors...
            </div>
          )}
          {vendorsError && !vendorsLoading && (
            <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4'>
              <div className='font-semibold'>Failed to load vendors</div>
              <div className='text-red-300'>{vendorsError}</div>
              <button
                onClick={loadVendors}
                className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
              >
                Retry
              </button>
            </div>
          )}
          {!vendorsLoading && !vendorsError && (
            <VendorsList vendors={vendorsList} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
