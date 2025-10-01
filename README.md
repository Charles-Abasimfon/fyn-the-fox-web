This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Fyn Web

## Authentication (NextAuth) Setup

This project now uses NextAuth (Credentials Provider) to authenticate against the backend API.

### Environment Variables (.env.local)

Create a `.env.local` file at the project root with:

```
NEXTAUTH_SECRET=your-random-secret-value
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=https://fynthefox.com.genriseyouthcenter.com/api
```

Generate a secure secret (example using node):

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Login Flow

1. User submits email/password on `/sign-in`.
2. NextAuth credentials provider calls `POST ${NEXT_PUBLIC_API_BASE_URL}/auth/login` with `{ email, password }`.
3. On success, `access_token` & `refresh_token` are stored in the NextAuth JWT.
4. The access token exp is decoded; session auto-invalidates client-side when expired. (Currently no refresh call implemented.)
5. Protected pages (`/overview`, `/vendors`, `/work-orders`) are enforced via `middleware.ts`.

### Protected Routes

`middleware.ts` exports NextAuth middleware with matchers for:

```
/overview
/vendors
/work-orders
```

Any unauthenticated access redirects to `/sign-in`.

### Session & Auto Logout

- JWT strategy used; token exp extracted from the `access_token` JWT `exp` claim.
- When expired, the token is marked with `error: 'RefreshAccessTokenError'` and the session consumer can choose to sign out.
- You can extend client logic to auto signOut when `session.error` is present.

### Using Session in Components

Use:

```tsx
import { useSession } from 'next-auth/react';
const { data: session, status } = useSession();
```

`session.accessToken` is available if logged in.

### Logging Out

The top navigation bar now exposes a Logout button using `signOut({ callbackUrl: '/sign-in' })`.

### Future Enhancements

- Implement refresh token rotation using `refresh_token` when backend exposes a refresh endpoint (e.g. `/auth/refresh`).
- Add role-based authorization checks.
- Display backend user profile info.

## Development

Run the local dev server:

```
npm run dev
```

## Notes

- Ensure `NEXT_PUBLIC_API_BASE_URL` has no trailing slash.
- Update Next.js to match NextAuth major upgrade (v5+) when released & stable in this codebase.
