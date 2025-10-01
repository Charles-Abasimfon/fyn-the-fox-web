export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/overview/:path*', '/vendors/:path*', '/work-orders/:path*'],
};
