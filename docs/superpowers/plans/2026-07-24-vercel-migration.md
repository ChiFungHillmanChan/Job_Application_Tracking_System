# Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the Express backend into the Next.js app as App Router route handlers and deploy the whole system to Vercel (MongoDB Atlas, Vercel Blob, Vercel Cron + Workflow DevKit, Stripe test mode).

**Architecture:** All Express controllers/services move to `src/server/` (converted CommonJS→ESM) and are exposed via `src/app/api/**/route.js` handlers with identical URLs and response shapes (`{ success, data|error }`). The 6-hourly automation becomes a Vercel Cron endpoint that starts one Workflow DevKit run per user. Files move from disk to Vercel Blob.

**Tech Stack:** Next.js 15.3.2 (App Router, JavaScript), Mongoose 8, `workflow` (WDK), `@vercel/blob`, Stripe SDK, OpenAI SDK (Responses API, gpt-4.1), nodemailer, pdf-parse v2, mammoth.

**Verification approach note:** This is a behavior-preserving port of an existing untested codebase. Instead of unit-TDD per step, each task gates on `npm run build` passing plus curl smoke tests against `next dev`, and the final tasks gate on end-to-end verification against the deployed Vercel preview/production URL. (Deviation from strict TDD agreed for this migration.)

## Global Constraints

- API URLs and JSON response shapes must not change: success → `{ success: true, ... }`, error → `{ success: false, error: '<message>' }`.
- All server code is ESM (`import`/`export`); models need the `mongoose.models.X || mongoose.model('X', schema)` guard.
- Next.js 15: route handler `params` is a **Promise** — always `const { id } = await context.params`.
- Auth: JWT Bearer from `Authorization` header, fallback `?token=` query param (iframe preview). Cookie fallback is dropped (was dead code — no cookie-parser was mounted).
- Never log or echo secret values; env values are piped into `vercel env add` from files.
- Working dir for the app is `job-tracker/`; the Vercel project root directory must be `job-tracker`.
- Every commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure (target)

```
job-tracker/
  next.config.js                 # withWorkflow, outputFileTracingIncludes, NO rewrite
  vercel.json                    # cron definition
  package.json                   # merged deps, backend scripts removed
  src/
    server/
      db.js                      # cached mongoose connection
      logger.js                  # console-only logger (winston removed)
      http.js                    # ApiError, withApi wrapper, error→JSON mapping
      auth.js                    # requireAuth(request), requireTier(user, ...tiers)
      entitlements.js            # FEATURE_TIERS/USAGE_LIMITS/TIER_LEVELS, requireFeature
      blob.js                    # uploadResumeBlob, fetchResumeBuffer, deleteResumeBlob
      models/                    # 8 models (CustomTheme dropped)
      utils/                     # tokenManager.js, sendEmail.js, loadPrompt.js
      services/                  # openai.js, ai*.js, cvParser.js, jobBoards/
      prompts/                   # cv-analysis.txt, job-matching.txt, cover-letter.txt, application-answers.txt
    workflows/automation.js      # userAutomationWorkflow ("use workflow") + steps
    app/api/
      health/route.js
      auth/{register,login,logout,me,forgotpassword,updateprofile,password,preferences}/route.js
      auth/resetpassword/[resettoken]/route.js
      jobs/route.js  jobs/{stats,recent}/route.js  jobs/[id]/route.js
      resumes/route.js  resumes/[id]/route.js  resumes/[id]/{default,download,preview}/route.js
      job-finder/{search,stats}/route.js  job-finder/saved/route.js  job-finder/saved/[id]/route.js
      job-finder/import/[savedJobId]/route.js
      profile/route.js  profile/analyze/route.js
      auto-apply/{stats,config,run,queue,history,generate-answers}/route.js
      auto-apply/queue/[id]/review/route.js  auto-apply/queue/bulk-approve/route.js
      subscription/{plans,webhook,current,usage,billing-history,create-checkout-session,upgrade,cancel}/route.js
      cron/automation/route.js
```

Deleted at cleanup: `backend/` (entire dir), `src/app/api/resumes/[id]/downlaod/`, empty auth route placeholders are replaced by real handlers.

---

### Task 1: Dependencies & preflight

**Files:** Modify `job-tracker/package.json`; check `.gitignore`.

- [ ] Verify `.env` files are git-ignored: `git check-ignore job-tracker/.env job-tracker/.env.local` — if not ignored, add `**/.env*` to `.gitignore` (except `.env.example`) BEFORE anything else.
- [ ] In `job-tracker/package.json`: remove `express`; add deps: `bcryptjs`, `jsonwebtoken`, `nodemailer`, `openai`, `stripe`, `pdf-parse@^2.4.5`, `mammoth`, `uuid`, `@vercel/blob`, `workflow`. Keep `mongoose` (already present). Remove scripts `server`, `dev:both`, `dev:full`, `install:all`, `check:health`.
- [ ] `npm install` in `job-tracker/` — expect success.
- [ ] Commit: `CHORE: merge backend deps into Next.js app for Vercel migration`

### Task 2: Server foundation (db, logger, http, auth, utils)

**Files:** Create `src/server/db.js`, `src/server/logger.js`, `src/server/http.js`, `src/server/auth.js`, `src/server/utils/tokenManager.js`, `src/server/utils/sendEmail.js`.

**Produces (used by every later task):**
- `connectDB(): Promise<mongoose>` — cached.
- `class ApiError extends Error { constructor(statusCode, message) }`
- `withApi(handler): (request, context) => Response` — calls `connectDB()`, runs handler, maps thrown errors to `{ success:false, error }` JSON exactly replicating `backend/middleware/error.js` (CastError→404 'Resource not found'; code 11000→400 duplicate-field message; ValidationError→400 joined messages; JsonWebTokenError→401; TokenExpiredError→401; ApiError→its status; else 500).
- `requireAuth(request): Promise<UserDoc>` — port of `backend/middleware/auth.js` `protect` (Bearer header, then `?token=`; throws `ApiError(401, 'Not authorized, no token' | 'Not authorized, invalid token' | 'User not found')`; returns `User.findById(decoded.id).select('-password')`).
- `requireTier(user, ...tiers)` — port of `authorize` (throws `ApiError(403, ...)`).
- `generateToken(user)`, `generateResetPasswordToken()`, `verifyToken(token)` — ESM port of `backend/utils/tokenManager.js` (uses node:crypto).
- `sendEmail({ email, subject, message })` — ESM port of `backend/utils/sendEmail.js`, same SMTP env vars; drop the per-send `transporter.verify()` call.
- `logger` with `.info/.warn/.error` → console methods (winston file transports removed).

- [ ] Write `db.js`:

```js
import mongoose from 'mongoose';

const cached = globalThis._mongooseCache ?? (globalThis._mongooseCache = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

- [ ] Write `http.js` (`ApiError`, `jsonError(err)`, `withApi`) with the exact error mapping above.
- [ ] Write `auth.js`, `logger.js`, port the two utils to ESM.
- [ ] `npm run build` passes (nothing imports these yet, but syntax is checked).
- [ ] Commit: `FEAT: add serverless foundation (db, http, auth, logger, utils)`

### Task 3: Port models, services, prompts, entitlements, blob helper

**Files:** Create `src/server/models/*` (User, Job, Resume, SavedJob, SearchConfig, UserProfile, PreparedApplication, AutomationRun), `src/server/services/*` (openai, aiProfileAnalyzer, aiJobMatcher, aiCoverLetterWriter, aiApplicationAnswerer, cvParser, jobBoards/{index,baseAdapter,reedAdapter,adzunaAdapter}), `src/server/utils/loadPrompt.js`, `src/server/prompts/*.txt` (copied from `job-tracker/prompts/`), `src/server/entitlements.js`, `src/server/blob.js`. Modify `src/server/models/Resume.js` (add `blobUrl` field).

**Rules:** direct CommonJS→ESM conversion, logic unchanged, except:
1. Every model ends with `export default mongoose.models.X || mongoose.model('X', schema);`
2. `loadPrompt.js` reads `path.join(process.cwd(), 'src/server/prompts', filename)` (in-memory cache kept).
3. `cvParser.js`: replace `extractTextFromFile(filePath)` with `extractTextFromBuffer(buffer, filenameOrExt)` — same pdf-parse/mammoth/txt branches, pdf-parse keeps its current call shape but fed the buffer, mammoth uses `{ buffer }`. Keep the exported name `extractTextFromFile` as an alias if other services import it, or update the single caller (`profileController` port) to the new name.
4. `entitlements.js`: port `backend/middleware/premiumRequired.js` maps and logic as plain functions: `requireFeature(user, feature)` throws `ApiError(403, <same message>)`; keep the mock `getUserUsage` behavior as-is.
5. `blob.js`:

```js
import { put, del } from '@vercel/blob';

export async function uploadResumeBlob(pathname, file, contentType) {
  return put(pathname, file, { access: 'public', contentType, addRandomSuffix: false });
}
export async function fetchResumeBuffer(blobUrl) {
  const res = await fetch(blobUrl);
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
export async function deleteResumeBlob(blobUrl) { await del(blobUrl); }
```

(Blob pathnames are `resumes/<uuid><ext>` — unguessable; URLs are never sent to the client, only streamed through authenticated routes.)

- [ ] Port all files per the rules; adzuna/reed adapters unchanged (env names `ADZUNA_APP_ID`/`ADZUNA_APP_KEY`/`REED_API_KEY`).
- [ ] `npm run build` passes.
- [ ] Commit: `FEAT: port models, AI/job-board services, prompts, entitlements, blob helper`

### Task 4: Auth routes (10 endpoints)

**Files:** Create route.js under `src/app/api/auth/...` per File Structure; delete empty placeholders `src/app/api/auth/{login,register}/route.js` contents (replaced by real handlers).

**Port source:** `backend/controllers/authController.js` + `backend/routes/auth.js`.

**Handler pattern (applies to every domain task; shown once in full):**

```js
// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { withApi } from '@/server/http';
import User from '@/server/models/User';
import { generateToken } from '@/server/utils/tokenManager';

export const POST = withApi(async (request) => {
  const { email, password } = await request.json();
  // ...body ported verbatim from authController.loginUser, with:
  //   res.status(n).json(obj)  →  return NextResponse.json(obj, { status: n })
  //   req.body                 →  parsed above
  //   req.user                 →  const user = await requireAuth(request)
  //   req.params.x             →  const { x } = await context.params   (handler gets (request, context))
  //   req.query.x              →  request.nextUrl.searchParams.get('x')
});
```

- [ ] Implement: POST register, POST login, GET logout, GET me, POST forgotpassword, PUT resetpassword/[resettoken], PUT updateprofile, PUT password, GET+PUT preferences (two exports in one route.js).
- [ ] Smoke test with `npm run dev` + local Mongo: register → 201 with token; login → 200 with token; `GET /api/auth/me` with Bearer → 200; without → 401 `{ success:false, error:'Not authorized, no token' }`.
- [ ] Commit: `FEAT: migrate auth endpoints to Next route handlers`

### Task 5: Jobs routes + health

**Files:** `src/app/api/jobs/route.js` (GET list + POST create — replaces the existing proxy version), `jobs/stats/route.js`, `jobs/recent/route.js`, `jobs/[id]/route.js` (GET/PUT/DELETE); `src/app/api/health/route.js` (returns same body as Express `/health`).

**Port source:** `backend/controllers/jobController.js`. All handlers call `requireAuth` first (router-level `protect` in Express).

- [ ] Implement all 8 handlers; smoke test job create/list/update/delete with Bearer token.
- [ ] Commit: `FEAT: migrate jobs endpoints and health check`

### Task 6: Resume routes on Vercel Blob

**Files:** `src/app/api/resumes/route.js` (GET list, POST upload), `resumes/[id]/route.js` (GET/DELETE), `resumes/[id]/default/route.js` (PUT), `resumes/[id]/download/route.js` (GET), `resumes/[id]/preview/route.js` (GET — replaces existing proxy); delete misspelled `resumes/[id]/downlaod/` dir.

**Port source:** `backend/controllers/resumeController.js` + multer config in `backend/routes/resumes.js`.

**Upload replaces multer:**

```js
export const POST = withApi(async (request) => {
  const user = await requireAuth(request);
  const form = await request.formData();
  const file = form.get('resumeFile');
  if (!file || typeof file === 'string') return NextResponse.json({ success:false, error:'Please upload a file' }, { status:400 });
  const ext = ('.' + file.name.split('.').pop()).toLowerCase();
  if (!['.pdf','.doc','.docx'].includes(ext)) return NextResponse.json({ success:false, error:'Only PDF and Word documents are allowed' }, { status:400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success:false, error:'File size cannot exceed 5MB' }, { status:400 });
  const pathname = `resumes/${crypto.randomUUID()}${ext}`;
  const blob = await uploadResumeBlob(pathname, file, file.type);
  // then the ported create-Resume logic, storing file: pathname, blobUrl: blob.url
});
```

**Download/preview:** load Resume (ownership check ported), `const res = await fetch(resume.blobUrl)`, return `new Response(res.body, { headers: { 'Content-Type': resume.mimeType, 'Content-Disposition': \`inline|attachment; filename="${resume.originalFilename}"\` } })`. Preview keeps working with `?token=` auth via `requireAuth`.
**Delete:** `deleteResumeBlob(resume.blobUrl)` replaces `fs.unlinkSync`.

- [ ] Implement all 7 handlers; smoke test: multipart upload via curl → 201; download returns the bytes; delete removes blob + doc.
- [ ] Commit: `FEAT: migrate resume endpoints to Vercel Blob storage`

### Task 7: Job-finder + profile routes

**Files:** `job-finder/search|stats/route.js`, `job-finder/saved/route.js` (GET/POST), `job-finder/saved/[id]/route.js` (DELETE), `job-finder/import/[savedJobId]/route.js` (POST); `profile/route.js` (GET/PUT), `profile/analyze/route.js` (POST).

**Port source:** `jobFinderController.js`, `profileController.js`.
- Drop the inline `express-rate-limit` usage (platform WAF later). Search stays public (no auth) as today.
- `import` endpoint: call `requireFeature(user, 'job_import')` from entitlements before the ported logic.
- `profile/analyze`: replace disk read with `fetchResumeBuffer(resume.blobUrl)` → `extractTextFromBuffer(...)`; rest of the AI analysis flow unchanged.
- `export const maxDuration = 300;` on `profile/analyze` and `auto-apply/generate-answers` routes (OpenAI latency).

- [ ] Implement all 8 handlers; smoke test search (Reed/Adzuna keys from env) and profile GET.
- [ ] Commit: `FEAT: migrate job-finder and profile endpoints`

### Task 8: Automation — Workflow DevKit + Vercel Cron

**Files:** Create `src/workflows/automation.js`, `src/app/api/cron/automation/route.js`, `vercel.json`; modify `next.config.js`; create `src/app/api/auto-apply/*` routes (8 endpoints).

**Port source:** `backend/services/automationScheduler.js`, `backend/controllers/autoApplyController.js` (`runSearchPipeline` at :106, `buildSearchQueries`, cover-letter generation at :187).

**Workflow (`src/workflows/automation.js`):** decompose `runSearchPipeline` into steps — the workflow function only orchestrates; every step has full Node access, calls `connectDB()` itself, and passes only plain serializable objects:

```js
export async function userAutomationWorkflow(configId, runId) {
  'use workflow';
  const ctx = await loadRunContext(configId, runId);        // step: config+profile → plain object
  if (!ctx) return;
  const jobs = await searchBoardsStep(ctx);                 // step: searchAllBoards + dedupe vs SavedJobs
  const capped = jobs.slice(0, 30);                         // cost cap per design
  const results = [];
  for (const job of capped) results.push(await scoreJobStep(ctx, job));   // step per job: one gpt-4.1 scoring call
  for (const r of results.filter(x => x && x.qualifies)) await prepareApplicationStep(ctx, r); // step: SavedJob + cover letter + PreparedApplication
  await finalizeRunStep(runId, { found: jobs.length, processed: capped.length }); // step: AutomationRun stats/status
}
```

Each `async function xxxStep(...) { 'use step'; ... }` lives in the same file. Failures: throw `FatalError` for non-retryable (missing profile), plain errors retry automatically.

**Cron route (`api/cron/automation/route.js`):** `GET` handler — verify `request.headers.get('authorization') === \`Bearer ${process.env.CRON_SECRET}\`` else 401; then ported scheduler selection logic (`SearchConfig.find({ isActive:true })`, `shouldRunNow()`), create `AutomationRun` docs, `const { start } = await import('workflow/api'); await start(userAutomationWorkflow, [configId, runId])` per due config; return counts. Also `export const maxDuration = 60`.

**`vercel.json`:** `{ "crons": [ { "path": "/api/cron/automation", "schedule": "0 */6 * * *" } ] }`

**`next.config.js`:**

```js
const { withWorkflow } = require('workflow/next');
module.exports = withWorkflow({
  reactStrictMode: true,
  outputFileTracingIncludes: { '/api/**': ['./src/server/prompts/**'] },
});
```
(rewrite removed — Task 10 also depends on this.)

**Auto-apply routes:** port all 8; `POST /api/auto-apply/run` now creates the AutomationRun doc and `start()`s the workflow, returning `{ success:true, data:{ runId, status:'running' } }` immediately (frontend queue/history pages already poll their own endpoints; adjust the run-button handler in Task 10 only if it awaited final stats).

- [ ] Implement workflow, cron route, auto-apply routes, vercel.json, next.config change.
- [ ] `npm run build` passes (WDK compiler runs); `npx workflow health` OK in dev.
- [ ] Smoke test: `POST /api/auto-apply/run` returns runId; `npx workflow inspect runs` shows the run.
- [ ] Commit: `FEAT: migrate automation to Vercel Cron + Workflow DevKit`

### Task 9: Subscription/Stripe routes (test mode)

**Files:** Create `src/app/api/subscription/{plans,webhook,current,usage,billing-history,create-checkout-session,upgrade,cancel}/route.js`. Modify ported controller logic for price-ID env names.

**Port source:** `backend/controllers/subscriptionController.js` (previously unmounted), `backend/routes/subscription.js`.
- Rename env references: `STRIPE_PREMIUM_MONTHLY_PRICE_ID`→`STRIPE_PLUS_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_ANNUAL_PRICE_ID`→`STRIPE_PLUS_ANNUAL_PRICE_ID`, `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`→`STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_ENTERPRISE_ANNUAL_PRICE_ID`→`STRIPE_PRO_ANNUAL_PRICE_ID`; any tier strings `premium`/`enterprise` in this controller map to `plus`/`pro` (User model tiers).
- Webhook: `const body = await request.text(); const sig = request.headers.get('stripe-signature'); stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)` — no `withApi` DB-first wrapper changes needed beyond connecting before user updates; returns 400 on signature failure.
- `plans` is public; the rest `requireAuth`.

- [ ] Implement all 8; smoke test: `GET /api/subscription/plans` 200; `create-checkout-session` with test key returns a `url`; webhook with bad signature → 400.
- [ ] Commit: `FEAT: mount subscription/Stripe endpoints (test mode)`

### Task 10: Frontend wiring + dead-code cleanup

**Files:** Modify `src/lib/api.js`, `next.config.js` (done in Task 8), `package.json` (done in Task 1). Delete: `backend/app.js`, `backend/config/env.js`, `backend/controllers/themeController.js`, `backend/models/CustomTheme.js`, `backend/routes/theme.js`, `backend/routes/admin.js` (whole `backend/` dir is removed later in Task 14 — these deletions may fold into that; keep this step focused on `src/`).

- [ ] `src/lib/api.js`: `const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';` and `timeout: 60000`. Mock layer stays dev-gated (verified at `src/lib/api.js:90`).
- [ ] Check `src/app/auth`, `src/contexts`, `src/lib/*Service.js` for any hardcoded `localhost:500x` and replace with relative paths. Check the auto-apply "Run now" UI: if it awaits final stats from `POST /auto-apply/run`, change it to fire → show "running" → poll history.
- [ ] `npm run build` passes; `npm run dev` full manual click-through: login page loads, dashboard fetches via `/api/*` same-origin.
- [ ] Commit: `FEAT: point frontend at same-origin /api and clean dead code`

### Task 11: Local end-to-end verification

- [ ] With local Mongo + real env vars in `.env.local` (including a test `CRON_SECRET`): run `npm run dev`.
- [ ] curl E2E pass: register → login → create/list/update/delete job → upload resume (multipart) → download/preview → job-finder search → subscription plans → auto-apply run (returns runId) → cron endpoint with Bearer CRON_SECRET → 200, with wrong secret → 401.
- [ ] Fix anything broken; commit fixes.

### Task 12: Vercel provisioning

- [ ] `vercel link` from `job-tracker/` (new project, e.g. `job-tracker`); confirm project root = `job-tracker`.
- [ ] Create Blob store (`vercel blob store add job-tracker-resumes` or dashboard) and connect to the project → `BLOB_READ_WRITE_TOKEN` env appears.
- [ ] MongoDB Atlas: try Vercel Marketplace (`vercel integration add ...`); if unavailable, ask user for an Atlas connection string (free M0). Set `MONGODB_URI` for production+preview.
- [ ] Push env vars (values piped from local `.env`, never echoed): `JWT_SECRET`, `JWT_EXPIRE`, `REED_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` (value from old `ADZUNA_API_KEY`), `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, 4× price IDs, `SMTP_*` (5), `FROM_NAME`, `FROM_EMAIL`, new random `CRON_SECRET`, `FRONTEND_URL` (deployment URL after first deploy). **Ask user for `OPENAI_API_KEY` (missing locally) — batch with the Atlas question if needed.**

### Task 13: Preview deploy + E2E

- [ ] `vercel deploy` → preview URL.
- [ ] Repeat the Task 11 curl E2E against the preview URL (Blob + Atlas now real). Include: resume upload→analyze (needs OPENAI key), Stripe checkout session URL creation, webhook 400-on-bad-signature.
- [ ] Check `vercel logs` for errors; fix, commit, redeploy until green.

### Task 14: Production deploy, cron verify, final cleanup

- [ ] Remove `backend/` directory entirely; `npm run build` still passes; commit `CHORE: remove Express backend after migration`.
- [ ] `vercel --prod` → production URL; set `FRONTEND_URL` to it; verify crons registered (dashboard/`vercel crons ls`).
- [ ] Production smoke: register/login/job CRUD/plans/health on the prod URL.
- [ ] Configure WAF rate-limit rule for `/api/job-finder/search` (dashboard; Pro plan) — note for user if it needs manual dashboard step.
- [ ] Report results to user with URLs and any remaining manual items (Stripe webhook endpoint registration in Stripe dashboard with prod URL, custom domain).

## Self-Review Notes

- Spec coverage: all 9 design sections map to tasks (arch→2-9, DB→2/12, Blob→3/6, automation→8, Stripe→9, auth/email/logging/ratelimit→2/7/14, env→12, rollout→13/14). ✓
- The Stripe webhook needs the endpoint registered in the Stripe dashboard pointing at the deployed URL — surfaced in Task 14 report. ✓
- Type consistency: `withApi`, `requireAuth`, `ApiError`, `uploadResumeBlob/fetchResumeBuffer/deleteResumeBlob`, `extractTextFromBuffer` names used consistently across tasks. ✓
