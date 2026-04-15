# TotalTidy — claude.md

## Project Overview

TotalTidy is a capture-first home inventory app for busy parents. Users rapid-fire snap photos of items, the app async-removes backgrounds via Cloudinary, AI-labels items, and builds a clean digital catalog organized by physical locations in the home.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript (strict mode)
- **API:** tRPC v11 — all server communication is type-safe RPC, no REST endpoints
- **ORM:** Drizzle ORM with PostgreSQL (Neon serverless)
- **Image Pipeline:** Cloudinary (upload, background removal, auto-tagging, CDN)
- **Auth:** Auth.js (NextAuth v5) — magic link email + Google OAuth
- **Hosting:** Vercel

## Project Structure

```
src/
  app/                    # Next.js App Router pages and layouts
  server/
    routers/              # tRPC routers — one per domain (items, locations, sessions)
    services/             # Business logic, keep routers thin
    db/
      schema.ts           # Drizzle schema — single source of truth for all tables
      index.ts            # Drizzle client instance
  lib/                    # Shared utils, Cloudinary helpers, constants
  components/             # React components — colocate styles, keep flat unless grouping makes sense
  hooks/                  # Custom hooks (useCamera, useCapture, useLocationPredict)
drizzle/                  # Auto-generated migrations via drizzle-kit
```

## Code Conventions

- **TypeScript strict mode.** No `any`. Use Drizzle's inferred types (`typeof items.$inferSelect`) for DB row types. Use tRPC's inferred types for API responses.
- **tRPC routers are thin.** Routers validate input (Zod) and call service functions. Business logic lives in `server/services/`.
- **Drizzle schema is the source of truth.** Never write raw SQL for schema changes. Use `drizzle-kit generate` → `drizzle-kit migrate`.
- **Components are functional.** No class components. Use hooks for state. Prefer server components where possible, mark client components explicitly with `"use client"`.
- **File naming:** `kebab-case` for files, `PascalCase` for components, `camelCase` for functions/variables.
- **Imports:** Use `@/` path alias mapped to `src/`.
- **Error handling:** tRPC procedures throw `TRPCError` with appropriate codes. Client-side uses tRPC's `onError` or React error boundaries.
- **No barrel files.** Import directly from the module.

## Key Patterns

### tRPC Procedure Pattern

```typescript
// server/routers/items.ts
export const itemsRouter = router({
  capture: protectedProcedure
    .input(z.object({ cloudinaryPublicId: z.string(), locationId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return itemsService.captureItem(ctx.userId, input);
    }),
});
```

### Drizzle Query Pattern

```typescript
// Always filter by userId — no exceptions
const userItems = await db.query.items.findMany({
  where: and(eq(items.userId, userId), eq(items.status, 'inbox')),
  orderBy: desc(items.createdAt),
});
```

### Cloudinary Upload Pattern

Client-side unsigned upload to Cloudinary, then pass the public ID to tRPC:

```typescript
// Client: upload blob directly to Cloudinary
const formData = new FormData();
formData.append('file', blob);
formData.append('upload_preset', 'totaltidy_unsigned');
const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
  method: 'POST', body: formData,
});
const { public_id } = await res.json();

// Client: tell the server about it
trpc.items.capture.mutate({ cloudinaryPublicId: public_id, locationId });
```

## Domain Concepts

- **Item:** A photographed object. Has an original image, a processed (background-removed) image, AI-generated label/tags, a status (inbox/kept/sell/donate), and an optional location.
- **Location:** A physical place in the home ("Narnia Cupboard", "Toy Trunk"). Has a sort order, use count, and last-used timestamp for prediction.
- **Capture Session:** A timed burst of photo captures. Starts on first snap, ends after 60s of inactivity. Generates a Joy-Roll summary.
- **Unsorted Inbox:** Items captured without a location assignment. The app nudges users to triage these later.

## Database

PostgreSQL via Neon. Key tables: `users`, `items`, `locations`, `capture_sessions`. See `src/server/db/schema.ts` for the full schema. Use JSONB columns for flexible metadata (tags, session summaries) — don't over-normalize.

## Environment Variables

```
DATABASE_URL=              # Neon Postgres connection string
NEXTAUTH_SECRET=           # Auth.js secret
NEXTAUTH_URL=              # App URL
GOOGLE_CLIENT_ID=          # Google OAuth
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=     # Cloudinary cloud name
CLOUDINARY_API_KEY=        # Cloudinary API key (server-side only)
CLOUDINARY_API_SECRET=     # Cloudinary API secret (server-side only)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=  # Client-side cloud name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET= # Unsigned upload preset name
```

## Testing

- Use Vitest for unit tests on services and utilities
- Use Playwright for E2E on critical flows (capture → gallery, batch assign)
- tRPC routers tested via direct caller, not HTTP

## Common Tasks

- **Add a new tRPC route:** Create procedure in relevant router → add to `appRouter` → use in component via `trpc.routerName.procedureName`
- **Add a DB table:** Define in `schema.ts` → `pnpm drizzle-kit generate` → `pnpm drizzle-kit migrate`
- **Add a Cloudinary transformation:** Define as a named preset in Cloudinary dashboard, reference by name in code
- **Process webhook:** Add API route at `app/api/webhooks/cloudinary/route.ts`, verify signature, call service function

## What NOT To Do

- Don't add REST endpoints — everything goes through tRPC
- Don't put business logic in tRPC routers — use services
- Don't query without userId filtering — every row belongs to a user
- Don't store Cloudinary API secrets on the client — use unsigned upload presets
- Don't create loading spinners for image processing — the whole point is async "no spinner" UX
- Don't over-plan V2 features — build clean interfaces now, extend later
