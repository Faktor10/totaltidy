# TotalTidy

A capture-first home inventory app for busy parents.

## Stack

- **Framework**: Next.js 15 with Turbopack
- **Auth**: NextAuth v5 (beta) with Drizzle adapter
- **Database**: Neon (serverless PostgreSQL) via Drizzle ORM
- **API**: tRPC v11 with TanStack React Query
- **Storage**: Cloudinary (image uploads)
- **Email**: Resend
- **Styling**: Tailwind CSS / globals.css

## Project Structure

```
src/
  app/           # Next.js App Router pages & API routes
    api/         # tRPC & auth API handlers
    auth/        # Sign-in / sign-up pages
    capture/     # Capture session page
    dashboard/   # Inventory dashboard
  components/    # Shared UI components
  hooks/         # Custom React hooks
  lib/           # Client-side utilities
  server/        # tRPC routers & server-side logic
  middleware.ts  # Auth middleware (NextAuth)
lib/
  db/            # Drizzle schema & database client
drizzle/         # Migration files
scripts/         # Setup scripts (e.g. Cloudinary preset)
```

## Running the App

The workflow "Start application" runs `pnpm dev` (Next.js 15 with Turbopack) on port 3000.

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth
- `CLOUDINARY_*` — Cloudinary credentials
- `RESEND_API_KEY` — Email sending
