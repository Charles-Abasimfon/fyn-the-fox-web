import { redirect } from 'next/navigation';

// Root route: send users to dashboard. Middleware will handle role-based redirects.
export default function Home() {
  redirect('/sign-in');
}
