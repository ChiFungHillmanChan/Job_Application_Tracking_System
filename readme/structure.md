# Project Structure

## Backend Models

| Model | Location | Purpose |
|-------|----------|---------|
| User | `backend/models/User.js` | User accounts, auth, subscription tiers |
| Job | `backend/models/Job.js` | Tracked job applications |
| Resume | `backend/models/Resume.js` | Uploaded resume files |
| SavedJob | `backend/models/SavedJob.js` | Jobs saved from external search |
| CustomTheme | `backend/models/CustomTheme.js` | Custom theme configs (stub) |
| UserProfile | `backend/models/UserProfile.js` | AI-extracted CV profile data |
| SearchConfig | `backend/models/SearchConfig.js` | Auto-apply search preferences |
| PreparedApplication | `backend/models/PreparedApplication.js` | AI-prepared job applications |
| AutomationRun | `backend/models/AutomationRun.js` | Daily automation run logs |

## Backend Services

| Service | Location | Purpose |
|---------|----------|---------|
| OpenAI Client | `backend/services/openai.js` | Singleton OpenAI SDK instance |
| CV Parser | `backend/services/cvParser.js` | Extract text from PDF/DOCX files |
| AI Profile Analyzer | `backend/services/aiProfileAnalyzer.js` | Analyze CV text via OpenAI |
| AI Job Matcher | `backend/services/aiJobMatcher.js` | Score job-profile match (0-100) |
| AI Cover Letter Writer | `backend/services/aiCoverLetterWriter.js` | Generate tailored cover letters |
| AI Application Answerer | `backend/services/aiApplicationAnswerer.js` | Generate application question answers |
| Prompt Loader | `backend/services/loadPrompt.js` | Load prompt files from `prompts/` |
| Automation Scheduler | `backend/services/automationScheduler.js` | node-cron scheduler for daily runs |

## Backend Job Board Adapters

| Adapter | Location | Purpose |
|---------|----------|---------|
| Base Adapter | `backend/services/jobBoards/baseAdapter.js` | Abstract interface for job boards |
| Reed Adapter | `backend/services/jobBoards/reedAdapter.js` | Reed.co.uk API integration |
| Adzuna Adapter | `backend/services/jobBoards/adzunaAdapter.js` | Adzuna API integration |
| Adapters Index | `backend/services/jobBoards/index.js` | Registry, multi-board search, dedup |

## Backend Controllers

| Controller | Location | Purpose |
|------------|----------|---------|
| Auth | `backend/controllers/authController.js` | Register, login, password reset |
| Jobs | `backend/controllers/jobController.js` | CRUD for tracked applications |
| Resumes | `backend/controllers/resumeController.js` | Upload, preview, download resumes |
| Job Finder | `backend/controllers/jobFinderController.js` | Reed job search, save, import |
| Profile | `backend/controllers/profileController.js` | CV analysis, profile CRUD |
| Auto-Apply | `backend/controllers/autoApplyController.js` | Search config, run pipeline, queue, stats |

## Backend Routes

| Route | Location | Prefix |
|-------|----------|--------|
| Auth | `backend/routes/auth.js` | `/api/auth` |
| Jobs | `backend/routes/jobs.js` | `/api/jobs` |
| Resumes | `backend/routes/resumes.js` | `/api/resumes` |
| Job Finder | `backend/routes/jobFinder.js` | `/api/job-finder` |
| Profile | `backend/routes/profile.js` | `/api/profile` |
| Auto-Apply | `backend/routes/autoApply.js` | `/api/auto-apply` |

## Frontend Pages

| Page | Location | Purpose |
|------|----------|---------|
| Dashboard | `src/app/dashboard/page.jsx` | Main stats dashboard |
| Jobs List | `src/app/dashboard/jobs/page.jsx` | Application list |
| New Job | `src/app/dashboard/jobs/new/page.jsx` | Create application |
| Job Finder | `src/app/dashboard/job-finder/page.jsx` | External job search |
| Saved Jobs | `src/app/dashboard/job-finder/saved/page.jsx` | Saved job list |
| AI Profile | `src/app/dashboard/profile/page.jsx` | AI-extracted profile view/edit |
| Auto-Apply | `src/app/dashboard/auto-apply/page.jsx` | Automation dashboard |
| App Queue | `src/app/dashboard/auto-apply/queue/page.jsx` | Review prepared applications |
| Run History | `src/app/dashboard/auto-apply/history/page.jsx` | Automation run logs |

## Frontend Services

| Service | Location | Purpose |
|---------|----------|---------|
| API Client | `src/lib/api.js` | Axios instance with auth interceptors |
| Auto-Apply Service | `src/lib/services/autoApplyService.js` | API calls for profile, config, queue |
| Job Search Hook | `src/lib/hooks/useJobSearch.js` | Job finder search state |
| Saved Jobs Hook | `src/lib/hooks/useSavedJobs.js` | Saved jobs state |
| Auth Hook | `src/lib/hooks/useAuth.js` | Auth context provider |

## Prompt Files

| Prompt | Location | Purpose |
|--------|----------|---------|
| CV Analysis | `prompts/cv-analysis.txt` | System prompt for CV parsing |
| Cover Letter | `prompts/cover-letter.txt` | System prompt for cover letters |
| Application Answers | `prompts/application-answers.txt` | System prompt for Q&A |
| Job Matching | `prompts/job-matching.txt` | System prompt for match scoring |
