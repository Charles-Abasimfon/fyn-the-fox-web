import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';

export interface RawVendorInfoAvailability {
  [day: string]: string;
}

export interface RawVendorInfo {
  availability?: RawVendorInfoAvailability | null;
  service_area?: string | null;
  type?: string | null;
  priority?: number | null;
  status?: string | null;
  preferred_contact_method?: string | null;
}

export interface RawVendor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  status?: string;
  registered_on?: string;
  VendorInfo?: RawVendorInfo | null;
}

export interface VendorsListResponse {
  vendors: RawVendor[];
  pagination: {
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

export async function fetchVendors(params: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<VendorsListResponse> {
  const { token, page = 1, limit = 10 } = params;
  const base = getBase();
  const url = new URL(base + '/users/fetch/vendors');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  let json: ApiBaseResponse<VendorsListResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch vendors (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data) throw new ApiError('Malformed vendors response');
  return json.data;
}

export async function deleteVendor(params: {
  token: string;
  id: string | number;
}): Promise<void> {
  const { token, id } = params;
  const base = getBase();
  const url = `${base}/users/delete/vendors/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  let json: ApiBaseResponse<any> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to delete vendor (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}

export interface AddVendorPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  type: string;
  service_area: string[];
  preferred_contact_method: string;
}

export interface AddVendorResponse {
  vendor: RawVendor;
}

export async function addVendor(params: {
  token: string;
  payload: AddVendorPayload;
}): Promise<RawVendor> {
  const { token, payload } = params;
  const base = getBase();
  const res = await fetch(`${base}/users/register/vendors`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  let json: ApiBaseResponse<AddVendorResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to add vendor (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data?.vendor) throw new ApiError('Malformed add vendor response');
  return json.data.vendor;
}

export interface UpdateVendorPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  type?: string;
  priority?: number;
  availability?: Record<string, string>;
  service_area?: string[];
  preferred_contact_method?: string;
}

export interface UpdateVendorResponse {
  vendor?: RawVendor;
}

export async function updateVendor(params: {
  token: string;
  id: string | number;
  payload: UpdateVendorPayload;
}): Promise<RawVendor | null> {
  const { token, id, payload } = params;
  const base = getBase();
  const res = await fetch(`${base}/users/update/vendors/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  let json: ApiBaseResponse<UpdateVendorResponse> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to update vendor (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return json?.data?.vendor ?? null;
}
