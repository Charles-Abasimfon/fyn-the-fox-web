import type { Metadata } from 'next';
import { Figtree, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import SessionProviderWrapper from '@/components/auth/SessionProviderWrapper';
import { ToastProvider } from '@/components/ui/toast';
import { ModeProvider } from '@/components/auth/ModeProvider';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fyn',
  description: 'Seamless solutions for Housing & Hospitality.',
};

// Per Next.js 13+/15 spec, viewport must be exported separately
// https://nextjs.org/docs/app/api-reference/functions/generate-viewport
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${figtree.variable} ${plusJakartaSans.variable} bg-[#101014]`}
      >
        <SessionProviderWrapper>
          <ModeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ModeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
