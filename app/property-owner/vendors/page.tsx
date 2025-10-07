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
import {
  fetchVendors,
  RawVendor,
  deleteVendor,
  addVendor,
  updateVendor,
} from '@/lib/api/vendors';
import { ApiError } from '@/lib/api/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

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
  const { addToast } = useToast();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleAdd = async (values: VendorFormValues) => {
    if (!accessToken) return;
    // Map form values to API payload
    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      password: values.password,
      phone_number: values.phone_number.trim(),
      type: values.type.trim().toLowerCase().replace(/\s+/g, '-'),
      service_area: values.service_area
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      preferred_contact_method: values.preferred_contact_method
        .trim()
        .toLowerCase(),
    };
    try {
      const created = await addVendor({ token: accessToken, payload });
      const row = mapVendorToRow(created);
      setVendors((list) => [row, ...list]);
      setAddOpen(false);
      addToast({
        variant: 'success',
        title: 'Vendor added',
        description: `${row.name} was created successfully`,
      });
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to add vendor';
      addToast({ variant: 'error', title: 'Add failed', description: msg });
    }
  };

  const handleEdit = async (values: VendorFormValues) => {
    if (!selected || !accessToken) return;
    const id = selected.id;
    // Build update payload conditionally (only include provided fields)
    const payload: any = {};
    if (values.first_name.trim()) payload.first_name = values.first_name.trim();
    if (values.last_name.trim()) payload.last_name = values.last_name.trim();
    if (values.email.trim()) payload.email = values.email.trim();
    if (values.phone_number.trim())
      payload.phone_number = values.phone_number.trim();
    if (values.type.trim())
      payload.type = values.type.trim().toLowerCase().replace(/\s+/g, '-');
    if (values.service_area.trim())
      payload.service_area = values.service_area
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (values.preferred_contact_method.trim())
      payload.preferred_contact_method = values.preferred_contact_method
        .trim()
        .toLowerCase();

    // Optimistic UI update
    const newName = `${values.first_name} ${values.last_name}`.trim();
    const t = values.type.trim();
    const formattedDesignation = t
      ? t.charAt(0).toUpperCase() + t.slice(1)
      : '';
    const prev = vendors;
    setVendors((list) =>
      list.map((v) =>
        v.id === id
          ? {
              ...v,
              name: newName || v.name,
              email: values.email.trim() || v.email,
              designation: formattedDesignation || v.designation,
            }
          : v
      )
    );
    try {
      const updated = await updateVendor({
        token: accessToken,
        id: String(id),
        payload,
      });
      if (updated) {
        // Map returned vendor (source of truth)
        const row = mapVendorToRow(updated);
        setVendors((list) => list.map((v) => (v.id === id ? row : v)));
      }
      setEditOpen(false);
      setViewOpen(false);
      addToast({
        variant: 'success',
        title: 'Vendor updated',
        description: 'Changes have been saved.',
      });
    } catch (e: any) {
      // revert on error
      setVendors(prev);
      const msg = e instanceof ApiError ? e.message : 'Failed to update vendor';
      addToast({ variant: 'error', title: 'Update failed', description: msg });
    }
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
            setDeleteTarget(v);
            setDeleteError(null);
            setDeleteOpen(true);
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
          setDeleteTarget(v);
          setDeleteError(null);
          setViewOpen(false);
          setDeleteOpen(true);
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

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!deleting) setDeleteOpen(o);
        }}
      >
        <AlertDialogContent className='bg-[#141414] border-[#434343] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription className='text-[#BDBDBE]'>
              {deleteTarget ? (
                <>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold text-white'>
                    {deleteTarget.name}
                  </span>
                  ? This action cannot be undone.
                </>
              ) : (
                'Are you sure you want to delete this vendor?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className='text-sm text-red-400 bg-[#2B1D1C] border border-[#5e2c2a] px-3 py-2 rounded-md'>
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className='cursor-pointer text-black'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700 cursor-pointer'
              onClick={async () => {
                if (!deleteTarget || !accessToken) return;
                setDeleting(true);
                setDeleteError(null);
                // Optimistic update pattern
                const id = deleteTarget.id;
                const prev = vendors;
                setVendors((list) => list.filter((v) => v.id !== id));
                try {
                  await deleteVendor({ token: accessToken, id: String(id) });
                  setDeleteOpen(false);
                  setDeleteTarget(null);
                  addToast({
                    variant: 'success',
                    title: 'Vendor deleted',
                    description: 'The vendor was deleted successfully.',
                  });
                } catch (e: any) {
                  // revert on failure
                  setVendors(prev);
                  const msg =
                    e instanceof ApiError
                      ? e.message
                      : 'Failed to delete vendor';
                  setDeleteError(msg);
                  addToast({
                    variant: 'error',
                    title: 'Delete failed',
                    description: msg,
                  });
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorsPage;
