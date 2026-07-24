# Design: Migrate Job Tracker to a Single Next.js App on Vercel

**Date:** 2026-07-24
**Status:** Approved (user approved design in conversation; chose single-app approach and Stripe test mode)

## Goal

Deploy the entire Job Application Tracking System (currently Next.js frontend + separate Express backend) online on Vercel Pro as **one Next.js 15 project**, with all features working: auth, job tracking, resume upload + AI CV analysis, job finder, auto-apply automation, and Stripe subscriptions (test mode).

## Current State (summary)

- Frontend: Next.js 15.3.2 (App Router, JS not TS), React 19, Tailwind 3, axios client at `src/lib/api.js` with localStorage JWT Bearer + dev mock layer.
- Backend: Express app in `job-tracker/backend/` on port 5001 — 6 mounted route files (~40 endpoints), Mongoose models, JWT auth middleware, multer disk uploads to `backend/uploads/resumes/`, winston file logs, node-cron 6-hourly automation running an unbounded sequential OpenAI pipeline in-process, nodemailer SMTP, OpenAI (gpt-4.1, Responses API), Reed + Adzuna job board APIs, Stripe subscription controller (routes written but **unmounted**).
- MongoDB: localhost — the system has never been deployed; no production data exists.
- Known defects to fix during migration: `next.config.js` rewrite targets port 5000 vs backend 5001; env has `ADZUNA_API_KEY` but code reads `ADZUNA_APP_KEY`; code reads `STRIPE_PREMIUM_*`/`STRIPE_ENTERPRISE_*` price IDs but env defines `STRIPE_PLUS_*`/`STRIPE_PRO_*`; `OPENAI_API_KEY` absent from env; empty/dead files (`backend/app.js`, `backend/config/env.js`, theme controller/model/route, `routes/admin.js` referencing a controller that does not exist, misspelled `src/app/api/resumes/[id]/downlaod/` folder).

## Target Architecture

One Vercel project:

- **Next.js 15 App Router** serves the existing frontend unchanged and all API endpoints as route handlers under `src/app/api/**` with identical URLs (`/api/auth/*`, `/api/jobs/*`, `/api/resumes/*`, `/api/job-finder/*`, `/api/profile/*`, `/api/auto-apply/*`, `/api/subscription/*`, `/api/health`).
- **Shared server code** moves to `src/server/`: `models/`, `services/`, `utils/`, plus new `auth.js` (requireAuth helper), `db.js` (cached Mongoose connection), `errors.js` (error → JSON response mapping replicating the Express error middleware behavior).
- **MongoDB Atlas** replaces localhost Mongo. Cached connection pattern (global) for serverless.
- **Vercel Blob** replaces multer disk storage for CVs. Upload via `request.formData()`, 5MB limit, pdf/doc/docx only, stored under unguessable UUID pathnames. Blob URLs are never exposed to the client; preview/download stream through authenticated route handlers. `cvParser` switches from disk paths to Buffers fetched from Blob.
- **Vercel Cron + Workflow DevKit (WDK)** replace node-cron. Cron (`0 */6 * * *`) hits `/api/cron/automation` (protected by `CRON_SECRET`); the handler finds due `SearchConfig`s and calls `start(userAutomationWorkflow, ...)` per user. The per-user workflow runs steps: search boards → AI-score each job (one step per job, capped at 30 jobs/run) → generate cover letters for qualified jobs → persist SavedJob/PreparedApplication/AutomationRun. Steps are independently retried invocations; one user's failure cannot affect others. Manual `/api/auto-apply/run` starts the same workflow and returns immediately.
- **Stripe (test mode)**: the previously-unmounted subscription routes go live as route handlers, including the webhook at `/api/subscription/webhook` using `await req.text()` for raw-body signature verification. Price ID env names standardized to `STRIPE_PLUS_MONTHLY_PRICE_ID`, `STRIPE_PLUS_ANNUAL_PRICE_ID`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID` (matching User model tiers free/plus/pro); controller code updated accordingly.
- **Auth**: unchanged JWT + bcryptjs; frontend keeps localStorage Bearer via existing axios interceptor. Same-origin `/api` means all CORS code is deleted. axios `baseURL` becomes `/api`; the `next.config.js` rewrite is removed. The dev mock layer in `src/lib/api.js` must be hard-gated to development only.
- **Email**: nodemailer SMTP unchanged; SMTP env vars set in Vercel.
- **Logging**: winston file transports removed; console-only (Vercel collects). No `logs/` writes.
- **Rate limiting**: express-rate-limit removed (in-memory, useless on serverless). Public job-finder search protected by Vercel WAF rate-limit rules configured on the project.

## Environment Variables (Vercel)

`MONGODB_URI` (Atlas), `JWT_SECRET`, `JWT_EXPIRE`, `OPENAI_API_KEY` (**must be obtained from user — currently missing**), `REED_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` (renamed from `ADZUNA_API_KEY`), `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, 4× `STRIPE_(PLUS|PRO)_(MONTHLY|ANNUAL)_PRICE_ID`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `FROM_NAME`, `FROM_EMAIL`, `CRON_SECRET` (new), `BLOB_READ_WRITE_TOKEN` (auto-provisioned by Vercel Blob store), `FRONTEND_URL` (the deployed URL, used in emails/Stripe redirects).

## Data Migration

None required (never deployed). Optional: one-off script to upload the 10 dev PDFs in `backend/uploads/resumes/` to Blob and `mongodump/mongorestore` local data to Atlas. Not part of the main rollout.

## Prompts

`job-tracker/prompts/*.txt` move to `src/server/prompts/` and are read via `fs` with `outputFileTracingIncludes` in `next.config.js` so they bundle into the serverless functions.

## Out of Scope

- Live Stripe billing (test mode only; switching to live keys is a later config change).
- Switching AI scoring model to a cheaper model (kept as gpt-4.1; cost mitigated by the 30-jobs/run cap).
- httpOnly-cookie auth refactor.
- The unmounted admin routes and theme feature (dead code — deleted, not migrated).

## Rollout

1. Provision MongoDB Atlas and Vercel Blob store; set all env vars on the Vercel project.
2. Preview deploy; end-to-end test: register/login, job CRUD, CV upload + AI analysis, job finder search, manual auto-apply run, Stripe test checkout + webhook.
3. Verify cron configuration; promote to production.
4. Optional: custom domain.

## Success Criteria

- All previously-working features function on the production Vercel URL with no separate backend process.
- Automation runs complete via Workflow DevKit without function timeouts, visible in Vercel observability.
- Stripe test checkout completes and the webhook updates the user's subscription tier.
- CV upload → analysis → preview/download works against Blob storage.
