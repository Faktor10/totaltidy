# TotalTidy

> Snap a photo. The app does the rest.

TotalTidy is a capture-first home inventory app for busy parents. Point your phone at the mess, rapid-fire snap photos, and TotalTidy handles background removal, AI labeling, and catalog generation — all asynchronously, with zero spinners.

See [vision.md](./vision.md) for the full product vision and
[TECHSTACK.md](./TECHSTACK.md) for the full stack manifest.

---

## Features

| Feature | Description |
|---|---|
| **Rapid-Fire Camera** | Zero-lag shutter — camera stays live after every shot |
| **Async Background Removal** | Cloudinary-powered — floor photos become studio-white product shots |
| **Quick-Tap Locations** | 3–5 tap-target bubbles sorted by frequency and recency |
| **Unsorted Inbox** | Capture now, assign later — badge nudge keeps the backlog visible |
| **AI Smart Labels** | Auto-identifies items via Cloudinary auto-tagging |
| **Clean Gallery** | Studio-white grid grouped by location |
| **Session Joy-Roll** | Summary card fires after every capture session |

---

## Repository layout

npm **workspaces** — plain `npm run <script> -w <package>`, no Turborepo/Nx.

```
apps/
  client/     @totaltidy/client   — React SPA (Vite + wouter)
  server/     @totaltidy/server   — Express + tRPC API
packages/
  db/         @totaltidy/db       — Drizzle schema, migrations, DB client
  shared/     @totaltidy/shared   — Zod schemas + framework-agnostic lib code
```

One root `package.json` owns the shared dependencies, one root `tsconfig.json`
typechecks the whole repo in a single pass, and one root `vitest.config.ts` runs
every workspace's tests.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database ([Neon](https://neon.tech), Railway, or local)
- [Cloudinary](https://cloudinary.com) account
- [Resend](https://resend.com) account (optional — for magic-link email)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL=
AUTH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_WEBHOOK_SECRET=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Optional (each degrades gracefully when unset): `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `AUTH_RESEND_KEY`, `SERVER_URL`, `CLIENT_URL`.

### 3. Set up Cloudinary

```bash
npm run cloudinary:setup
```

### 4. Run the dev servers

```bash
npm run dev
```

This starts the API on [http://localhost:3001](http://localhost:3001) and the
client on [http://localhost:3000](http://localhost:3000), with Vite proxying
`/api` and `/trpc` to the API. Migrations are applied automatically when the API
boots — in every environment — so there is no separate migration step.

Run them individually with `npm run dev:server` / `npm run dev:client`.

---

## Development

### Quality gate — all three must pass before merge

```bash
npm run lint   # Biome + tsc --noEmit
npm test       # Vitest unit tests
npm run e2e    # Playwright E2E
```

### Commands

```bash
npm run typecheck    # tsc --noEmit across the whole repo
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format all files
npm run test:watch   # Vitest watch mode
npm run e2e:ui       # Playwright UI mode
npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:migrate   # Apply migrations manually
npm run db:check     # Guard against orphaned/drifted migrations
npm run build        # Build the client for production
npm start            # Serve the API (and the built client) in production
```

Coding conventions are in [claude.md](./claude.md).

---

## Project Status

### Phase 1 — MVP "Snap-Snap-Done" (Weeks 1–8)

- [x] Milestone 1.1 — Foundation (auth, DB, tRPC, CI)
- [x] Milestone 1.2 — Capture Flow
- [ ] Milestone 1.3 — The Vanish Studio (background removal + gallery)
- [ ] Milestone 1.4 — Polish & Reward Loop (prediction engine, Joy-Roll, design tokens)

### Phase 2 — "The Lifecycle Economy" (Weeks 9–16)

Auto-listing to eBay/Vinted, outgrown alerts, premium tier with Stripe.

### Phase 3 — "The Hand-Me-Down Economy" (Weeks 17–24)

Private parent circles, professional organizer marketplace, AR X-Ray Vision.

---

## License

Private — all rights reserved.
