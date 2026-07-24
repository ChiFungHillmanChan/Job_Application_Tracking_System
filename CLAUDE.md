# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout — read this first

The git root is this directory, but **the entire application lives in `job-tracker/`**. There is no root `package.json`; every npm command must be run from `job-tracker/`. The Vercel project's "Root Directory" is set to `job-tracker`.

**Stale docs warning.** The root `README.md`, `readme/structure.md`, and `directory_structure.txt` describe the **pre-migration** architecture (a separate Express backend on port 5001, `npm run dev:both`, `npm run install:all`, multer disk uploads, `backend/models/*`, `backend/controllers/*`). That backend was deleted in commit `d74aaa3`. Ignore those files when reasoning about the code; the authoritative description of the current design is `docs/superpowers/specs/2026-07-24-vercel-migration-design.md` and its plan (`docs/superpowers/plans/2026-07-24-vercel-migration.md`).

`job-tracker/backend/` still exists **on disk** but is untracked, gitignored, and excluded by `.vercelignore`. It holds leftover dev CV PDFs and logs. Do not edit it, import from it, or treat it as live code.

## Commands

All from `job-tracker/`:

```bash
npm run dev      # next dev — http://localhost:3000 (API is same-origin at /api)
npm run build    # next build — the primary correctness gate
npm run lint     # next lint (currently warnings-only; react-hooks/exhaustive-deps noise is pre-existing)
npm start        # next start (production)
```

**There is no test framework.** This codebase is a behavior-preserving port of an untested Express app; the agreed verification approach (see the plan doc) is `npm run build` passing plus curl smoke tests against `next dev`, then end-to-end checks against a Vercel preview URL. Do not claim a change is verified on the basis of a build alone if it touches runtime behavior — exercise the endpoint.

`npm run dev`, `build`, and `lint` all invoke the Workflow DevKit compiler first, which regenerates `src/app/.well-known/workflow/` (gitignored, do not hand-edit).

## Architecture

Single Next.js 15 App Router app (JavaScript, not TypeScript). `@/*` maps to `./src/*` (`jsconfig.json`).

- `src/app/api/**/route.js` — all ~45 HTTP endpoints. URLs and JSON shapes were frozen during the migration: success is `{ success: true, ... }`, error is `{ success: false, error: '<message>' }`. Changing either breaks the frontend clients in `src/lib/*Service.js`.
- `src/server/**` — server-only code (models, services, auth, Stripe, Blob). **Never import this from a client component.**
- `src/lib/**` — client-side: `api.js` (axios), per-domain service wrappers, hooks, theme utilities.
- `src/workflows/automation.js` — the durable auto-apply pipeline.

### Route handler contract

Wrap handlers in `withApi` from `@/server/http`. It calls `connectDB()` and maps thrown errors to JSON, replicating the old Express error middleware exactly (CastError→404, dup key 11000→400, ValidationError→400, JWT errors→401, `ApiError`→its status, else 500). Throw `new ApiError(status, message)` to short-circuit.

Two handlers deliberately opt out and must stay that way:
- `api/health/route.js` — must answer even when Mongo is unreachable.
- `api/subscription/webhook/route.js` — needs Stripe's **raw** body (`await request.text()`) for signature verification, and must return non-2xx when a handler fails so Stripe redelivers. Never "acknowledge" a failed DB write here.

### Auth

JWT + bcryptjs. `requireAuth(request)` (`@/server/auth`) returns the User document or throws `ApiError(401,…)`. Token comes from the `Authorization: Bearer` header, falling back to a **`?token=` query param** — that fallback is load-bearing for resume preview/download, which are consumed by `<iframe>`/`fetch` in `src/app/resume/[id]/page.jsx` and `src/lib/resumeService.js` where headers can't be set. The client stores the token in `localStorage` and attaches it via an axios interceptor in `src/lib/api.js`.

Tiers are `free` / `plus` / `pro` (User model enum). Gating helpers live in `src/server/entitlements.js` (`requirePremium`, `requireFeature`, `checkUsage`); `getUserUsage` there is still a **mock** returning fixed numbers.

### Mongoose on serverless

- `src/server/db.js` caches the connection on `globalThis` — always `await connectDB()` before any query (`withApi` does it for you).
- Every model ends with the `mongoose.models.X || mongoose.model('X', schema)` guard.
- Next bundles routes individually, so a model referenced only via `.populate()` must be imported for its registration side effect, e.g. `import '@/server/models/Resume';` in `api/jobs/route.js` — otherwise you get "Schema hasn't been registered for model Resume".

### Next.js 15 gotchas present in this code

- Route handler `params` is a Promise: `const { id } = await context.params`.
- `next.config.js` keeps `pdf-parse`, `pdfjs-dist`, and `xdg-app-paths` in `serverExternalPackages`. Removing any of them reintroduces a build/runtime crash — the reasons are documented inline in that file.

### File storage

Resumes go to Vercel Blob (`src/server/blob.js`), 5MB max, `.pdf`/`.doc`/`.docx`, stored under a UUID pathname. Blob URLs are never returned to the client; preview and download stream through authenticated route handlers.

### Job boards

`src/server/services/jobBoards/` is the single source of truth for job sources. Six adapters are registered in `index.js`: `reed`, `adzuna`, `jooble`, `arbeitnow`, `remotive`, `jsearch`. Both consumers go through it — `GET /api/job-finder/search` (manual UI) and `searchBoardsStep` in the automation workflow. The route no longer carries its own inline Reed client.

Adding a board means touching **five** places, and missing any one fails at runtime rather than at build:

1. A new adapter extending `baseAdapter`, registered in `index.js`.
2. `SavedJob.source` enum — a missing value makes Save silently fail validation.
3. `Job.source` enum — the import route copies `SavedJob.source` verbatim.
4. `SearchConfig.boards` enum — only names with a real adapter belong here.
5. A badge in `getSourceBadge` (`src/lib/jobFinderService.js`) — optional, there is a grey fallback.

Adapters declare `tier` in their constructor meta; `resolveBoards({ requested, tier })` drops boards that are unconfigured, unknown, or above the caller's plan, and returns the reasons. `jsearch` is `tier: 'pro'` because it bills per request. `GET /api/job-finder/boards` exposes the catalog so no frontend hardcodes a board list.

Normalization lives in `normalize.js` (salary/currency/period/date/HTML, all pure) and `dedupe.js` (cross-board duplicate collapsing, deliberately conservative — see the header comment). Both are import-free so they can be unit-tested with plain `node --input-type=module`; there is still no test framework.

**Board quirks confirmed against the live APIs — do not "fix" these by trusting the vendor docs:**
- Arbeitnow ignores `search=` and `remote=` entirely, but honours `visa_sponsorship=true`; its responses omit the `visa_sponsorship` field, so the flag is inferred from the request.
- Remotive ignores `search=` and `limit=`; it returns one fixed public feed (~35 jobs). The whole feed is cached and filtered locally.
- Both boards' job-type labels are ATS seniority taxonomies (`'executive'`, `'berufserfahren'`), not contract types. Use `matchesJobTypes`, which treats an unrecognizable label as "no information"; naive matching rejected ~7 of every 8 jobs.
- **Adzuna `page` is a PATH segment** (`/jobs/gb/search/1`). Sending it *also* as a query parameter returns 400 on every request. There is no `content_type` query parameter either — the documented one is `content-type`, and the `Accept` header is what actually selects JSON (Adzuna defaults to JSONP without it).
- **Adzuna job-type flags are two mutually exclusive pairs**: `full_time`/`part_time` and `permanent`/`contract`. Sending both halves of either pair is a 400, not an empty result. Since the search UI ticks every type by default, "all selected" must translate to *no* flags — see `buildJobTypeFlags`.
- **Jooble keys are region-scoped** and resolve bare city names within that region first, silently. A US-region key searching `London` returns London, **Kentucky** (3 hits) instead of London, UK (183). `qualifyLocation` appends the country name from `filters.country` to disambiguate.

### Job board request budgets

`quota.js` + the `BoardUsage` model cap how many upstream calls each board may make, because every free tier is metered and **none of these providers publish an authoritative limit** — the numbers in `DEFAULT_QUOTAS` are our own conservative spending budget, not a mirror of the providers' real quotas. Do not present them as vendor limits.

Two independent brakes:
1. **Local budget.** Calls are *reserved atomically before* the request (`reserve()`), so concurrent searches cannot collectively overshoot — verified: 15 parallel searches against a budget of 5 yielded exactly 5×200 and 10×429, ledger at 5/5. `settle()` refunds the difference when a search costs less than estimated (a cached Remotive hit spends nothing; Arbeitnow reserves 3 pages but spends 1 under the visa filter).
2. **Upstream 429.** Authoritative — parks the board until `Retry-After` regardless of remaining budget.

Adapters declare cost via `estimateCalls(filters)` and report actuals as `upstreamCalls` in their search result. Override any limit with `JOB_BOARD_QUOTA_<BOARD>_<DAY|MONTH>`; `0` disables a board's calls.

Exhaustion is **not** an outage and must not be reported as one: the search route returns `429 QUOTA_EXCEEDED` with `availableAt`, `retryAfterSeconds` and a `Retry-After` header. Partial exhaustion still returns results, listing skipped boards in `data.quotaBlocked`.

### Automation (cron + Workflow DevKit)

`vercel.json` schedules `0 */6 * * *` → `GET /api/cron/automation`, authenticated by `Authorization: Bearer ${CRON_SECRET}` (the handler 401s outright if `CRON_SECRET` is unset). That route only fans out: for each due `SearchConfig` it creates an `AutomationRun` and calls `start(userAutomationWorkflow, …)`, then returns. `POST /api/auto-apply/run` starts the same workflow manually.

`src/workflows/automation.js` uses the `'use workflow'` / `'use step'` directives. **The workflow function runs in a sandbox with no Node access** — no mongoose, no fetch, no fs. Only step functions may touch the DB/OpenAI/job boards, and every value crossing the workflow↔step boundary must be plain and serializable: never a Mongoose document, ObjectId, or class instance. Steps build explicit plain objects field-by-field. AI scoring is capped at `MAX_JOBS_PER_RUN = 30` per run for cost.

### AI prompts

`src/server/prompts/index.js` is **auto-generated** from the sibling `*.txt` files and exports them as JS string constants. They are bundled rather than read with `fs` because the WDK step runtime's bundle doesn't receive the `.txt` files on Vercel. If you edit a prompt `.txt`, regenerate `index.js` — do not add `fs.readFileSync` back.

OpenAI access goes through the lazy singleton in `src/server/services/openai.js` (gpt-4.1, Responses API). Stripe likewise uses a lazy `getStripe()` in `src/server/stripe.js` so `next build` doesn't crash when keys are absent.

### Client API layer

`src/lib/api.js` is a ~1700-line axios module: `baseURL` is `NEXT_PUBLIC_API_URL || '/api'`, a request interceptor injects the Bearer token, and a response interceptor clears the token and redirects to `/auth/login` on 401 (except on login attempts). Everything after line ~90 is a **development-only mock layer** gated on `process.env.NODE_ENV === 'development'` that fakes users/jobs/resumes in localStorage. Keep that gate intact; when debugging "the API returns odd data in dev", suspect the mock layer first.

## Environment variables

Set on the Vercel project; locally in `job-tracker/.env.local` (all `.env*` are gitignored and excluded from Vercel uploads).

Required: `MONGODB_URI` (Atlas), `JWT_SECRET`, `JWT_EXPIRE`, `BLOB_READ_WRITE_TOKEN` (auto-provisioned), `CRON_SECRET`, `FRONTEND_URL`.
Feature-gated: `OPENAI_API_KEY` (CV analysis, matching, cover letters); `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`FROM_NAME`/`FROM_EMAIL` (password reset); `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_{PLUS,PRO}_{MONTHLY,ANNUAL}_PRICE_ID` (billing, test mode).

Job board keys — each one independently optional; a board with no key is skipped, not fatal:

| Board | Env vars | Cost |
| --- | --- | --- |
| `reed` | `REED_API_KEY` | Free, UK only |
| `adzuna` | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` (`ADZUNA_API_ID` / `ADZUNA_API_KEY` accepted as aliases) | Free, ~1k calls/month |
| `jooble` | `JOOBLE_API_KEY` (`JOOBLE_REST_API_KEY` accepted as an alias) | Free key on request |
| `arbeitnow` | *(none)* | Free, no key |
| `remotive` | *(none)* | Free, no key |
| `jsearch` | `JSEARCH_API_KEY` **and** `ENABLE_PAID_JOB_BOARDS=true` | **Paid** — RapidAPI, 200 req/mo free then $25/mo |

Both spellings are accepted for Adzuna/Jooble because deployed environments were populated with the `_API_` variants. Empty strings count as unset, so a blank placeholder cannot shadow a real key.

`ENABLE_PAID_JOB_BOARDS` is the master cost switch. Any adapter declaring `paid: true` reports itself unconfigured unless it is set, so a key alone can never start billing — deliberate, because keys get added for unrelated reasons. Subscription tier does **not** override it: a `pro` user with a valid key still gets `409 PAID_BOARDS_DISABLED`. `GET /api/job-finder/boards` returns `allFree` so the UI can state whether anything currently bills.

Note the price-ID names: the code reads `STRIPE_PLUS_*` / `STRIPE_PRO_*`. The old `STRIPE_PREMIUM_*` / `STRIPE_ENTERPRISE_*` names in the root README are dead.
