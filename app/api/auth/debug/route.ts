import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Temporary debug route to introspect the current auth token server-side.
// Remove after diagnosing production cookie issues.
export async function GET(req: Request) {
  try {
    // getToken expects a NextRequest-like object; new Request works in app router as long as headers are passed.
    // We cast for TypeScript simplicity.
    const token = await getToken({ req: req as any });
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (
        [
          'cookie',
          'host',
          'user-agent',
          'x-forwarded-for',
          'x-forwarded-host',
          'x-forwarded-proto',
        ].includes(key)
      ) {
        headers[key] = value;
      }
    });
    return NextResponse.json({
      success: true,
      tokenPresent: !!token,
      token,
      headers,
      note: 'Remove this endpoint after debugging. Reveals sensitive info.',
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'error' },
      { status: 500 }
    );
  }
}
