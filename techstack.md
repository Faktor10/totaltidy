# TotalTidy — Stack Manifest

v0.2 — Last updated: 2026-06-28

## Runtime & Language

| | |
|---|---|
| Language | TypeScript 5 (strict) |
| Runtime | Node.js v24 (local, NVM), v20 (CI) |
| Package manager | pnpm v10 |
| Linter / formatter | Biome (replaces ESLint + Prettier) |

## Frontend

| | |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Component library | shadcn/ui |
| Styling | Tailwind CSS v4 (CSS-first config via globals.css) |
| Forms | TanStack Form |
| State | TanStack Query v5 (client); RSC (server) |
| Animations | Framer Motion |
| Testing | Vitest + @testing-library/react (unit); Playwright (e2e) |

## Backend

| | |
|---|---|
| API layer | tRPC v11 + React Query |
| Type safety | Zod v4 |
| Serialization | superjson |
| Background jobs | N/A |
| Message broker | N/A |
| Realtime | N/A |

## Database & Storage

| | |
|---|---|
| Database | PostgreSQL via Neon (serverless prod / local postgres dev) |
| ORM | Drizzle ORM + drizzle-kit |
| Storage | Cloudinary (upload, background removal, CDN) |
| Cache | N/A |
| Search | N/A |

## Auth

| | |
|---|---|
| Provider | Auth.js v5 (next-auth beta) + Drizzle adapter |
| OAuth | Google |
| Magic link | Resend provider (via Auth.js) |
| Strategy | JWT; userId injected into tRPC context |
| Authorization | Session auth only — RBAC not yet implemented |

## Email

| | |
|---|---|
| Transactional | Resend (also handles magic link auth) |
| Templating | N/A — Resend default templates |

## Infrastructure

| | |
|---|---|
| Hosting | Vercel (planned) |
| CI/CD | GitHub Actions (lint → unit → e2e on PR and main push) |
| DNS / CDN | N/A |
| Monitoring | N/A |
| Analytics | N/A |

## Payments

N/A — planned for Phase 2 (Stripe, subscription or usage-based)

## AI / Agentic Layer

N/A — planned for Phase 2. Natural harness: Vercel AI SDK. Observability: Langfuse before shipping any agent feature to real users.

---

## Decision Log

| Decision | Chosen | Alternatives | Reason |
|---|---|---|---|
| ORM | Drizzle | Prisma | Type safety without codegen |
| Auth | Auth.js v5 | Clerk, Better Auth | No managed-infra cost; Drizzle adapter |
| API layer | tRPC v11 | REST, Server Actions | E2E type safety + React Query caching |
| Database | Neon (Postgres) | Supabase, Railway | Serverless branching, free tier |
| Storage | Cloudinary | Uploadthing, S3+Lambda | Background removal built-in |
| Linter | Biome | ESLint + Prettier | Single tool, zero config |

### tRPC vs Server Actions

Keep tRPC. Migration cost — every query and mutation touched, React Query caching strategy rethought — is not justified at this stage. Server Actions are acceptable for new simple write-only mutations with no cache invalidation needs. Mixing paradigms in one codebase is harder to reason about than either alone; default to tRPC for consistency.

### AI / Agentic Layer

Build nothing speculatively. When the product needs it: start with a single structured `generateObject` call validated with Zod (no tools, no loops) — this covers ~80% of AI features. Escalate to tool use only when the LLM needs live data. Escalate to multi-step agents only when the task is genuinely too complex to decompose into a fixed sequence. Every agent tool call must be scoped to the authenticated user, logged, and have a 30-second timeout.
