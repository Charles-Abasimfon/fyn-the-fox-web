import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';
import { fetchWithAuth } from './http';

export interface EstimateLineItem {
  id: string;
  name: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
  type: string;
  created_at: string;
}

export interface Estimate {
  id: string;
  work_order_id: string;
  amount: string | number;
  currency?: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  attachment_url?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  /** @deprecated use created_at */
  createdAt?: string;
  /** @deprecated use updated_at */
  updatedAt?: string;
  EstimateItems?: EstimateLineItem[];
}

export interface EstimatePayload {
  amount: number;
  description: string;
  attachment?: File | null;
}

export interface EstimatesListResponse {
  estimates: Estimate[];
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

// Create a new estimate for a work order
export async function createEstimate({
  token,
  workOrderId,
  payload,
}: {
  token: string;
  workOrderId: string;
  payload: EstimatePayload;
}): Promise<Estimate> {
  const base = getBase();

  // If there's an attachment, use FormData
  let body: FormData | string;
  let headers: Record<string, string> = {};

  if (payload.attachment) {
    const formData = new FormData();
    formData.append('amount', String(payload.amount));
    formData.append('description', payload.description);
    formData.append('attachment', payload.attachment);
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      amount: payload.amount,
      description: payload.description,
    });
  }

  const res = await fetchWithAuth(
    `${base}/estimates/work-orders/${workOrderId}`,
    {
      method: 'POST',
      headers,
      body,
    },
    token,
  );

  let json: ApiBaseResponse<{ estimate: Estimate } | Estimate> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to create estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const created: Estimate | undefined = data?.estimate || data || (json as any);
  if (!created || !('id' in created))
    throw new ApiError('Malformed create estimate response');
  return created;
}

// Get all estimates
export async function fetchEstimates({
  token,
  page = 1,
  limit = 10,
}: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<EstimatesListResponse> {
  const base = getBase();
  const url = new URL(`${base}/estimates`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  const res = await fetchWithAuth(
    url.toString(),
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<EstimatesListResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch estimates (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data) throw new ApiError('Malformed estimates response');
  return json.data;
}

// Get estimates by work order ID
export async function fetchEstimatesByWorkOrder({
  token,
  workOrderId,
}: {
  token: string;
  workOrderId: string;
}): Promise<Estimate[]> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/work-orders/${workOrderId}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<{ estimates: Estimate[] } | Estimate[]> | null =
    null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      json?.message || `Failed to fetch work order estimates (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const raw = data?.estimates || data;
  return Array.isArray(raw) ? raw : [];
}

// Get estimate by ID
export async function fetchEstimateById({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Estimate> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}`,
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<{ estimate: Estimate } | Estimate> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const estimate: Estimate | undefined =
    data?.estimate || data || (json as any);
  if (!estimate || !('id' in estimate))
    throw new ApiError('Malformed estimate response');
  return estimate;
}

// Update an estimate
export async function updateEstimate({
  token,
  id,
  payload,
}: {
  token: string;
  id: string;
  payload: Partial<EstimatePayload>;
}): Promise<Estimate> {
  const base = getBase();

  let body: FormData | string;
  let headers: Record<string, string> = {};

  if (payload.attachment) {
    const formData = new FormData();
    if (payload.amount !== undefined)
      formData.append('amount', String(payload.amount));
    if (payload.description)
      formData.append('description', payload.description);
    formData.append('attachment', payload.attachment);
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      ...(payload.amount !== undefined && { amount: payload.amount }),
      ...(payload.description && { description: payload.description }),
    });
  }

  const res = await fetchWithAuth(
    `${base}/estimates/${id}`,
    {
      method: 'PUT',
      headers,
      body,
    },
    token,
  );

  let json: ApiBaseResponse<{ estimate: Estimate } | Estimate> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to update estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const updated: Estimate | undefined = data?.estimate || data || (json as any);
  if (!updated || !('id' in updated))
    throw new ApiError('Malformed update estimate response');
  return updated;
}

// Send estimate to user
export async function sendEstimate({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<void> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}/send`,
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
    const msg = json?.message || `Failed to send estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}

// Get estimate attachment
export async function getEstimateAttachment({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<string> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}/attachment`,
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
      json?.message || `Failed to get estimate attachment (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  return data?.url || data || '';
}

// Approve estimate
export async function approveEstimate({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Estimate> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}/approve`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<{ estimate: Estimate } | Estimate> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to approve estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const approved: Estimate | undefined =
    data?.estimate || data || (json as any);
  if (!approved || !('id' in approved))
    throw new ApiError('Malformed approve estimate response');
  return approved;
}

// Reject estimate
export async function rejectEstimate({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<Estimate> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}/reject`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' } },
    token,
  );

  let json: ApiBaseResponse<{ estimate: Estimate } | Estimate> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to reject estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const rejected: Estimate | undefined =
    data?.estimate || data || (json as any);
  if (!rejected || !('id' in rejected))
    throw new ApiError('Malformed reject estimate response');
  return rejected;
}

// Delete estimate
export async function deleteEstimate({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<void> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/estimates/${id}`,
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
    const msg = json?.message || `Failed to delete estimate (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}
