# TotalTidy — Tech Stack

## Overview

Monorepo TypeScript stack optimized for a solo developer shipping iteratively. Every choice prioritizes type-safety end-to-end, minimal boilerplate, and the ability to move fast without breaking things.

---

## Core Stack

| Layer | Technology | Why |
|---|---|---|
| **Language** | TypeScript (strict) | Single language across frontend, backend, DB schema, and API contracts |
| **Frontend** | React (Next.js App Router) | SSR for landing/marketing, CSR for the app shell, React Server Components where useful |
| **API** | tRPC | End-to-end type-safe RPC — no codegen, no OpenAPI spec, no REST boilerplate. Procedures map 1:1 to features |
| **ORM** | Drizzle ORM | Type-safe SQL, zero runtime overhead, schema-as-code. Migrations via `drizzle-kit` |
| **Database** | PostgreSQL | Rock-solid relational store. JSONB for flexible item metadata. Full-text search for inventory |
| **Image Pipeline** | Cloudinary | Upload, background removal, auto-tagging, transformations, CDN delivery — all via API |
| **Auth** | Auth.js (NextAuth v5) | Magic link email + Google OAuth. Session strategy: JWT for stateless, DB sessions if needed later |
| **Hosting** | Vercel | Zero-config Next.js deployment, edge functions, preview deploys on every PR |
| **Database Hosting** | Neon or Supabase Postgres | Serverless Postgres with branching (Neon) or built-in auth/storage extras (Supabase) |

---

## Key Architectural Decisions

### Monorepo Structure

```
totaltidy/
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, routes)
│   ├── server/
│   │   ├── routers/      # tRPC routers (items, locations, sessions, billing)
│   │   ├── services/     # Business logic (capture, processing, listing)
│   │   └── db/
│   │       ├── schema.ts # Drizzle schema (single source of truth)
│   │       └── index.ts  # Drizzle client
│   ├── lib/              # Shared utilities, Cloudinary helpers, constants
│   ├── components/       # React components
│   └── hooks/            # Custom React hooks (useCamera, useCapture, etc.)
├── drizzle/              # Generated migrations
├── public/               # Static assets, sounds, icons
└── package.json
```

Single Next.js app — no separate API server. tRPC runs as a Next.js API route. Keeps deployment simple and eliminates CORS.

### tRPC Router Design

Routers map to domain boundaries, not CRUD:

- `items` — capture, list, update, delete, bulkAssign, search
- `locations` — create, list, reorder, predict (frequency/recency logic)
- `sessions` — startSession, endSession, getSessionSummary
- `processing` — webhooks from Cloudinary (background removal done, tags ready)
- `listings` — generateDescription, postToMarketplace (V2)
- `groups` — create, invite, listDonatable (V3)

### Drizzle Schema Highlights

```typescript
// Core tables — keep flat, add JSONB for flexible metadata

items: {
  id, userId, locationId (nullable),
  originalImageUrl, processedImageUrl,
  label, tags (jsonb), category,
  status: enum('inbox', 'kept', 'sell', 'donate', 'sold', 'donated'),
  captureSessionId,
  createdAt, updatedAt
}

locations: {
  id, userId,
  name, icon, sortOrder,
  lastUsedAt, useCount
}

captureSessions: {
  id, userId,
  startedAt, endedAt,
  itemCount, summary (jsonb)
}
```

### Cloudinary Pipeline

```
User snaps photo
  → Upload to Cloudinary (unsigned upload preset, client-side)
  → Store original URL in DB, status = 'processing'
  → Cloudinary webhook: background removal complete
    → tRPC mutation updates processedImageUrl
  → Cloudinary auto-tagging (or separate vision API call)
    → tRPC mutation updates label + tags
  → Client polls or uses subscription for real-time gallery updates
```

Key Cloudinary features used:
- **Upload API** with unsigned presets for direct client upload
- **Background Removal add-on** (ai_background_removal)
- **Auto-tagging add-on** (imagga or google auto-tagging)
- **Transformations** for thumbnails, gallery images, listing photos
- **Notification webhooks** for async processing status

### Camera Implementation

React component wrapping the browser `getUserMedia` API:
- Canvas-based zero-latency capture (no file picker)
- Blob → Cloudinary upload via `fetch` (no SDK needed client-side)
- Thumbnail tray rendered from local blob URLs (instant, no network wait)
- Vibration API for haptic feedback on capture

### Real-Time Updates

For the async "dirty → clean" gallery transition:
- **Option A (MVP):** Polling via tRPC query with `refetchInterval`
- **Option B (V1.5):** tRPC subscriptions via SSE or WebSocket for instant updates
- **Option C (V2):** Push notifications for background processing completion

---

## Infrastructure & Services

| Service | Purpose | Tier |
|---|---|---|
| **Vercel** | Hosting, edge, preview deploys | Pro ($20/mo) |
| **Neon** | Serverless Postgres | Free tier → Scale as needed |
| **Cloudinary** | Image upload, processing, CDN | Free tier (25 credits/mo) → Programmable Media plan |
| **Resend** | Transactional email (magic links, session summaries) | Free tier (100 emails/day) |
| **Sentry** | Error tracking | Free tier |
| **Vercel Analytics** | Web analytics + performance | Included with Pro |

### Cost Projection (MVP, 0–1000 users)

Cloudinary is the main variable cost. Background removal = 1 credit per image. At 1000 users × 8 items/session × 4 sessions/month = ~32,000 removals/month. That's roughly the Plus plan ($89/mo). Everything else stays in free/low tiers.

---

## Dev Tooling

| Tool | Purpose |
|---|---|
| **pnpm** | Package manager (fast, strict) |
| **Biome** | Linting + formatting (replaces ESLint + Prettier, faster) |
| **drizzle-kit** | Schema migrations, studio for DB inspection |
| **Turbo** | Task caching if monorepo grows (optional) |

---

## Security Considerations

- Cloudinary uploads use **unsigned presets** scoped to a specific folder + transformation preset — no API secret on client
- Auth.js handles CSRF, session management, token rotation
- tRPC procedures use middleware for auth checks — no unprotected mutations
- Row-level filtering: every query includes `where: eq(items.userId, ctx.userId)`
- Rate limiting on capture endpoints to prevent abuse
