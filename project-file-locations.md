# JOB APPLICATION TRACKING SYSTEM - PROJECT FILE LOCATIONS

## FRONTEND FILE LOCATIONS

### Root Configuration Files
- `/package.json` - Project dependencies and scripts
- `/next.config.js` - Next.js configuration
- `/tailwind.config.js` - Tailwind CSS configuration
- `/postcss.config.js` - PostCSS configuration
- `/.env` - Environment variables (not tracked in git)
- `/.gitignore` - Git ignore rules

### Frontend Source Code
- `/src/app/layout.jsx` - Root layout component
- `/src/app/page.jsx` - Home/landing page
- `/src/app/globals.css` - Global CSS with Tailwind directives

### Authentication Pages
- `/src/app/auth/login/page.jsx` - Login page
- `/src/app/auth/register/page.jsx` - Registration page
- `/src/app/auth/forgot-password/page.jsx` - Password recovery page

### Dashboard Pages
- `/src/app/dashboard/page.jsx` - Main dashboard
- `/src/app/dashboard/layout.jsx` - Dashboard layout with navigation
- `/src/app/dashboard/jobs/page.jsx` - Job applications list
- `/src/app/dashboard/jobs/[id]/page.jsx` - Individual job application page
- `/src/app/dashboard/jobs/new/page.jsx` - Create new job application

### Settings Pages
- `/src/app/settings/page.jsx` - Settings main page
- `/src/app/settings/profile/page.jsx` - Profile settings
- `/src/app/settings/account/page.jsx` - Account settings
- `/src/app/settings/resumes/page.jsx` - Resume management
- `/src/app/settings/appearance/page.jsx` - Theme settings

### UI Components
- `/src/components/ui/Button.jsx` - Button component
- `/src/components/ui/Card.jsx` - Card component
- `/src/components/ui/Input.jsx` - Form input component
- `/src/components/ui/Select.jsx` - Dropdown select component
- `/src/components/ui/Alert.jsx` - Alert/notification component
- `/src/components/ui/Badge.jsx` - Status badge component
- `/src/components/ui/Modal.jsx` - Modal dialog component

### Layout Components
- `/src/components/layout/Header.jsx` - Application header
- `/src/components/layout/Footer.jsx` - Application footer
- `/src/components/layout/Sidebar.jsx` - Dashboard sidebar navigation
- `/src/components/layout/MainLayout.jsx` - Main layout wrapper

### Form Components
- `/src/components/forms/LoginForm.jsx` - Login form
- `/src/components/forms/RegisterForm.jsx` - Registration form
- `/src/components/forms/JobForm.jsx` - Job application form
- `/src/components/forms/ResumeUploadForm.jsx` - Resume upload form
- `/src/components/forms/ProfileForm.jsx` - Profile form

### Frontend Utility Files
- `/src/lib/api.js` - API client with Axios
- `/src/lib/hooks/useAuth.js` - Authentication hook
- `/src/lib/hooks/useJobs.js` - Job data management hook
- `/src/lib/utils/formatters.js` - Data formatting utilities
- `/src/lib/utils/validators.js` - Form validation utilities

## BACKEND FILE LOCATIONS

### Server Configuration
- `/backend/server.js` - Express server entry point
- `/backend/app.js` - Express application setup
- `/backend/config/db.js` - MongoDB database configuration
- `/backend/config/env.js` - Environment variables configuration

### Database Models
- `/backend/models/User.js` - User model schema
- `/backend/models/Job.js` - Job application model schema
- `/backend/models/Resume.js` - Resume model schema

### API Controllers
- `/backend/controllers/authController.js` - Authentication controllers
- `/backend/controllers/jobController.js` - Job application controllers
- `/backend/controllers/resumeController.js` - Resume management controllers
- `/backend/controllers/userController.js` - User profile controllers

### API Routes
- `/backend/routes/auth.js` - Authentication routes
- `/backend/routes/jobs.js` - Job application routes
- `/backend/routes/resumes.js` - Resume management routes
- `/backend/routes/users.js` - User profile routes

### Middleware
- `/backend/middleware/auth.js` - Authentication middleware
- `/backend/middleware/error.js` - Error handling middleware
- `/backend/middleware/upload.js` - File upload middleware

### Utilities
- `/backend/utils/logger.js` - Logging utility
- `/backend/utils/tokenManager.js` - JWT token management
- `/backend/utils/validators.js` - Input validation

## TESTING FILE LOCATIONS

### Test Configurations
- `/jest.config.js` - Jest configuration
- `/jest.setup.js` - Jest setup file
- `/cypress.config.js` - Cypress configuration

### Unit Tests
- `/__tests__/unit/models/user.model.test.js` - User model tests
- `/__tests__/unit/models/job.model.test.js` - Job model tests
- `/__tests__/unit/components/Button.test.jsx` - Button component tests
- `/__tests__/unit/components/JobForm.test.jsx` - Job form tests
- `/__tests__/unit/auth.controller.test.js` - Auth controller tests

### Integration Tests
- `/__tests__/integration/auth.test.js` - Authentication flow tests
- `/__tests__/integration/jobs.test.js` - Job CRUD operation tests
- `/__tests__/integration/user.test.js` - User profile tests

### End-to-End Tests
- `/cypress/e2e/auth/login.cy.js` - Login flow test
- `/cypress/e2e/auth/register.cy.js` - Registration flow test
- `/cypress/e2e/dashboard/jobs.cy.js` - Job management test
- `/cypress/e2e/settings/profile.cy.js` - Profile settings test

## DEPLOYMENT FILES

- `/Dockerfile` - Docker container configuration
- `/docker-compose.yml` - Docker Compose configuration
- `/.github/workflows/ci.yml` - GitHub Actions CI workflow
- `/.github/workflows/deploy.yml` - GitHub Actions deployment workflow

## DOCUMENTATION FILES

- `/README.md` - Project overview and setup instructions
- `/CONTRIBUTING.md` - Contributing guidelines
- `/LICENSE` - Project license
- `/CHANGELOG.md` - Version history and changes
- `/docs/api.md` - API documentation
- `/docs/deployment.md` - Deployment guide
- `/docs/architecture.md` - Project architecture explanation

## UPCOMING FEATURES FILE LOCATIONS (PHASE 4-5)

### AI Enhancement Features
- `/src/lib/ai/resumeAnalyzer.js` - Resume analysis integration
- `/src/lib/ai/jobMatchScore.js` - Job match scoring system
- `/backend/controllers/aiController.js` - AI analysis endpoints
- `/backend/services/ai/analyzer.js` - AI analysis service

### Advanced Dashboard Features
- `/src/app/dashboard/analytics/page.jsx` - Application analytics
- `/src/app/dashboard/calendar/page.jsx` - Interview calendar
- `/src/components/dashboard/StatusTimeline.jsx` - Application status timeline
- `/src/components/dashboard/JobMetrics.jsx` - Job application metrics

Remember to update this document as your project evolves and file structure changes!
