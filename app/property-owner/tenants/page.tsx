'use client';
import React, { useCallback, useEffect, useState } from 'react';
import TenantsTable, { TenantRow } from '@/components/dashboard/TenantsTable';
import TenantFormDialog, {
  TenantFormValues,
} from '@/components/dashboard/TenantForm';
import { useSession } from 'next-auth/react';
import {
  addTenant,
  fetchTenants,
  fetchTenantById,
  deleteTenant,
  RawTenant,
} from '@/lib/api/tenants';
import { ApiError } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';
import ViewTenant, { TenantDetail } from '@/components/dashboard/ViewTenant';
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

function mapTenant(t: RawTenant): TenantRow {
  return {
    id: t.id,
    name: `${t.first_name} ${t.last_name}`.trim(),
    email: t.email,
    phone: t.phone_number || '-',
    unit: t.TenantInfo?.apartment_number || '-',
    registeredOn: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '-',
  };
}

export default function TenantsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const { addToast } = useToast();

  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<TenantDetail | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchTenants({
        token: accessToken,
        page: 1,
        limit: 50,
      });
      setRows(resp.tenants.map(mapTenant));
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load tenants';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (values: TenantFormValues) => {
    if (!accessToken) return;
    try {
      await addTenant({
        token: accessToken,
        payload: {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim(),
          password: values.password,
          phone_number: values.phone_number?.trim() || undefined,
          property_id: values.property_id.trim(),
          floor_number: values.floor_number?.trim() || undefined,
          apartment_number: values.apartment_number?.trim() || undefined,
        },
      });
      addToast({
        variant: 'success',
        title: 'Tenant added',
        description: 'New tenant has been created',
      });
      setOpenAdd(false);
      load();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to add tenant';
      addToast({
        variant: 'error',
        title: 'Add tenant failed',
        description: msg,
      });
    }
  };

  return (
    <div className='py-6 pt-8'>
      {loading && (
        <div className='bg-[#FFFFFF0D] rounded-lg p-8 text-center text-white/70 text-sm mb-6'>
          Loading tenants...
        </div>
      )}
      {error && !loading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load tenants</div>
          <div className='text-red-300'>{error}</div>
          <button
            onClick={load}
            className='px-4 py-2 rounded-md bg-[#F77F00] text-white text-sm font-medium hover:bg-[#f78f20]'
          >
            Retry
          </button>
        </div>
      )}
      {!loading && (
        <TenantsTable
          tenants={rows}
          onAddTenant={() => setOpenAdd(true)}
          onView={async (t) => {
            if (!accessToken) return;
            try {
              const detail = await fetchTenantById({
                token: accessToken,
                id: String(t.id),
              });
              setSelected({
                id: detail.id,
                first_name: detail.first_name,
                last_name: detail.last_name,
                email: detail.email,
                phone_number: detail.phone_number,
                TenantInfo: detail.TenantInfo as any,
              });
              setOpenView(true);
            } catch (e: any) {
              const msg =
                e instanceof ApiError ? e.message : 'Failed to fetch tenant';
              addToast({
                variant: 'error',
                title: 'View failed',
                description: msg,
              });
            }
          }}
          onDelete={async (t) => {
            setDeleteTargetId(String(t.id));
            setDeleteTargetName(t.name);
            setDeleteError(null);
            setConfirmOpen(true);
          }}
        />
      )}

      <TenantFormDialog
        title='Add Tenant'
        ctaLabel='Add Tenant'
        open={openAdd}
        onOpenChange={setOpenAdd}
        onSubmit={handleAdd}
      />

      <ViewTenant
        tenant={selected}
        open={openView}
        onOpenChange={setOpenView}
        onDelete={async (id) => {
          setDeleteTargetId(String(id));
          setDeleteError(null);
          // Prefer selected dialog details for name; fallback to rows lookup
          const nameFromSelected = selected
            ? `${selected.first_name} ${selected.last_name}`.trim()
            : null;
          const nameFromRows =
            rows.find((r) => String(r.id) === String(id))?.name || null;
          setDeleteTargetName(nameFromSelected || nameFromRows);
          setConfirmOpen(true);
        }}
      />

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!deleting) setConfirmOpen(o);
        }}
      >
        <AlertDialogContent className='bg-[#141414] border-[#434343] text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription className='text-[#BDBDBE]'>
              {deleteTargetName ? (
                <>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold text-white'>
                    {deleteTargetName}
                  </span>
                  ? This action cannot be undone.
                </>
              ) : (
                'Are you sure you want to delete this tenant? This action cannot be undone.'
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
              className='bg-red-600 hover:bg-red-700 cursor-pointer'
              disabled={deleting}
              onClick={async () => {
                if (!accessToken || !deleteTargetId) return;
                setDeleting(true);
                try {
                  await deleteTenant({
                    token: accessToken,
                    id: deleteTargetId,
                  });
                  addToast({
                    variant: 'success',
                    title: 'Tenant deleted',
                    description: 'The tenant has been removed',
                  });
                  setConfirmOpen(false);
                  setSelected(null);
                  setOpenView(false);
                  setDeleteTargetId(null);
                  setDeleteTargetName(null);
                  setDeleteError(null);
                  load();
                } catch (e: any) {
                  const msg =
                    e instanceof ApiError
                      ? e.message
                      : 'Failed to delete tenant';
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
}
