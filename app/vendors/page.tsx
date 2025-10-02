'use client';

import React, { useCallback, useEffect, useState } from 'react';
import VendorsTable, { VendorRow } from '@/components/dashboard/VendorsTable';
import ViewVendor from '@/components/dashboard/ViewVendor';
import {
  AddVendorDialog,
  EditVendorDialog,
  VendorFormValues,
} from '@/components/dashboard/VendorForm';
import { useSession } from 'next-auth/react';
import { fetchVendors, RawVendor } from '@/lib/api/vendors';
import { ApiError } from '@/lib/api/auth';

function mapVendorToRow(v: RawVendor): VendorRow {
  const roleRaw = v.VendorInfo?.type || 'Service';
  const designation = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);
  const dt = v.registered_on ? new Date(v.registered_on) : null;
  const registeredOn = dt
    ? `${dt.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })} - ${dt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '-';
  let status: VendorRow['status'];
  const rawStatus = (v.VendorInfo?.status || v.status || '').toLowerCase();
  if (rawStatus === 'active') status = 'Active';
  else status = 'In-active';

  return {
    id: v.id,
    name: `${v.first_name} ${v.last_name}`.trim(),
    email: (v as any).email || 'unknown@example.com',
    designation,
    registeredOn,
    status,
  };
}

const VendorsPage = () => {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<VendorRow | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchVendors({
        token: accessToken,
        page: 1,
        limit: 50,
      });
      setVendors(resp.vendors.map(mapVendorToRow));
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load vendors';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (values: VendorFormValues) => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })} - ${now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const row: VendorRow = {
      id: Math.random().toString(36).slice(2, 9),
      name: values.name.trim(),
      email: values.email.trim(),
      designation: values.designation.trim(),
      registeredOn: formatted,
      status: 'Active',
    };
    setVendors((list) => [row, ...list]);
    setAddOpen(false);
  };

  const handleEdit = (values: VendorFormValues) => {
    if (!selected) return;
    setVendors((list) =>
      list.map((v) =>
        v.id === selected.id
          ? {
              ...v,
              name: values.name.trim(),
              email: values.email.trim(),
              designation: values.designation.trim(),
            }
          : v
      )
    );
    setEditOpen(false);
    setViewOpen(false);
  };

  return (
    <div className='py-6 pt-8'>
      {loading && (
        <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm mb-6'>
          Loading vendors...
        </div>
      )}
      {error && !loading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load vendors</div>
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
        <VendorsTable
          vendors={vendors}
          onAddVendor={() => setAddOpen(true)}
          onViewVendor={(v) => {
            setSelected(v);
            setViewOpen(true);
          }}
          onEditVendor={(v) => {
            setSelected(v);
            setEditOpen(true);
          }}
          onDeleteVendor={(v) => {
            // Placeholder: integrate delete endpoint
            console.log('Delete vendor', v.id);
            setVendors((list) => list.filter((x) => x.id !== v.id));
          }}
        />
      )}

      <ViewVendor
        vendor={selected}
        open={viewOpen}
        onOpenChange={(o) => setViewOpen(o)}
        onEdit={(v) => {
          setSelected(v);
          setEditOpen(true);
        }}
        onDelete={(v) => {
          console.log('Delete vendor', v.id);
          setViewOpen(false);
        }}
      />

      <AddVendorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      <EditVendorDialog
        vendor={selected}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
    </div>
  );
};

export default VendorsPage;
