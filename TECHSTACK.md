# Pantler Tech Stack

Reference doc for what this monorepo is built with and how it's wired together.
Written to be copy/paste-able when aligning other projects (older Pantler
branches, sibling apps) to this one.

## Monorepo shape

npm **workspaces** (no Turborepo/Nx — plain `npm run <script> -w <package>`).

```
apps/
  client/     @pantler/client   — React SPA (Vite)
  server/     @pantler/server   — Express + tRPC API
packages/
  db/         @pantler/db       — Drizzle schema, migrations, DB client
  shared/     @pantler/shared   — Zod schemas + framework-agnostic lib code shared by client & server
```

- Single root `package.json` owns all `dependencies`/`devDependencies` — workspace
  packages declare only what's unique to them (e.g. `@pantler/server` adds
  `passport`) and reference siblings as `"@pantler/shared": "*"`.
- Single root `tsconfig.json` typechecks the whole repo in one pass
  (`npm run typecheck`) via path aliases:
  - `@/*` → `apps/client/src/*`
  - `@pantler/shared/*` → `packages/shared/src/*`
  - `@pantler/db`, `@pantler/db/schema`, `@pantler/db/migrate` → `packages/db/src/*`
- One root `vitest.config.ts` runs tests across every workspace
  (`apps/**/*.spec.ts`, `apps/client/**/*.test.tsx`, `packages/*/src/**/*.spec.ts`).
- `docs/` holds product/spec docs (`VISION.md`, `ROADMAP.md`, `Feature_list.md`,
  `CLAUDE.md`) plus `docs/ARCHIVE/` for superseded planning docs — spec-driven
  development, not long-lived design docs scattered in code.

## Language & tooling

- **TypeScript** everywhere, `strict: true`, ESM (`"type": "module"` in every
  `package.json`), target `ES2022`, `moduleResolution: "Bundler"`.
- **tsx** runs server TypeScript directly in dev — no separate build step for
  the API.
- **Vitest** (+ `jsdom`, Testing Library) for unit/integration tests; Node's
  own type stripping isn't relied on — `tsx`/`vite` handle transpilation.
- No ESLint/Prettier configured yet — `tsc --noEmit` is the lint gate
  (`npm run lint` === `npm run typecheck`).
- CI (GitHub Actions): typecheck job + a test job with a real ephemeral
  Postgres 16 service container so DB-dependent integration specs
  (`describe.skipIf(!hasDatabase)`) actually run, not silently skip.

## Backend (`apps/server`)

- **Express** as the HTTP layer, **tRPC v11** as the actual API (routers live
  in `apps/server/src/trpc/routers/*.router.ts`, one per domain: auth, family,
  ingredients, catalog, recipes, shopping, images, settings, admin).
- **Zod** for input validation on every tRPC procedure (schemas shared with
  the client via `@pantler/shared/schemas/*`).
- **Drizzle ORM** over **PostgreSQL** (`pg` driver) — schema and migrations
  live in `@pantler/db`; migrations run automatically on server startup.
- **Session-based auth** (`express-session`-style signed cookie, see
  `apps/server/src/lib/session.ts`), not JWT. **Passport.js** for Google
  OAuth in stateless mode (`session: false`) — Passport only does the OAuth
  handshake; the server mints its own session token afterward, same as the
  password flow.
- `apps/server/src/services/*` holds business logic as plain functions/classes
  (catalog import + normalization + dedup, OCR, OpenFoodFacts /
  Spoonacular integrations, recipes, shopping, email) — routers stay thin and
  call into services.
- **bcrypt** for password hashing.
- Optional integrations degrade gracefully when unset (checked via
  `.env.example`): `ANTHROPIC_API_KEY` (OCR for expiry dates), `CLOUDINARY_*`
  (image upload), `RESEND_API_KEY` (email), `SPOONACULAR_API_KEY` (recipe
  import) — each has a stub/no-op path rather than a hard crash.

## Frontend (`apps/client`)

- **React 18** SPA via **Vite**, served on a different port than the API in
  dev, with Vite proxying `/api` and `/trpc` to the backend.
- **wouter** for routing (not React Router).
- **tRPC client + TanStack Query** for all data fetching/caching — no REST
  fetch calls, no separate global data store for server state.
- **Tailwind CSS** + `class-variance-authority` + `tailwind-merge` +
  Radix primitives (`@radix-ui/react-*`) — shadcn/ui-style component
  approach (`apps/client/src/components/ui`).
- **react-hook-form** for forms, **lucide-react** / **@heroicons/react** for
  icons.
- **superjson** as the tRPC transformer (so `Date`, `Map`, etc. survive the
  wire).

## Shared code (`packages/shared`)

- Pure Zod schemas (`src/schemas/*`) and framework-agnostic helpers
  (`src/lib/*`), consumed by both client and server through subpath exports
  (`@pantler/shared/schemas/*`, `@pantler/shared/lib/*`) — no barrel file, so
  each import pulls in only what it needs.

## Data layer (`packages/db`)

- **Drizzle ORM** schema definitions (`src/tables/*`), a single `schema.ts`
  barrel, and a `migrate.ts` entrypoint the server calls on boot.
- **drizzle-kit** for generating SQL migrations (`db:generate`) from schema
  changes — migrations are checked in under `packages/db/drizzle/`.
- A `scripts/check-migrations.mjs` CI guard catches orphaned migration files
  or a journal that's drifted from what's on disk.

## AI / agentic direction

Pantler's roadmap (see `docs/VISION.md`, `docs/ROADMAP.md`) is explicitly
**agentic**: dynamic recipe generation, expiry-driven proactive suggestions,
and eventually autonomous actions (add-to-shopping-list, ordering) triggered
by pantry state rather than direct user requests. Today AI touches the OCR
path (`ANTHROPIC_API_KEY`, optional); the event-driven orchestration layer
(cron/webhook triggers → LLM + tool calling → backend action layer) is future
work, not yet implemented.

### Effect (`effect@rc`)

We're incorporating [**Effect**](https://effect.website) (currently on its
`rc` — release candidate — prerelease line) as the foundation for that
agentic layer going forward: "TypeScript for the AI age" — a runtime for
composing typed, resource-safe, cancellable, testable effectful programs,
which is exactly the shape of an LLM-orchestration pipeline (tool calls,
retries, timeouts, external API failures, partial results).

Why Effect specifically for this codebase:

- **Typed errors as values**, not throw/catch — a tool call, an LLM call, and
  a DB write can each fail differently, and the type system tracks which
  errors a pipeline can actually produce instead of `unknown` in a catch
  block. This matches the tRPC-procedure style already in use (explicit,
  typed inputs/outputs) rather than fighting it.
- **Structured concurrency & cancellation** built in — fan-out/fan-in over
  multiple tool calls, timeouts on slow LLM/API responses, and automatic
  cleanup (interrupting an in-flight OCR/LLM call when a request is aborted)
  without hand-rolled `AbortController` plumbing.
- **Built-in retry/backoff/circuit-breaking primitives** (`Schedule`) — used
  for the existing flaky-external-API surface (Spoonacular, OpenFoodFacts,
  OCR providers) instead of ad hoc retry loops, and for future LLM tool-call
  retries.
- **Dependency injection via `Layer`/`Context`** — services like the catalog
  importer, OCR client, or a future LLM client become swappable, testable
  effects instead of directly-imported singletons, which plays well with the
  existing `services/*` pattern and its `__fixtures__`-based test setup.
- **Composable pipelines** are a natural fit for the agent loop described in
  the roadmap: event source → LLM planning step → tool calls → backend
  action, each stage a typed `Effect` that can be tested, retried, and
  observed independently.

Adoption is incremental, not a rewrite:

1. New agentic/orchestration code (the future event-driven layer, LLM tool
   calling) is written in Effect from the start.
2. Existing services are **not** being force-migrated; a service only moves
   to Effect when it's touched for other reasons (e.g. wrapping an external
   API integration in `Schedule`-based retry) or when it becomes part of an
   agentic pipeline.
3. tRPC routers stay the boundary — a router handler runs an `Effect`
   pipeline internally (`Effect.runPromise`) and returns a plain value/throws
   a `TRPCError` at the edge, so the tRPC/Zod contract with the client is
   unaffected by what's happening underneath.
4. Being on `effect@rc` means pinning an exact prerelease version (not `^`)
   and expecting API surface to shift until Effect cuts a stable major —
   bump deliberately, re-run the full test suite, don't auto-upgrade.

## Deployment

- **Railway** (`railway.json`) for hosting; also runnable on **Replit**
  (`.replit`, `replit.md`) with a Replit-managed Postgres instance in that
  environment.
- Migrations are applied automatically on server startup in every
  environment — there's no separate manual migration step for deploys.

## Porting checklist for older projects

When aligning an older project to this stack:

- [ ] npm workspaces with `apps/*` + `packages/*`, one root `package.json`
      for shared deps, one root `tsconfig.json`, one root `vitest.config.ts`.
- [ ] tRPC v11 + Zod end-to-end instead of hand-rolled REST + ad hoc
      validation.
- [ ] Drizzle ORM + drizzle-kit against Postgres instead of a raw SQL layer
      or a heavier ORM.
- [ ] Session-cookie auth (+ stateless Passport for OAuth) instead of JWT.
- [ ] TanStack Query + tRPC client on the frontend; wouter over React Router
      unless there's a specific reason not to.
- [ ] shadcn/ui-style components: Radix primitives + Tailwind +
      `class-variance-authority`, not a heavier component library.
- [ ] `tsc --noEmit` as the lint/typecheck gate; add ESLint only if the
      project actually needs rules `tsc` can't express.
- [ ] CI: typecheck job + test job with a real service-container database,
      not mocked-only DB tests.
- [ ] New agentic/AI-orchestration code written against `effect@rc` rather
      than hand-rolled retry/timeout/tool-calling logic; existing code
      migrated opportunistically, not wholesale.
