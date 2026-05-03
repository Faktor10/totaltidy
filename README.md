# TotalTidy

> Snap a photo. The app does the rest.

TotalTidy is a capture-first home inventory app built for busy parents. Point your phone at the mess, rapid-fire snap photos, and TotalTidy handles background removal, item identification, and catalog generation — all asynchronously, with zero spinners.

**The core idea:** reduce capture friction to near-zero. Your job is to snap. The app's job is everything else.

---

## What it does

| Feature | Description |
|---|---|
| **Rapid-Fire Camera** | Zero-lag shutter — camera stays live after every shot, no confirmation dialogs |
| **Async Background Removal** | Cloudinary-powered processing turns floor photos into clean studio-white product shots |
| **Quick-Tap Locations** | 3–5 tap-target bubbles ("Toy Trunk", "Narnia Cupboard") sorted by frequency and recency |
| **Unsorted Inbox** | Capture now, assign later — badge nudge keeps the backlog visible |
| **AI Smart Labels** | Auto-identifies items ("Red LEGO Truck", "Denim Jacket Size 4T") via Cloudinary auto-tagging |
| **Clean Gallery** | Studio-white grid of your fully cataloged items, grouped by location |
| **Session Joy-Roll** | Summary card with stats ("You cleared 24 items!") fires after every capture session |

---

## Tech stack

- **Next.js** (App Router) + TypeScript strict mode
- **tRPC v11** — all server communication, no REST endpoints
- **Drizzle ORM** + PostgreSQL (Neon serverless)
- **Cloudinary** — upload, background removal, auto-tagging, CDN
- **Auth.js v5** — magic link email (Resend) + Google OAuth
- **Vitest** (unit tests) + **Playwright** (E2E tests)
- **Biome** — lint + format

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database
- A [Cloudinary](https://cloudinary.com) account
- A [Resend](https://resend.com) account (for magic link email)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Key variables:

```
DATABASE_URL=               # Neon Postgres connection string
NEXTAUTH_SECRET=            # Random secret for Auth.js
AUTH_RESEND_KEY=            # Resend API key
AUTH_GOOGLE_ID=             # Google OAuth client ID
AUTH_GOOGLE_SECRET=         # Google OAuth client secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_WEBHOOK_SECRET=
```

### 3. Set up the database

```bash
npm run db:generate
npm run db:migrate
```

### 4. Set up Cloudinary

Create an unsigned upload preset scoped to `totaltidy/`:

```bash
npm run cloudinary:setup
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Development

### Quality gate

Every PR must pass all three checks before it can be opened:

```bash
npm run lint    # Biome — zero errors or warnings
npm test        # Vitest unit tests
npm run e2e     # Playwright E2E tests
```

### Useful commands

```bash
npm run lint:fix    # Auto-fix lint issues
npm run format      # Format all files
npm run test:watch  # Vitest in watch mode
npm run e2e:ui      # Playwright UI mode
npm run db:generate # Generate Drizzle migrations
npm run db:migrate  # Apply migrations to DB
```

### Code conventions

- tRPC routers are thin — all business logic lives in `server/services/`
- Every DB query **must** filter by `userId`
- No loading spinners for image processing — async shimmer only
- File naming: `kebab-case` files, `PascalCase` components, `camelCase` functions
- Cloudinary API secrets never reach the client — unsigned upload presets only

---

## Project status

### Phase 1 — MVP "Snap-Snap-Done" (Weeks 1–8)

- [x] Milestone 1.1 — Foundation (auth, DB, tRPC, CI)
- [x] Milestone 1.2 — Capture Flow _(in progress — batch assign + tests remaining)_
- [ ] Milestone 1.3 — The Vanish Studio (background removal + gallery)
- [ ] Milestone 1.4 — Polish & Reward Loop (prediction engine, Joy-Roll, design tokens)

### Phase 2 — "The Lifecycle Economy" (Weeks 9–16)

Auto-listing to eBay/Vinted, outgrown alerts, premium tier with Stripe.

### Phase 3 — "The Hand-Me-Down Economy" (Weeks 17–24)

Private parent circles, professional organizer marketplace, AR X-Ray Vision.

See [tasks.md](./tasks.md) for the full milestone breakdown.

---

## Vision

TotalTidy is built on five principles:

1. **Capture speed over perfection** — the camera never stops
2. **One-handed operation** — every interaction is reachable with a thumb
3. **No visible processing** — background work stays in the background
4. **Low cognitive load** — smart defaults mean most items need zero input
5. **Dopamine by design** — chores become a reward loop

See [vision.md](./vision.md) for the full product vision.

---

## License

Private — all rights reserved.
