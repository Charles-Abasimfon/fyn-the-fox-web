import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';

export interface RawTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  tenant_info_id?: string;
  TenantInfo?: {
    id: string;
    floor_number?: number | null;
    apartment_number?: string | null;
    Property?: {
      id: string;
      name: string;
    } | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantsListResponse {
  tenants: RawTenant[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface AddTenantPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  property_id: string;
  floor_number?: string | null; // keep as string to preserve leading zeros
  apartment_number?: string | null;
}

function getBase(): string {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
}

export async function fetchTenants({
  token,
  page = 1,
  limit = 10,
}: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<TenantsListResponse> {
  const base = getBase();
  const url = new URL(base + '/users/fetch/property-users');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  // API returns: { data: { users: RawTenant[], pagination: {...} } }
  let json: ApiBaseResponse<{
    users: RawTenant[];
    pagination: TenantsListResponse['pagination'];
  }> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch tenants (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (!json?.data || !Array.isArray(json.data.users))
    throw new ApiError('Malformed tenants response');
  return {
    tenants: json.data.users,
    pagination: json.data.pagination,
  };
}

export async function addTenant({
  token,
  payload,
}: {
  token: string;
  payload: AddTenantPayload;
}): Promise<RawTenant> {
  const base = getBase();
  const res = await fetch(`${base}/users/register/property-users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  let json: ApiBaseResponse<{ tenant: RawTenant } | RawTenant> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to add tenant (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const tenant: RawTenant | undefined =
    (data?.tenant as any) || data || (json as any);
  if (!tenant || !('id' in tenant))
    throw new ApiError('Malformed add tenant response');
  return tenant;
}

export async function fetchTenantById({
  token,
  id,
}: {
  token: string;
  id: string | number;
}): Promise<RawTenant> {
  const base = getBase();
  const res = await fetch(`${base}/users/fetch/property-users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  let json: ApiBaseResponse<
    { user?: any } | { user: { user: RawTenant } } | RawTenant
  > | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = json?.message || `Failed to fetch tenant (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  const data: any = json?.data ?? null;
  const nested = data?.user?.user || data?.user || data;
  if (!nested || !nested.id)
    throw new ApiError('Malformed tenant detail response');
  return nested as RawTenant;
}

export async function deleteTenant({
  token,
  id,
}: {
  token: string;
  id: string | number;
}): Promise<void> {
  const base = getBase();
  const res = await fetch(`${base}/users/delete/property-users/${id}`, {
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
    const msg = json?.message || `Failed to delete tenant (${res.status})`;
    throw new ApiError(msg, res.status);
  }
}
