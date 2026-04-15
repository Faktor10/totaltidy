# TotalTidy — Task Tracker

<!-- SYSTEM PROMPT — paste this block at the start of every Claude session -->
<!--
You are building TotalTidy: a capture-first home inventory app for busy parents.

## Stack
- Next.js (App Router) + TypeScript strict mode
- tRPC v11 (ALL server communication — no REST endpoints)
- Drizzle ORM + PostgreSQL (Neon serverless)
- Cloudinary (upload, background removal, auto-tagging, CDN)
- Auth.js v5 (magic link email + Google OAuth)
- Vitest (unit tests) + Playwright (E2E tests)
- Biome (lint + format)

## Critical Conventions
- tRPC routers are thin — all business logic lives in `server/services/`
- Every DB query MUST filter by `userId` — no exceptions
- Never create loading spinners for image processing — async "no spinner" is the whole UX
- No class components, no barrel files, no raw SQL for schema changes
- Cloudinary API secrets NEVER go to the client — use unsigned upload presets only
- File naming: `kebab-case` files, `PascalCase` components, `camelCase` functions

## Quality Gate — NON-NEGOTIABLE before any PR
Before opening or merging a pull request for ANY feature:
1. `npm run lint`  → must exit 0, zero errors or warnings
2. `npm test`      → all Vitest unit tests must pass
3. `npm run e2e`   → all Playwright E2E tests must pass

If any of these three commands show a failure, the PR must NOT be opened. Fix the
failures first, then re-run all three commands to confirm green across the board.

## Task Tracking
Mark sub-tasks as completed (`- [x]`) as each one lands and the quality gate passes.
This file is the source of truth for build progress. Keep it up to date.
-->

---

## Phase 1 — MVP: "Snap-Snap-Done" (Weeks 1–8)

**Goal:** A working capture-to-catalog loop that feels like magic.

---

### Milestone 1.1 — Foundation (Weeks 1–2)

- [x] Initialise Next.js project with TypeScript strict mode, App Router, and `@/` path alias
- [x] Configure Biome for linting + formatting; add `npm run lint` script
- [ ] Add Vitest for unit tests; add `npm test` script
- [ ] Add Playwright for E2E tests; add `npm run e2e` script
- [ ] Set up CI pipeline (GitHub Actions) running lint → test → e2e on every PR
- [ ] Define Drizzle schema: `users`, `items`, `locations`, `capture_sessions` tables in `src/server/db/schema.ts`
- [ ] Run initial `drizzle-kit generate` + `drizzle-kit migrate` against Neon Postgres
- [ ] Wire tRPC root router at `src/server/routers/index.ts`; mount as Next.js API route
- [ ] Configure Auth.js v5 with magic link email provider (Resend)
- [ ] Add Google OAuth provider to Auth.js
- [ ] Protect all tRPC mutations with `protectedProcedure` middleware
- [ ] Add all required environment variables to `.env.example` (DATABASE_URL, NEXTAUTH_SECRET, Cloudinary keys, etc.)
- [ ] Create Cloudinary unsigned upload preset scoped to `totaltidy/` folder
- [ ] Scaffold Cloudinary webhook handler at `app/api/webhooks/cloudinary/route.ts` with signature verification
- [ ] Write Vitest unit tests for auth middleware and Drizzle query helpers
- [ ] Write Playwright E2E test: unauthenticated user is redirected to sign-in page
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 1.1 PR**

---

### Milestone 1.2 — Capture Flow (Weeks 3–4)

- [ ] Build `useCamera` hook wrapping `getUserMedia` with canvas-based capture (no file picker)
- [ ] Build full-screen `<CameraView>` component — camera stays live after every shot
- [ ] Implement zero-lag shutter: capture blob from canvas, no confirmation dialog
- [ ] Upload blob directly to Cloudinary from client using unsigned preset; return `public_id`
- [ ] Create `trpc.items.capture` mutation: accept `cloudinaryPublicId` + optional `locationId`, persist to DB with `status = 'inbox'`
- [ ] Build thumbnail tray showing last 3–4 captures (local blob URLs, no network wait)
- [ ] Implement haptic feedback on capture via Vibration API
- [ ] Build `<LocationStrip>` component: 3–5 quick-tap bubble buttons above shutter
- [ ] Create `trpc.locations.list` query returning user's locations sorted by `sortOrder`
- [ ] Implement one-tap location assignment: tap bubble → call `trpc.items.assignLocation` → item filed
- [ ] Build Unsorted Inbox page (`/inbox`): list items where `locationId IS NULL`
- [ ] Add inbox badge showing count of unassigned items
- [ ] Implement batch-assign prompt: "N items are homeless — all going to [last location]?" with confirm
- [ ] Write Vitest unit tests for `itemsService.captureItem` and `locationsService.list`
- [ ] Write Playwright E2E test: open camera → capture item → appears in inbox
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 1.2 PR**

---

### Milestone 1.3 — The Vanish Studio (Weeks 5–6)

- [ ] Enable Cloudinary Background Removal add-on (`ai_background_removal`) on upload
- [ ] Handle Cloudinary webhook: `background_removal` notification → update `processedImageUrl` in DB
- [ ] Implement gallery polling: tRPC query with `refetchInterval` swaps dirty image for clean one when ready
- [ ] Enable Cloudinary auto-tagging add-on (Imagga or Google)
- [ ] Handle Cloudinary webhook: `auto_tagging` notification → write `label` + `tags` JSONB to DB
- [ ] Build clean gallery page (`/gallery`): studio-white grid of processed images, grouped by location
- [ ] Show placeholder shimmer while `processedImageUrl` is null (no spinners — shimmer only)
- [ ] Display AI-generated label beneath each item card
- [ ] Build location detail page (`/locations/[id]`): filtered grid for one location
- [ ] Write Vitest unit tests for webhook handlers (background removal, auto-tagging)
- [ ] Write Playwright E2E test: captured item eventually shows clean background in gallery
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 1.3 PR**

---

### Milestone 1.4 — Polish & Reward Loop (Weeks 7–8)

- [ ] Implement location prediction algorithm in `locationsService`: reorder bubbles by frequency + recency + time-of-day
- [ ] Persist `lastUsedAt` and `useCount` on every location assignment
- [ ] Implement Last-Location Memory: default `locationId` on new captures to most recently used location
- [ ] Create `trpc.sessions.startSession` + `trpc.sessions.endSession` procedures
- [ ] Implement 60-second inactivity detector on camera page; auto-call `endSession` on timeout
- [ ] Build Joy-Roll summary card: items captured, locations used, "floor space reclaimed" metaphor
- [ ] Define Scandi-minimalist design tokens: sage greens, soft terracottas, paper whites, warm wood tones
- [ ] Apply typography tokens (font family, scale, weight) globally via CSS variables
- [ ] Add rounded corners and bouncy micro-animations (CSS transitions / Framer Motion) to key interactions
- [ ] Add subtle sound effect on successful item categorization (short Web Audio API tone)
- [ ] Polish inbox badge with nudge copy ("3 items need a home")
- [ ] Write Vitest unit tests for location prediction algorithm
- [ ] Write Playwright E2E test: capture 5 items → wait 60s → Joy-Roll summary card appears
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 1.4 PR**

---

### V1 Exit Criteria

- [ ] Open app → capture first photo in < 2 seconds
- [ ] Capture 10 items in < 30 seconds (rapid-fire mode)
- [ ] Background removal completes async — no spinner ever shown
- [ ] Gallery displays clean, white-background item grid
- [ ] Session summary fires reliably after capture sessions

---

## Phase 2 — Monetization: "The Lifecycle Economy" (Weeks 9–16)

**Goal:** The app pays for itself. Turn cataloged items into revenue.

---

### Milestone 2.1 — Tinder-Style Sorting (Weeks 9–10)

- [ ] Build swipe card component (`<SortCard>`) with Keep / Donate / Sell actions
- [ ] Create `trpc.items.updateStatus` mutation: update `status` enum field
- [ ] Integrate AI-suggested tags: derive `#Outgrown`, `#Keepsake`, `#MissingParts`, `#SeasonalStore` from item label + metadata
- [ ] Build bulk sort mode: display inbox backlog as paginated card stack
- [ ] Add "Done sorting" summary screen showing counts per status
- [ ] Write Vitest unit tests for tag suggestion logic
- [ ] Write Playwright E2E test: swipe item to "Sell" → item appears in sell list
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 2.1 PR**

---

### Milestone 2.2 — Auto-Listing Engine (Weeks 11–13)

- [ ] Create `listingsService.generateDescription`: call AI (Claude or OpenAI) with item photo + label to produce SEO-optimized title + description
- [ ] Build `trpc.listings.generate` procedure wrapping the service
- [ ] Implement first marketplace integration (eBay, Vinted, or Facebook Marketplace — pick one)
- [ ] Build one-tap listing UI: review AI draft → confirm → post to marketplace
- [ ] Create Resale Heatmap component: fetch comparable sold prices via marketplace API → suggest listing price
- [ ] Add convenience fee hook (or affiliate shipping label link) on successful listing
- [ ] Write Vitest unit tests for `listingsService.generateDescription`
- [ ] Write Playwright E2E test: select "Sell" item → generate listing → listing draft displayed
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 2.2 PR**

---

### Milestone 2.3 — Inventory Intelligence (Weeks 14–15)

- [ ] Add `size` and `ageGroup` fields to `items` table; migrate
- [ ] Build size/age tagging UI on item detail page
- [ ] Create `trpc.alerts.checkOutgrown`: compare item `ageGroup` to child's age stored in user profile
- [ ] Add child date-of-birth field to user profile; migrate
- [ ] Implement Outgrown Alerts: scheduled job (cron or Vercel cron) surfaces "move 4T box to Sell?" nudge
- [ ] Build Category Volume Meters on dashboard: "42 t-shirts in Size 4T"
- [ ] Create Gratitude Archive: dedicated folder/status for sentimental items
- [ ] Write Vitest unit tests for outgrown alert logic
- [ ] Write Playwright E2E test: mark item outgrown → alert appears on dashboard
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 2.3 PR**

---

### Milestone 2.4 — Premium Tier (Week 16)

- [ ] Define free-tier limits: 100 items max, 3 locations max; enforce in tRPC procedures
- [ ] Integrate Stripe: create subscription products for Pro tier ($3.99–5.99/mo)
- [ ] Add `subscriptionStatus` and `stripeCustomerId` fields to `users` table; migrate
- [ ] Implement Pro tier gate middleware in tRPC: check `subscriptionStatus` before unlimited-item mutations
- [ ] Build upgrade prompt UI for users hitting free-tier limits
- [ ] Build Insurance Vault: generate PDF manifest of all items with photos (one-time IAP alternative)
- [ ] Build Bin Label Generator: printable PDF labels with photos of cupboard contents
- [ ] Write Vitest unit tests for free-tier limit enforcement
- [ ] Write Playwright E2E test: free user hits item limit → upgrade prompt displayed
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 2.4 PR**

---

### V2 Exit Criteria

- [ ] User can go from captured item → live marketplace listing in < 60 seconds
- [ ] Outgrown alerts trigger accurately based on child age + item size
- [ ] Premium conversion rate ≥ 3% of active users
- [ ] At least one marketplace integration fully functional

---

## Phase 3 — Network: "The Hand-Me-Down Economy" (Weeks 17–24)

**Goal:** Turn single-player utility into a multiplayer network.

---

### Milestone 3.1 — Community Swap (Weeks 17–19)

- [ ] Add `groups` and `group_members` tables to Drizzle schema; migrate
- [ ] Create `trpc.groups` router: `create`, `invite`, `join`, `list`, `leave` procedures
- [ ] Build private group creation UI with custom group name ("Park School Parents")
- [ ] Implement invite-by-link flow with expiring token
- [ ] Build Donate Pile view: members of a circle can see each other's `status = 'donate'` items
- [ ] Implement Zero-Waste Gifting: gift an item to a specific circle member; transfer ownership in DB
- [ ] Build Sustainability Score widget: "This group saved Xkg from landfill this month" (sum of gifted/donated item weights)
- [ ] Write Vitest unit tests for group invite token generation and validation
- [ ] Write Playwright E2E test: user A donates item → user B in same circle sees it in Donate Pile
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 3.1 PR**

---

### Milestone 3.2 — Professional Organizer Marketplace (Weeks 20–22)

- [ ] Add `organizer_profiles` table with bio, rate, availability; migrate
- [ ] Create `trpc.organizers` router: `apply`, `list`, `book`, `createPlan` procedures
- [ ] Build organizer application + approval flow (admin-gated)
- [ ] Implement inventory share link: generate read-only token granting organizer view of user's full inventory
- [ ] Build Reorganization Plan feature: organizer creates a structured plan using location data; user receives plan in-app
- [ ] Implement booking flow with marketplace commission hook (Stripe Connect)
- [ ] Write Vitest unit tests for share link token generation and expiry
- [ ] Write Playwright E2E test: user shares inventory → organizer views it via share link
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 3.2 PR**

---

### Milestone 3.3 — Visual Search & AR (Weeks 23–24)

- [ ] Build Visual Search: user photographs a physical object → Cloudinary visual similarity search against their inventory
- [ ] Create `trpc.items.visualSearch` procedure: upload probe image → return ranked inventory matches
- [ ] Build Visual Search UI: camera capture → result grid with similarity scores
- [ ] Implement AR X-Ray Vision (experimental): WebXR or device AR bridge stub — point camera at cupboard → digital overlay of contents
- [ ] Add feature flag for AR experiment (off by default, toggle in user settings)
- [ ] Write Vitest unit tests for visual search ranking logic
- [ ] Write Playwright E2E test: visual search returns at least one inventory match for a known item
- [ ] **Quality gate: `npm run lint && npm test && npm run e2e` all green — open Milestone 3.3 PR**

---

### V3 Exit Criteria

- [ ] ≥ 10 active community circles with ≥ 5 members each
- [ ] At least one item "gifted" per active circle per week
- [ ] Professional organizer marketplace live with ≥ 5 listed organizers

---

## Long-Tail Backlog

Not scheduled — informing architecture only. Pick up after V3.

- [ ] Replacement Suggestions via affiliate links ("You sold 10 toddler books — here are top-rated age-5 books")
- [ ] Donation Map showing nearest charity shops accepting specific categories
- [ ] Multi-home support (split custody households, grandparents' house)
- [ ] Seasonal rotation reminders (winter coats → storage nudge in April)
- [ ] NFC tag integration on physical bins — tap NFC tag to open digital cupboard contents
