import { redirect } from 'next/navigation';

// Root route: send users to dashboard. Middleware will bounce unauthenticated users to /sign-in.
export default function Home() {
  redirect('/overview');
}
