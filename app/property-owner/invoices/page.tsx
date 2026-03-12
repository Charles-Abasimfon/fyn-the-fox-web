'use client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { InvoiceItem } from '@/components/dashboard/InvoicesTable';
import ViewInvoice from '@/components/dashboard/ViewInvoice';
import {
  fetchInvoices,
  Invoice,
  approveInvoice,
  rejectInvoice,
  getInvoiceAttachment,
  createInvoice,
  InvoiceItemPayload,
  InvoiceItemType,
} from '@/lib/api/invoices';
import { fetchComplaints, RawComplaint } from '@/lib/api/complaints';
import { ApiError } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  CustomDialog,
  CustomDialogHeader,
  CustomDialogBody,
} from '@/components/ui/custom-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

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

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'paid';

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-[#2A2A2A] text-[#BDBDBE] border-[#2A2A2A]';
    case 'pending':
      return 'bg-[#271B16] text-[#F77F00] border-[#271B16]';
    case 'approved':
      return 'bg-[#172C20] text-[#00CB5C] border-[#172C20]';
    case 'rejected':
      return 'bg-[#2B1D1C] text-[#EF4444] border-[#2B1D1C]';
    case 'paid':
      return 'bg-[#1C2A3B] text-[#3B82F6] border-[#1C2A3B]';
    default:
      return 'bg-gray-900 text-gray-200 border-gray-800';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function PropertyOwnerInvoicesPage() {
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add Invoice state
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [workOrders, setWorkOrders] = useState<RawComplaint[]>([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemPayload[]>([
    { name: '', description: '', quantity: 1, unit_price: 0, type: 'service' },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load work orders for the dropdown
  const loadWorkOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const resp = await fetchComplaints({
        token: accessToken,
        page: 1,
        limit: 100,
      });
      setWorkOrders(resp.complaints);
    } catch (e: any) {
      console.error('Failed to load work orders:', e);
    }
  }, [accessToken]);

  useEffect(() => {
    if (addInvoiceOpen) {
      loadWorkOrders();
    }
  }, [addInvoiceOpen, loadWorkOrders]);

  const resetInvoiceForm = () => {
    setSelectedWorkOrderId('');
    setInvoiceDescription('');
    setInvoiceItems([
      {
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        type: 'service',
      },
    ]);
    setInvoiceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setInvoiceFile(selectedFile);
    }
  };

  const removeFile = () => {
    setInvoiceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateInvoice = async () => {
    if (!accessToken || !selectedWorkOrderId) return;

    const validItems = invoiceItems.filter(
      (item) => item.name.trim() && item.quantity > 0 && item.unit_price > 0,
    );
    if (validItems.length === 0) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: 'Please add at least one valid line item.',
      });
      return;
    }

    setIsCreating(true);
    try {
      await createInvoice({
        token: accessToken,
        workOrderId: selectedWorkOrderId,
        payload: {
          description: invoiceDescription,
          items: validItems,
          file: invoiceFile,
        },
      });
      addToast({
        variant: 'success',
        title: 'Invoice Created',
        description: 'Invoice has been created successfully.',
      });
      setAddInvoiceOpen(false);
      resetInvoiceForm();
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to create invoice';
      addToast({ variant: 'error', title: 'Error', description: msg });
    } finally {
      setIsCreating(false);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        type: 'service',
      },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItemPayload,
    value: any,
  ) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  };

  const handleApprove = async (item: InvoiceItem) => {
    if (!accessToken) return;
    try {
      await approveInvoice({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Invoice Approved',
        description: 'The invoice has been approved.',
      });
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to approve invoice';
      addToast({ variant: 'error', title: 'Error', description: msg });
    }
  };

  const handleReject = async (item: InvoiceItem) => {
    if (!accessToken) return;
    try {
      await rejectInvoice({ token: accessToken, id: item.id });
      addToast({
        variant: 'success',
        title: 'Invoice Rejected',
        description: 'The invoice has been rejected.',
      });
      await load();
    } catch (e: any) {
      const msg =
        e instanceof ApiError ? e.message : 'Failed to reject invoice';
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

  // Filter items by status
  const filteredItems =
    statusFilter === 'all'
      ? items
      : items.filter((item) => item.status === statusFilter);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Stats
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className='py-6 pt-8'>
      {/* Header with Add Invoice Button */}
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-white text-2xl font-bold'>Invoices</h1>
        <Button
          onClick={() => setAddInvoiceOpen(true)}
          className='bg-[#F77F00] hover:bg-[#f78f20]'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-[#FFFFFF0D] border border-white/10 rounded-lg p-4'>
          <div className='text-[#BDBDBE] text-sm'>Pending Approval</div>
          <div className='text-white text-2xl font-bold'>{pendingCount}</div>
        </div>
        <div className='bg-[#FFFFFF0D] border border-white/10 rounded-lg p-4'>
          <div className='text-[#BDBDBE] text-sm'>Approved</div>
          <div className='text-[#00CB5C] text-2xl font-bold'>
            {approvedCount}
          </div>
        </div>
        <div className='bg-[#FFFFFF0D] border border-white/10 rounded-lg p-4'>
          <div className='text-[#BDBDBE] text-sm'>Total Amount</div>
          <div className='text-white text-2xl font-bold'>
            {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='flex items-center gap-2 mb-4'>
        {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map(
          (filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-[#F77F00] text-white'
                  : 'bg-[#FFFFFF0D] text-white/70 hover:bg-[#FFFFFF1A]'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter === 'pending' && pendingCount > 0 && (
                <span className='ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs'>
                  {pendingCount}
                </span>
              )}
            </button>
          ),
        )}
      </div>

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
          {/* Table */}
          <div className='bg-[#FFFFFF0D] border border-white/10 rounded-lg overflow-hidden'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-white/10'>
                  <th className='text-left px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Work Order
                  </th>
                  <th className='text-left px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Property
                  </th>
                  <th className='text-left px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Amount
                  </th>
                  <th className='text-left px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Status
                  </th>
                  <th className='text-left px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Date
                  </th>
                  <th className='text-right px-4 py-3 text-[#BDBDBE] text-sm font-medium'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-4 py-8 text-center text-[#BDBDBE]'
                    >
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className='border-b border-white/5 hover:bg-[#FFFFFF08]'
                    >
                      <td className='px-4 py-3'>
                        <div className='text-white text-sm font-medium'>
                          {item.workOrderDescription}
                        </div>
                        <div className='text-[#BDBDBE] text-xs'>
                          {item.tenantName}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-white text-sm'>
                        {item.propertyAddress}
                      </td>
                      <td className='px-4 py-3 text-white text-sm font-medium'>
                        {formatCurrency(item.amount)}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusStyles(
                            item.status,
                          )}`}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-[#BDBDBE] text-sm'>
                        {item.createdAt}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-8 w-8 p-0'
                            >
                              <MoreVertical className='h-4 w-4 text-white' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='bg-[#1c1c1c] border-white/10'
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInvoice(item);
                                setViewOpen(true);
                              }}
                              className='text-white hover:bg-white/10'
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewAttachment(item)}
                              className='text-white hover:bg-white/10'
                            >
                              <FileText className='mr-2 h-4 w-4' />
                              View Attachment
                            </DropdownMenuItem>
                            {item.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator className='bg-white/10' />
                                <DropdownMenuItem
                                  onClick={() => handleApprove(item)}
                                  className='text-[#00CB5C] hover:bg-white/10'
                                >
                                  <CheckCircle className='mr-2 h-4 w-4' />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(item)}
                                  className='text-[#EF4444] hover:bg-white/10'
                                >
                                  <XCircle className='mr-2 h-4 w-4' />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-[#BDBDBE] text-sm'>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{' '}
                {filteredItems.length} invoices
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className='border-white/20'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <span className='text-white text-sm'>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className='border-white/20'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}

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

      {/* Add Invoice Dialog */}
      <CustomDialog
        open={addInvoiceOpen}
        onOpenChange={(open) => {
          setAddInvoiceOpen(open);
          if (!open) resetInvoiceForm();
        }}
        className='max-w-2xl'
      >
        <CustomDialogHeader title='Create Invoice' />
        <CustomDialogBody>
          <div className='space-y-6'>
            {/* Work Order Selection */}
            <div className='space-y-2'>
              <Label className='text-[#BDBDBE]'>Work Order *</Label>
              <Select
                value={selectedWorkOrderId}
                onValueChange={setSelectedWorkOrderId}
              >
                <SelectTrigger className='w-full h-10 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white'>
                  <SelectValue placeholder='Select a work order' />
                </SelectTrigger>
                <SelectContent className='bg-[#1c1c1c] border-[#434343] max-w-[400px]'>
                  {workOrders.map((wo) => (
                    <SelectItem
                      key={wo.id}
                      value={wo.id}
                      className='text-white focus:bg-[#F77F00] focus:text-white'
                    >
                      <span className='truncate'>
                        {wo.complain} -{' '}
                        {wo.Property?.name ||
                          wo.Property?.Address?.street ||
                          'Unknown Property'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label className='text-[#BDBDBE]'>Description</Label>
              <textarea
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                placeholder='Invoice description...'
                rows={3}
                className='w-full px-3 py-2 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#F77F00]'
              />
            </div>

            {/* Line Items */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-[#BDBDBE]'>Line Items *</Label>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={addInvoiceItem}
                  className='border-white/20'
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Add Item
                </Button>
              </div>

              {invoiceItems.map((item, index) => (
                <div
                  key={index}
                  className='bg-[#FFFFFF08] rounded-lg p-4 space-y-3'
                >
                  <div className='flex items-start justify-between'>
                    <span className='text-white/60 text-sm'>
                      Item {index + 1}
                    </span>
                    {invoiceItems.length > 1 && (
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        onClick={() => removeInvoiceItem(index)}
                        className='text-red-400 hover:text-red-300 h-6 w-6 p-0'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div className='col-span-2'>
                      <input
                        type='text'
                        value={item.name}
                        onChange={(e) =>
                          updateInvoiceItem(index, 'name', e.target.value)
                        }
                        placeholder='Item name'
                        className='w-full h-10 px-3 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#F77F00]'
                      />
                    </div>
                    <div>
                      <Select
                        value={item.type}
                        onValueChange={(value) =>
                          updateInvoiceItem(
                            index,
                            'type',
                            value as InvoiceItemType,
                          )
                        }
                      >
                        <SelectTrigger className='w-full h-10 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                        <SelectContent className='bg-[#1c1c1c] border-[#434343]'>
                          <SelectItem
                            value='service'
                            className='text-white focus:bg-[#F77F00] focus:text-white'
                          >
                            Service
                          </SelectItem>
                          <SelectItem
                            value='material'
                            className='text-white focus:bg-[#F77F00] focus:text-white'
                          >
                            Material
                          </SelectItem>
                          <SelectItem
                            value='labor'
                            className='text-white focus:bg-[#F77F00] focus:text-white'
                          >
                            Labor
                          </SelectItem>
                          <SelectItem
                            value='other'
                            className='text-white focus:bg-[#F77F00] focus:text-white'
                          >
                            Other
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex gap-2'>
                      <input
                        type='number'
                        value={item.quantity}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            'quantity',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder='Qty'
                        min='1'
                        className='w-20 h-10 px-3 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#F77F00]'
                      />
                      <input
                        type='number'
                        value={item.unit_price}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            'unit_price',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder='Unit Price'
                        min='0'
                        step='0.01'
                        className='flex-1 h-10 px-3 bg-[#FFFFFF0D] border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#F77F00]'
                      />
                    </div>
                  </div>

                  <div className='text-right text-[#BDBDBE] text-sm'>
                    Subtotal: {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className='flex items-center justify-between pt-3 border-t border-white/10'>
                <span className='text-white font-medium'>Total</span>
                <span className='text-white text-xl font-bold'>
                  {formatCurrency(calculateInvoiceTotal())}
                </span>
              </div>
            </div>

            {/* File Attachment */}
            <div className='space-y-2'>
              <Label className='text-[#BDBDBE]'>Attachment (Optional)</Label>
              <div className='space-y-2'>
                {!invoiceFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='border-2 border-dashed border-[#434343] rounded-lg p-6 text-center cursor-pointer hover:border-[#F77F00] hover:bg-[#FFFFFF08] transition-colors'
                  >
                    <Upload className='h-8 w-8 mx-auto mb-2 text-[#BDBDBE]' />
                    <p className='text-white text-sm font-medium'>
                      Click to upload file
                    </p>
                    <p className='text-[#BDBDBE] text-xs mt-1'>
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className='bg-[#FFFFFF08] rounded-lg p-3 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-[#F77F00]/20 p-2 rounded-lg'>
                        <FileText className='h-5 w-5 text-[#F77F00]' />
                      </div>
                      <div>
                        <p className='text-white text-sm font-medium truncate max-w-[200px]'>
                          {invoiceFile.name}
                        </p>
                        <p className='text-[#BDBDBE] text-xs'>
                          {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={removeFile}
                      className='p-1 hover:bg-red-500/20 rounded text-red-400'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.pdf,.png,.jpg,.jpeg'
                  onChange={handleFileChange}
                  className='hidden'
                />
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={() => {
                  setAddInvoiceOpen(false);
                  resetInvoiceForm();
                }}
                className='border-white/20'
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isCreating || !selectedWorkOrderId}
                className='bg-[#F77F00] hover:bg-[#f78f20]'
              >
                {isCreating ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </CustomDialogBody>
      </CustomDialog>
    </div>
  );
}
