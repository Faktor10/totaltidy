# TotalTidy

> Snap a photo. The app does the rest.

TotalTidy is a capture-first home inventory app for busy parents. Point your phone at the mess, rapid-fire snap photos, and TotalTidy handles background removal, AI labeling, and catalog generation — all asynchronously, with zero spinners.

See [vision.md](./vision.md) for the full product vision and [techstack.md](./techstack.md) for the full stack manifest.

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

## Getting Started

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) Postgres database
- [Cloudinary](https://cloudinary.com) account
- [Resend](https://resend.com) account (for magic link email)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Required variables:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AUTH_RESEND_KEY=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_WEBHOOK_SECRET=
```

### 3. Set up the database

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Set up Cloudinary

```bash
pnpm cloudinary:setup
```

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Development

### Quality gate — all three must pass before merge

```bash
pnpm lint      # Biome
pnpm test      # Vitest unit tests
pnpm e2e       # Playwright E2E
```

### Commands

```bash
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format all files
pnpm test:watch   # Vitest watch mode
pnpm e2e:ui       # Playwright UI mode
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply migrations
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
