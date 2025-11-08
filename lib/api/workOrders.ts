import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';
import { fetchWithAuth } from './http';

export interface WorkOrderPayload {
  complain: string; // complaint description
  category?: string;
  urgency?: string; // low | medium | high
  property_id?: string; // optional until we wire property selector
  user_id?: string; // tenant/complainant id
  eta?: string | null; // ISO datetime
}

export interface WorkOrderUpdatePayload {
  complain?: string;
  scheduled_date?: string | null; // ISO datetime or null
  category?: string;
  urgency?: string;
  eta?: string | null; // ISO datetime or null
  status?: string;
}

export interface WorkOrderDetails {
  id: string;
  complain: string;
  category?: string;
  urgency?: string;
  status?: string;
  eta?: string | null;
  scheduled_date?: string | null;
  property_id?: string;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

function getBase(): string {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
}

export async function createWorkOrder({
  token,
  payload,
}: {
  token: string;
  payload: WorkOrderPayload;
}): Promise<WorkOrderDetails> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/complaints/create`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send only server-expected fields
      body: JSON.stringify({
        complain: payload.complain,
        user_id: payload.user_id,
        category: payload.category,
        urgency: payload.urgency,
        property_id: payload.property_id,
      }),
    },
    token
  );

  let json: ApiBaseResponse<
    { complaint: WorkOrderDetails } | WorkOrderDetails
  > | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to create work order (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  // Some APIs return { data: { complaint: {...} } }
  const created: WorkOrderDetails | undefined =
    (data?.complaint as any) || data || (json as any);
  if (!created || !('id' in created))
    throw new ApiError('Malformed create response');
  return created;
}

export async function updateWorkOrder({
  token,
  id,
  payload,
}: {
  token: string;
  id: string | number;
  payload: WorkOrderUpdatePayload;
}): Promise<WorkOrderDetails> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/complaints/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );

  let json: ApiBaseResponse<
    { complaint: WorkOrderDetails } | WorkOrderDetails
  > | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to update work order (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const updated: WorkOrderDetails | undefined =
    (data?.complaint as any) || data || (json as any);
  if (!updated || !('id' in updated))
    throw new ApiError('Malformed update response');
  return updated;
}

export async function fetchWorkOrderById({
  token,
  id,
}: {
  token: string;
  id: string | number;
}): Promise<WorkOrderDetails> {
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/complaints/${id}`,
    { headers: { 'Content-Type': 'application/json' } },
    token
  );
  let json: ApiBaseResponse<
    { complaint: WorkOrderDetails } | WorkOrderDetails
  > | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch work order (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const wo: WorkOrderDetails | undefined =
    (data?.complaint as any) || data || (json as any);
  if (!wo || !('id' in wo)) throw new ApiError('Malformed work order response');
  return wo;
}
