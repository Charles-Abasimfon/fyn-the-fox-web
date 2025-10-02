import { ApiBaseResponse, ApiError } from './auth';

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
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
  if (!base) throw new ApiError('API base URL not configured');
  return base;
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
