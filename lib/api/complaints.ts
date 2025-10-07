import { ApiBaseResponse, ApiError } from './auth';

export interface RawComplaint {
  id: string;
  complain: string; // API uses 'complain'
  scheduled_date: string | null;
  category: string;
  urgency: string;
  eta: string | null; // ISO timestamp
  status: string;
  createdAt: string;
  updatedAt: string;
  user_id: string;
  assigned_to: string | null;
  property_id: string;
  Property?: {
    id: string;
    name: string;
    address_id: string;
    Address?: {
      id: string;
      country: string;
      state: string;
      city: string;
      street: string;
      zip_code: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  Complainant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    tenant_info_id?: string;
    TenantInfo?: {
      id: string;
      floor_number: number;
      apartment_number: string;
    };
  };
  Vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    vendor_info_id?: string;
    VendorInfo?: {
      id: string;
      type: string; // plumber etc
      priority: number;
      availability: string | Record<string, string> | null;
    };
  } | null;
}

export interface ComplaintsListResponse {
  complaints: RawComplaint[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

function getBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
  if (!base) throw new ApiError('API base URL not configured');
  return base;
}

export async function fetchComplaints(params: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<ComplaintsListResponse> {
  const { token, page = 1, limit = 10 } = params;
  const base = getBase();
  const url = new URL(base + '/complaints');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  let json: ApiBaseResponse<ComplaintsListResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch complaints (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data) throw new ApiError('Malformed complaints response');
  return json.data;
}

export interface AssignVendorPayload {
  complaint_id: string;
  vendor_id: string;
}

export interface AssignVendorResponse {
  complaint: RawComplaint;
}

export async function assignVendor(params: {
  token: string;
  payload: AssignVendorPayload;
}): Promise<RawComplaint> {
  const { token, payload } = params;
  const base = getBase();
  const res = await fetch(`${base}/complaints/assign-vendor`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let json: ApiBaseResponse<AssignVendorResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to assign vendor (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const updated = json?.data?.complaint;
  if (!updated) throw new ApiError('Malformed assign vendor response');
  return updated;
}

export interface UpdateComplaintStatusResponse {
  complaint: RawComplaint;
}

export interface UpdateComplaintStatusParams {
  token: string;
  id: string;
  status: string; // e.g., 'in-progress', 'completed', 'estimate-needed'
}

export async function updateComplaintStatus({
  token,
  id,
  status,
}: UpdateComplaintStatusParams): Promise<RawComplaint> {
  const base = getBase();
  const res = await fetch(`${base}/complaints/${id}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  let json: ApiBaseResponse<UpdateComplaintStatusResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to update complaint (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const updated = json?.data?.complaint;
  if (!updated) throw new ApiError('Malformed update complaint response');
  return updated;
}

export interface AcceptWorkOrderResponse {
  complaint: RawComplaint;
}

export async function acceptWorkOrder({
  token,
  id,
}: {
  token: string;
  id: string;
}): Promise<RawComplaint> {
  const base = getBase();
  const res = await fetch(`${base}/complaints/accept-work-order/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  let json: ApiBaseResponse<AcceptWorkOrderResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to accept work order (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const updated = json?.data?.complaint;
  if (!updated) throw new ApiError('Malformed accept work order response');
  return updated;
}

export interface SetSchedulePayload {
  complaint_id: string;
  date: string; // ISO date string
}

export interface SetScheduleResponse {
  complaint: RawComplaint;
}

export async function setSchedule({
  token,
  payload,
}: {
  token: string;
  payload: SetSchedulePayload;
}): Promise<RawComplaint> {
  const base = getBase();
  const res = await fetch(`${base}/complaints/set-schedule`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let json: ApiBaseResponse<SetScheduleResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to set schedule (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const updated = json?.data?.complaint;
  if (!updated) throw new ApiError('Malformed set schedule response');
  return updated;
}
