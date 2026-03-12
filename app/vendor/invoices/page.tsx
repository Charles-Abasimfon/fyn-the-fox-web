'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import InvoicesTable, {
  InvoiceItem,
} from '@/components/dashboard/InvoicesTable';
import ViewInvoice from '@/components/dashboard/ViewInvoice';
import {
  fetchInvoices,
  Invoice,
  sendInvoice,
  deleteInvoice,
  getInvoiceAttachment,
} from '@/lib/api/invoices';
import { ApiError } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';

function mapInvoiceToItem(invoice: Invoice): InvoiceItem {
  const workOrder = invoice.WorkOrder;
  const complainant = workOrder?.Complainant;
  const property = workOrder?.Property;
  const address = property?.Address;

  const tenantName = complainant
    ? `${complainant.first_name} ${complainant.last_name}`
    : 'Unknown';

  let propertyAddress = '-';
  if (address) {
    propertyAddress = [address.street, address.city].filter(Boolean).join(', ');
  } else if (property?.name) {
    propertyAddress = property.name;
  }

  const createdDate = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '-';

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '-';

  // Calculate amount from items if available
  const invoiceItems = invoice.items || invoice.InvoiceItems || [];
  const calculatedAmount =
    invoiceItems.length > 0
      ? invoiceItems.reduce((sum, item) => {
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
      : typeof invoice.amount === 'string'
        ? parseFloat(invoice.amount)
        : invoice.amount;

  return {
    id: invoice.id,
    workOrderId: invoice.work_order_id,
    workOrderDescription: workOrder?.complain || 'Work Order',
    propertyAddress,
    tenantName,
    amount: calculatedAmount,
    description: invoice.description,
    status: invoice.status,
    dueDate,
    createdAt: createdDate,
  };
}

export default function VendorInvoicesPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchInvoices({
        token: accessToken,
        page: 1,
        limit: 100,
      });
      setItems(resp.invoices.map(mapInvoiceToItem));
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load invoices';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async (item: InvoiceItem) => {
    if (!accessToken) return;
    try {
      await sendInvoice({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Invoice Sent',
        description: 'Invoice has been sent to the property manager.',
      });
      await load();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Failed to send invoice';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleDelete = async (item: InvoiceItem) => {
    if (!accessToken) return;
    try {
      await deleteInvoice({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Invoice Deleted',
        description: 'Invoice has been deleted.',
      });
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to delete invoice';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleViewAttachment = async (item: InvoiceItem) => {
    if (!accessToken) return;
    try {
      const url = await getInvoiceAttachment({
        token: accessToken,
        id: item.id,
      });
      if (url) {
        window.open(url, '_blank');
      } else {
        addToast({
          variant: 'error',
          title: 'No Attachment',
          description: 'No attachment found for this invoice.',
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
          Loading invoices...
        </div>
      )}
      {error && !loading && (
        <div className='bg-[#2B1D1C] border border-[#5e2c2a] rounded-lg p-6 text-red-400 text-sm space-y-4 mb-6'>
          <div className='font-semibold'>Failed to load invoices</div>
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
          <InvoicesTable
            items={items}
            onView={(item) => {
              setSelectedInvoice(item);
              setViewOpen(true);
            }}
            onSend={handleSend}
            onDelete={handleDelete}
            onViewAttachment={handleViewAttachment}
          />
          <ViewInvoice
            invoice={selectedInvoice}
            open={viewOpen}
            onOpenChange={setViewOpen}
            onDownloadAttachment={() => {
              if (selectedInvoice) {
                handleViewAttachment(selectedInvoice);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
