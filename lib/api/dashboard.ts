import { ApiBaseResponse, ApiError } from './auth';

export interface DashboardStatsResponse {
  total_complaints: number; // maps from stats.total
  open_complaints: number; // maps from stats.open
  resolved_complaints: number; // maps from stats.completed
  assigned_vendors: number; // maps from stats.assigned (interpreted as vendors assigned)
  pending_vendor_acceptance?: number; // optional, from stats.pending_vendor_acceptance
  [key: string]: number | undefined; // forward compatibility
}

function getBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
  if (!base) throw new ApiError('API base URL not configured');
  return base;
}

export async function fetchDashboardStats(params: {
  token: string;
}): Promise<DashboardStatsResponse> {
  const { token } = params;
  const base = getBase();
  const url = base + '/dashboard';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  let json: ApiBaseResponse<
    { stats: DashboardStatsResponse } & Partial<DashboardStatsResponse>
  > | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore parse error */
  }

  if (!res.ok) {
    const msg =
      json?.message || `Failed to fetch dashboard stats (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  // Some APIs might nest under data.stats or directly under data.
  const data: any = json?.data;
  if (!data) throw new ApiError('Malformed dashboard stats response');

  // Actual response shape provided:
  // data: { complaints: [...], pagination: {...}, stats: { total, open, pending_vendor_acceptance, assigned, completed } }
  const rawStats = data.stats || data; // fall back if structure changes
  const stats: DashboardStatsResponse = {
    total_complaints: Number(rawStats.total) || 0,
    open_complaints: Number(rawStats.open) || 0,
    resolved_complaints: Number(rawStats.completed) || 0,
    assigned_vendors: Number(rawStats.assigned) || 0,
    pending_vendor_acceptance:
      rawStats.pending_vendor_acceptance != null
        ? Number(rawStats.pending_vendor_acceptance)
        : undefined,
  };

  return stats;
}
