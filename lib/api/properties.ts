import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';
import { fetchWithAuth } from './http';

function getBase(): string {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
}

export interface RetractVendorPayload {
  property_id: string;
  vendor_id: string;
}

export async function retractVendorFromProperty(params: {
  token: string;
  payload: RetractVendorPayload;
}): Promise<void> {
  const { token, payload } = params;
  const base = getBase();
  const res = await fetchWithAuth(
    `${base}/properties/retract-vendor`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token
  );

  let json: ApiBaseResponse<any> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg = json?.message || `Failed to retract vendor (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  // endpoint does not return data we need; success implies retraction completed
}
