import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';
import { fetchWithAuth } from './http';

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid';
export type InvoiceItemType = 'service' | 'material' | 'labor' | 'other';

export interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  type: InvoiceItemType;
  created_at: string;
}

export interface Invoice {
  id: string;
  work_order_id: string;
  amount: number | string;
  currency: string;
  description: string;
  status: InvoiceStatus;
  created_at: string;
  due_date?: string;
  items?: InvoiceItem[];
  InvoiceItems?: InvoiceItem[];
  // Related data that may be included
  WorkOrder?: {
    id: string;
    complain: string;
    status: string;
    Property?: {
      id: string;
      name: string;
      Address?: {
        street: string;
        city: string;
        state: string;
      };
    };
    Complainant?: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface InvoiceItemPayload {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  type: InvoiceItemType;
}

export interface InvoicePayload {
  description: string;
  currency?: string;
  due_date?: string;
  items: InvoiceItemPayload[];
  file?: File | null;
}

export interface InvoicesListResponse {
  invoices: Invoice[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

function getBase(): string {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
}

// Helper to normalize invoice (handle items from different response formats)
function normalizeInvoice(invoice: Invoice): Invoice {
  const items = invoice.items || invoice.InvoiceItems || [];
  return {
    ...invoice,
    items,
    amount:
      typeof invoice.amount === 'string'
        ? parseFloat(invoice.amount)
        : invoice.amount,
  };
}

// Create a new invoice for a work order
export async function createInvoice({
  token,
  workOrderId,
  payload,
}: {
  token: string;
  workOrderId: string;
  payload: InvoicePayload;
}): Promise<Invoice> {
  const base = getBase();

  // Build the data object as JSON string
  const dataPayload = {
    description: payload.description,
    currency: payload.currency || 'USD',
    items: payload.items,
    ...(payload.due_date && { due_date: payload.due_date }),
  };

  // Use FormData for multipart/form-data
  const formData = new FormData();
  formData.append('data', JSON.stringify(dataPayload));

  if (payload.file) {
    formData.append('file', payload.file);
  }

  const res = await fetchWithAuth(
    `${base}/invoices/work-orders/${workOrderId}`,
    {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    },
    token,
  );

  let json: ApiBaseResponse<{ invoice: Invoice } | Invoice> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to create invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const created: Invoice | undefined = data?.invoice || data || (json as any);
  if (!created || !('id' in created))
    throw new ApiError('Malformed create invoice response');
  return normalizeInvoice(created);
}

// Get all invoices
export async function fetchInvoices({
  token,
  page = 1,
  limit = 10,
}: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<InvoicesListResponse> {
  const base = getBase();
  const url = new URL(`${base}/invoices`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetchWithAuth(
    url.toString(),
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<InvoicesListResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch invoices (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data) throw new ApiError('Malformed invoices response');

  // Normalize all invoices
  return {
    ...json.data,
    invoices: json.data.invoices.map(normalizeInvoice),
  };
}

// Get invoices by work order ID
export async function fetchInvoicesByWorkOrder({
  token,
  workOrderId,
}: {
  token: string;
  workOrderId: string;
}): Promise<Invoice[]> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/work-orders/${workOrderId}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<{ invoices: Invoice[] } | Invoice[]> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      json?.message || `Failed to fetch work order invoices (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const raw = data?.invoices || data;
  const invoices = Array.isArray(raw) ? raw : [];
  return invoices.map(normalizeInvoice);
}

// Get invoice by ID
export async function fetchInvoiceById({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Invoice> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<{ invoice: Invoice } | Invoice> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const invoice: Invoice | undefined = data?.invoice || data || (json as any);
  if (!invoice || !('id' in invoice))
    throw new ApiError('Malformed invoice response');
  return invoice;
}

// Update an invoice
export async function updateInvoice({
  token,
  id,
  payload,
}: {
  token: string;
  id: string;
  payload: Partial<InvoicePayload>;
}): Promise<Invoice> {
  const base = getBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    ...(payload.description && { description: payload.description }),
    ...(payload.due_date && { due_date: payload.due_date }),
    ...(payload.currency && { currency: payload.currency }),
    ...(payload.items && { items: payload.items }),
  });

  const res = await fetchWithAuth(
    `${base}/invoices/${id}`,
    {
      method: 'PUT',
      headers,
      body,
    },
    token,
  );

  let json: ApiBaseResponse<{ invoice: Invoice } | Invoice> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to update invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const updated: Invoice | undefined = data?.invoice || data || (json as any);
  if (!updated || !('id' in updated))
    throw new ApiError('Malformed update invoice response');
  return updated;
}

// Send invoice to user
export async function sendInvoice({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<void> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}/send`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<any> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to send invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}

// Get invoice attachment
export async function getInvoiceAttachment({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<string> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}/attachment`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<{ url: string } | string> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      json?.message || `Failed to get invoice attachment (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  return data?.url || data || '';
}

// Approve invoice
export async function approveInvoice({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Invoice> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}/approve`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<{ invoice: Invoice } | Invoice> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to approve invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const approved: Invoice | undefined = data?.invoice || data || (json as any);
  if (!approved || !('id' in approved))
    throw new ApiError('Malformed approve invoice response');
  return approved;
}

// Reject invoice
export async function rejectInvoice({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Invoice> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}/reject`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<{ invoice: Invoice } | Invoice> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to reject invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const rejected: Invoice | undefined = data?.invoice || data || (json as any);
  if (!rejected || !('id' in rejected))
    throw new ApiError('Malformed reject invoice response');
  return rejected;
}

// Delete invoice
export async function deleteInvoice({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<void> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/invoices/${id}`,
    { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<any> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to delete invoice (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}
