'use client';

export type AppMode = 'property' | 'hospitality';

// Key used for persistence across client routes
export const MODE_STORAGE_KEY = 'fyn_view';

// Best-effort runtime detection on the client
export function detectMode(): AppMode {
  try {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const qv = (sp.get('view') || '').toLowerCase();
      if (qv === 'hospitality' || qv === 'property') return qv as AppMode;

      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/hospitality')) return 'hospitality';
      if (path.startsWith('/property-owner') || path.startsWith('/vendor'))
        return 'property';

      const stored = (
        localStorage.getItem(MODE_STORAGE_KEY) || ''
      ).toLowerCase();
      if (stored === 'hospitality' || stored === 'property')
        return stored as AppMode;
    }
  } catch {
    // ignore
  }
  return 'property';
}

export function getApiBaseFor(mode: AppMode): string {
  // Support explicit envs, and fall back to legacy NEXT_PUBLIC_API_BASE_URL for property
  const prop =
    process.env.NEXT_PUBLIC_API_BASE_URL_PROPERTY ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    '';
  const hosp = process.env.NEXT_PUBLIC_API_BASE_URL_HOSPITALITY || '';

  const raw = (mode === 'hospitality' ? hosp : prop) || '';
  const cleaned = raw.replace(/\/$/, '');
  if (!cleaned) throw new Error('API base URL not configured for ' + mode);
  try {
    // Validate URL format
    new URL(cleaned);
  } catch {
    throw new Error('Invalid API base URL for ' + mode);
  }
  return cleaned;
}

export function getRuntimeApiBase(): string {
  const mode = detectMode();
  return getApiBaseFor(mode);
}
