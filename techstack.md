# TotalTidy — Stack Manifest

v0.3 — Last updated: 2026-09-02

Aligned to the shared house stack described in [TECHSTACK.md](./TECHSTACK.md).

## Runtime & Language

| | |
|---|---|
| Language | TypeScript 5 (strict, ESM) |
| Runtime | Node.js v20+ |
| Package manager | npm workspaces (`apps/*`, `packages/*`) |
| Linter / formatter | Biome + `tsc --noEmit` as the typecheck gate |
| Server dev runner | tsx (no build step for the API) |

## Monorepo shape

```
apps/client     @totaltidy/client   React SPA (Vite)
apps/server     @totaltidy/server   Express + tRPC API
packages/db     @totaltidy/db       Drizzle schema, migrations, DB client
packages/shared @totaltidy/shared   Zod schemas + framework-agnostic lib code
```

One root `package.json`, one root `tsconfig.json`, one root `vitest.config.ts`.

## Frontend

| | |
|---|---|
| Framework | React 19 SPA via Vite |
| Routing | wouter |
| Component approach | shadcn/ui-style — Radix primitives + Tailwind + `cva` |
| Styling | Tailwind CSS v4 (CSS-first) alongside existing CSS modules |
| State | TanStack Query v5 via the tRPC client |
| Testing | Vitest + @testing-library/react (unit); Playwright (e2e) |

## Backend

| | |
|---|---|
| HTTP layer | Express 5 |
| API layer | tRPC v11 mounted at `/trpc` |
| Type safety | Zod v4 — input schemas shared via `@totaltidy/shared/schemas/*` |
| Serialization | superjson |
| Business logic | Plain functions in `apps/server/src/services/*`; routers stay thin |
| Background jobs | N/A |

## Database & Storage

| | |
|---|---|
| Database | PostgreSQL (Neon / Railway / local) via the `postgres-js` driver |
| ORM | Drizzle ORM + drizzle-kit |
| Migrations | Checked in under `packages/db/drizzle/`, applied on server startup |
| Storage | Cloudinary (upload, background removal, auto-tagging, CDN) |

## Auth

| | |
|---|---|
| Strategy | Server-issued session cookie (HMAC-signed, backed by the `sessions` table) |
| OAuth | Google via Passport in stateless mode (`session: false`) |
| Magic link | Single-use hashed tokens emailed via Resend |
| Authorization | `protectedProcedure` injects `userId` into tRPC context; RBAC not implemented |

Passport only performs the OAuth handshake — the server mints its own session
afterward, so there is one session mechanism for every sign-in path.

## Infrastructure

| | |
|---|---|
| Hosting | Railway (`railway.json`); also runnable on Replit (`.replit`) |
| Production topology | The API serves the built client, so both are one origin |
| CI/CD | GitHub Actions — typecheck/lint → unit tests (real Postgres service container) → e2e |

## AI / Agentic Layer

Not yet implemented. New agentic/orchestration code is to be written against
`effect@rc` (typed errors, structured concurrency, `Schedule`-based retry,
`Layer`-based DI) rather than hand-rolled retry/timeout/tool-calling logic;
existing services migrate opportunistically, not wholesale. tRPC routers remain
the boundary — a handler runs an `Effect` pipeline internally and returns a
plain value or throws a `TRPCError` at the edge.

---

## Decision Log

| Decision | Chosen | Alternatives | Reason |
|---|---|---|---|
| App shape | Vite SPA + Express API | Next.js App Router | Aligns with the house stack; one API surface, no RSC/route-handler split |
| Package manager | npm workspaces | pnpm, Turborepo | Plain `npm run -w`; no extra tooling to learn |
| Routing | wouter | React Router | Smaller, sufficient for this route table |
| ORM | Drizzle | Prisma | Type safety without codegen |
| Auth | Session cookie + Passport | Auth.js v5 | One session mechanism, no framework coupling |
| API layer | tRPC v11 | REST | E2E type safety + React Query caching |
| Postgres driver | postgres-js | Neon serverless HTTP | A long-lived server does not need the serverless HTTP driver |
| Storage | Cloudinary | Uploadthing, S3+Lambda | Background removal built-in |
| Linter | Biome | ESLint + Prettier | Single tool, zero config |
