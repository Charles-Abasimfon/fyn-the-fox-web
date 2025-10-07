import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected application sections
const protectedPrefixes = ['/vendor', '/property-owner'];
const signInPath = '/sign-in';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read token (if any). If NEXTAUTH_SECRET missing in prod this will always be null, causing loops.
  const token = await getToken({ req });

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isSignIn = pathname === signInPath;

  // If user is authenticated and tries to visit sign-in, send them to their dashboard.
  if (token && isSignIn) {
    const url = req.nextUrl.clone();
    const role = (token as any)?.role || (token as any)?.user?.role;
    url.pathname = role === 'vendor' ? '/vendor' : '/property-owner/overview';
    return NextResponse.redirect(url);
  }

  // If path is protected and no token, redirect to sign-in (avoid infinite redirect by checking current path)
  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = signInPath;
    // Preserve original destination so we could optionally use it later
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based route guard: prevent vendors from accessing owner routes and vice versa
  const role = (token as any)?.role || (token as any)?.user?.role;
  if (token) {
    const isOwnerRoute = ['/property-owner'].some((p) =>
      pathname.startsWith(p)
    );
    const isVendorRoute = pathname.startsWith('/vendor');

    if (role === 'vendor' && isOwnerRoute) {
      const url = req.nextUrl.clone();
      url.pathname = '/vendor';
      return NextResponse.redirect(url);
    }
    if (role !== 'vendor' && isVendorRoute) {
      const url = req.nextUrl.clone();
      url.pathname = '/property-owner/overview';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/property-owner/:path*',
    '/vendor/:path*',
    '/sign-in',
  ],
};
