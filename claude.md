# TotalTidy — Claude Instructions

TotalTidy is a capture-first home inventory app for busy parents. Users rapid-fire snap photos, Cloudinary async-removes backgrounds and auto-tags items, and the app builds a clean digital catalog organized by physical location. See [vision.md](./vision.md) for product context and [techstack.md](./techstack.md) for all stack decisions.

## Project Structure

```
src/
  app/                    # Next.js App Router pages and layouts
  server/
    routers/              # tRPC routers — one per domain (items, locations, sessions)
    services/             # Business logic — keep routers thin
    db/
      schema.ts           # Drizzle schema — single source of truth
      index.ts            # Drizzle client (Neon prod / local postgres dev)
  lib/                    # Shared utils, Cloudinary helpers, auth config
  components/             # React components — flat unless grouping is obvious
  hooks/                  # Custom hooks (useCamera, useCapture, useLocationPredict)
drizzle/                  # Auto-generated migrations
```

## Code Conventions

- **TypeScript strict.** No `any`. Use Drizzle inferred types (`typeof items.$inferSelect`). Use tRPC inferred types for API responses.
- **tRPC routers are thin.** Routers validate input (Zod) and call service functions. Business logic lives in `server/services/`.
- **Drizzle schema is the source of truth.** Never write raw SQL for schema changes. Use `drizzle-kit generate` → `drizzle-kit migrate`.
- **Functional components only.** No class components. Prefer server components; mark client components with `"use client"`.
- **File naming:** `kebab-case` files, `PascalCase` components, `camelCase` functions/variables.
- **Imports:** `@/` alias maps to `src/`. No barrel files — import directly.
- **Error handling:** tRPC procedures throw `TRPCError` with appropriate codes. Use React error boundaries on the client.

## Design System

Color tokens live in `src/app/globals.css` as CSS custom properties. Palette: sage greens, soft terracottas, paper whites, warm wood tones. Typography: Fraunces for headings/display, Inter for body/UI text, JetBrains Mono for code/tokens.

**Rules — apply these to every component generated or edited:**

- Never use raw hex values — always reference a CSS custom property (`--color-*`) or Tailwind token
- Never add inline styles
- Buttons: use the shadcn/ui `<Button variant="...">` — never a raw `<button>` with ad-hoc classes
- Inputs: consistent height `h-10`, border, and focus ring across all form elements
- Icons: Lucide only — never mix icon sets; 16px inline, 20px standalone
- Spacing: 4px base grid via Tailwind (p-4 = 16px, etc.)
- Border radius: use Tailwind radius tokens only (`rounded-sm`, `rounded-md`, etc.)
- Destructive actions: always require a confirmation step — never single-click delete
- Loading: indicator on the trigger element, never a full-page spinner
- Dark mode: all components must work in both light and dark mode

## Key Patterns

### tRPC Procedure

```typescript
export const itemsRouter = router({
  capture: protectedProcedure
    .input(z.object({ cloudinaryPublicId: z.string(), locationId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return itemsService.captureItem(ctx.userId, input);
    }),
});
```

### Drizzle Query

```typescript
// Always filter by userId — no exceptions
const userItems = await db.query.items.findMany({
  where: and(eq(items.userId, userId), eq(items.status, 'inbox')),
  orderBy: desc(items.createdAt),
});
```

### Cloudinary Upload

Client uploads directly to Cloudinary via unsigned preset, then passes the public ID to tRPC:

```typescript
const formData = new FormData();
formData.append('file', blob);
formData.append('upload_preset', 'totaltidy_unsigned');
const { public_id } = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  { method: 'POST', body: formData }
).then(r => r.json());

trpc.items.capture.mutate({ cloudinaryPublicId: public_id, locationId });
```

## Domain Concepts

- **Item:** Photographed object. Has original + processed (background-removed) image, AI label/tags, status (`inbox` / `kept` / `sell` / `donate`), optional location.
- **Location:** Physical place in the home ("Narnia Cupboard"). Has sort order, use count, last-used timestamp for smart prediction.
- **Capture Session:** Timed burst. Starts on first snap, ends after 60s inactivity. Generates Joy-Roll summary.
- **Unsorted Inbox:** Items captured without a location — triaged later via badge nudge.

## When You Add RBAC

Store role on the user record in the DB. Include it in JWT claims so middleware can gate routes without a DB round-trip. Use a single `adminProcedure` that wraps `protectedProcedure` and adds the role check — never sprinkle role checks inside individual resolvers.

```typescript
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MEMBER: 'member',
} as const;
```

Admin routes mount at `/admin`, gated behind `SUPER_ADMIN`. The admin dashboard calls the same tRPC API — no separate API. Impersonation must log both the admin's ID and the target user's ID on every action.

## When You Add Agents

Start at Level 1: a single `generateObject` call validated with Zod. No tools, no loops. Only escalate when the product forces it. Every agent tool call must: (1) be scoped to `userId`, (2) be logged with agent, user, and params, (3) have a 30s timeout. Write tools require user confirmation before executing. Add Langfuse observability before shipping any agent feature.

## Testing

- Unit: Vitest + @testing-library/react. Test services and utilities; test tRPC routers via direct caller, not HTTP.
- E2E: Playwright on critical flows (capture → gallery, batch assign).

## Common Tasks

- **New tRPC route:** Add procedure to router → add to `appRouter` → call via `trpc.routerName.procedureName`
- **New DB table:** Define in `schema.ts` → `pnpm db:generate` → `pnpm db:migrate`
- **New Cloudinary transform:** Define as a named preset in Cloudinary dashboard, reference by name in code
- **Cloudinary webhook:** Handle in `app/api/webhooks/cloudinary/route.ts`, verify signature, call service

## What NOT to Do

- Don't add REST endpoints — everything goes through tRPC
- Don't put business logic in tRPC routers — use services
- Don't query without `userId` filtering — every row belongs to a user
- Don't store Cloudinary API secrets on the client — unsigned upload presets only
- Don't show loading spinners for image processing — async shimmer only; the "no spinner" UX is a core product principle
- Don't build V2 features speculatively — build clean interfaces now, extend later
