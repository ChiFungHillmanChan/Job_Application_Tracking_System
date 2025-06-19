<a id="top"></a>
# Job Application Tracking System

A comprehensive full-stack web application that helps job seekers organize, track, and manage their job applications throughout the entire hiring process. Built with modern web technologies and featuring both free and premium subscription tiers with Stripe integration.

## 📑 Table of Contents

### 🚀 Getting Started
- [What This Project Does](#what-this-project-does)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)

### 💎 Features & Pricing
- [Subscription Tiers & Pricing](#subscription-tiers--pricing)
- [Feature Limitations](#feature-limitations-without-configuration)

### 🔧 Development & Deployment
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Development Scripts](#development-scripts)
- [Security Features](#security-features)

### 🛠 Support & Contributing
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support & Contact](#support--contact)

---

## What This Project Does

This application solves the common problem of job search chaos by providing a centralized platform for job seekers to:

- **Track Applications**: Monitor job applications through 8 different stages from saved to offer
- **Discover Jobs**: Search and save jobs from external APIs (Reed, Adzuna, Indeed)
- **Manage Resumes**: Upload, organize, and link multiple resume versions to applications
- **Schedule Interviews**: Coordinate interview rounds with detailed notes and feedback
- **Analyze Progress**: Visualize job search statistics and track success metrics
- **Customize Experience**: Personalize themes, layouts, and appearance settings
<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Key Features

### Authentication & Security
- **JWT-based Authentication**: Secure token-based login system
- **Password Reset**: Email-based password recovery (requires SMTP configuration)
- **Role-based Access**: User, admin, and superadmin roles
- **Data Protection**: Helmet.js security headers and CORS protection
- **Input Validation**: Comprehensive data validation with Zod schemas

### Comprehensive Job Tracking
- **8 Application Statuses**: 
  - Saved → Applied → Phone Screen → Interview → Technical Assessment → Offer → Rejected/Withdrawn
- **Rich Job Details**: Company info, position, location, salary, job type (permanent/contract/temporary), work arrangement (onsite/remote/hybrid)
- **Activity Timeline**: Automatic logging of all status changes and interactions
- **Interview Management**: Schedule multiple interview rounds with interviewer details, notes, and outcomes
- **Contact Database**: Store recruiter and hiring manager information
- **Document Linking**: Attach resumes, cover letters, and other documents to applications
- **Follow-up Reminders**: Track important dates and deadlines

### Integrated Job Finder
- **External API Integration**: Search jobs from Reed, Adzuna, and other major job boards
- **Advanced Filtering**: Filter by location, salary range, job type, and work arrangement
- **Save for Later**: Bookmark interesting positions before applying (free users: 5 max, premium: unlimited)
- **One-click Import**: Convert saved jobs to tracked applications
- **Map Integration**: Location-based job search with geographical filtering
- **Rate Limiting**: 100 searches per 15 minutes, 20 saves per minute

### Resume Management System
- **Multiple Versions**: Upload and organize different resumes for different roles
- **File Format Support**: PDF, DOC, and DOCX (5MB max per file)
- **Default Resume**: Mark primary resume for quick application linking
- **Preview & Download**: View resumes directly in browser or download
- **Application Tracking**: See which resume was used for each application
- **Storage Limits**: Free (8 resumes max), Premium (unlimited)

### Advanced Customization
- **Theme System**: Light, dark, and system-adaptive themes
- **Color Schemes**: 5 professional color palettes (blue, green, purple, red, orange)
- **Layout Density**: Compact, default, and comfortable spacing options
- **Typography**: Small, default, and large font size options
- **CSS Custom Properties**: Dynamic theming with CSS variables
- **Premium Styling**: Custom CSS editor and advanced design controls

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Subscription Tiers & Pricing

#### Free Tier (£0/month)
**Limitations:**
- **5 saved jobs maximum**
- **100 job applications maximum** 
- **8 resume uploads maximum**
- **Basic themes only** (no custom colors/CSS)
- **Standard support**
- **No email configuration** = no password reset emails
- **No external API keys** = no job finder functionality

#### Plus Tier (£8.88/month or £74.77/year)
**Everything in Free, plus:**
- **Unlimited saved jobs**
- **Unlimited job applications**
- **Unlimited resume uploads**
- **Custom color schemes**
- **Advanced typography options**
- **Granular spacing controls**
- **Theme export functionality**
- **Google Fonts integration**
- **Priority email support**

#### Pro Tier (£38.88/month or £327.34/year)
**Everything in Plus, plus:**
- **Custom CSS editor**
- **Component-level theming**
- **AI-powered features** (when available)
- **Personal consultation sessions**
- **Beta feature access**
- **Team sharing capabilities**
- **Font upload functionality**
- **API access**
- **White-labeling options**
- **Dedicated support**

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Technology Stack

### Frontend
- **Next.js 15.3.2** - React framework with App Router
- **React 19.0.0** - Latest UI library with concurrent features
- **Tailwind CSS 3.3.3** - Utility-first CSS framework with custom plugins
- **Headless UI 2.2.3** - Unstyled accessible UI components
- **Heroicons 2.2.0** - Beautiful hand-crafted SVG icons
- **React Hook Form 7.56.4** - Performant forms with easy validation
- **Zod 3.25.3** - TypeScript-first schema validation
- **Axios 1.9.0** - Promise-based HTTP client

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js 4.19.2** - Minimal web application framework
- **MongoDB** - NoSQL document database
- **Mongoose 8.15.0** - Elegant MongoDB object modeling
- **JWT (jsonwebtoken 9.0.2)** - Stateless authentication
- **bcryptjs 3.0.2** - Password hashing
- **Multer** - File upload middleware
- **Helmet 8.1.0** - Security middleware
- **Morgan 1.10.0** - HTTP request logger
- **Winston 3.17.0** - Professional logging library
- **Nodemailer 7.0.3** - Email sending functionality
- **Stripe 18.1.1** - Payment processing
- **CORS 2.8.5** - Cross-origin resource sharing

### Development Tools
- **ESLint 9** - Code linting and formatting
- **PostCSS 8.4.26** - CSS processing
- **Autoprefixer 10.4.14** - CSS vendor prefixing
- **Nodemon 3.1.10** - Development auto-reloading

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Prerequisites

Before installation, ensure you have:

- **Node.js** v16.8.0 or higher
- **npm** v8.0.0 or higher  
- **MongoDB** v5.0.0 or higher
- **Git** for version control

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ChiFungHillmanChan/Job_Application_Tracking_System.git
cd Job_Application_Tracking_System
```

### 2. Install All Dependencies

```bash
# Install both frontend and backend dependencies
npm run install:all

# Or install separately:
npm install                    # Frontend dependencies
cd backend && npm install      # Backend dependencies
```

### 3. Environment Configuration

Create a `.env` file in the **root directory**:

```env
# ===== REQUIRED CONFIGURATION =====
# Server Settings
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/job-tracker

# Authentication (REQUIRED - use a strong random string)
JWT_SECRET=your_super_secure_jwt_secret_key_here_min_32_chars
JWT_EXPIRE=30d

# ===== OPTIONAL CONFIGURATIONS =====
# Email Service (Required for password reset functionality)
# Without these, users CANNOT reset passwords or receive notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
FROM_NAME=JobTracker
FROM_EMAIL=noreply@yourjobtracker.com

# External Job APIs (Required for Job Finder feature)
# Without these, Job Finder will NOT work
REED_API_KEY=your_reed_api_key_from_reed_co_uk
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Payment Processing (Required for premium subscriptions)
# Without these, users CANNOT subscribe to premium plans
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_your_plus_monthly_price_id
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_your_plus_annual_price_id
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_your_pro_monthly_price_id
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_your_pro_annual_price_id

# Development Settings
ALLOW_ADMIN_ROUTES=true
```

### 4. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Ubuntu/Debian:
sudo apt-get install -y mongodb
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS (using Homebrew):
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Windows: Download from https://www.mongodb.com/try/download/community
```

**Option B: Docker**
```bash
# Run MongoDB in Docker
docker run -d \
  --name job-tracker-mongo \
  -p 27017:27017 \
  -v job-tracker-data:/data/db \
  mongo:latest

# Check if running
docker ps
```

**Option C: MongoDB Atlas (Cloud)**
```env
# Use cloud MongoDB (recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-tracker?retryWrites=true&w=majority
```

### 5. Start the Application

```bash
# Run both frontend and backend simultaneously (recommended)
npm run dev:both

# Or run separately:
# Frontend only (http://localhost:3000)
npm run dev

# Backend only (http://localhost:5001)
npm run server

# Check backend health
npm run check:health
```

**Application URLs:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Feature Limitations Without Configuration

### Without Email Configuration (SMTP):
- ❌ **Password reset emails won't work**
- ❌ **Account verification emails disabled**
- ❌ **Application notification emails disabled**
- ❌ **Users stuck if they forget passwords**

### Without External API Keys:
- ❌ **Job Finder feature completely disabled**
- ❌ **Cannot search Reed, Adzuna, or other job boards**
- ❌ **Cannot save external job listings**
- ❌ **Users limited to manual job entry only**

### Without Stripe Configuration:
- ❌ **Premium subscriptions unavailable**
- ❌ **All users stuck on free tier limitations**
- ❌ **No payment processing**
- ❌ **Premium features inaccessible**

### Free Tier User Limitations:
- 📊 **Only 5 saved jobs** (vs unlimited premium)
- 📝 **100 application limit** (vs unlimited premium)
- 📄 **8 resume maximum** (vs unlimited premium)
- 🎨 **Basic themes only** (no custom CSS/colors)
- 💬 **Standard support** (no priority/dedicated support)

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/job-tracker-prod
JWT_SECRET=production_jwt_secret_min_64_chars_for_security
FRONTEND_URL=https://yourjobtracker.com

# Production SMTP (required)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Production Stripe (required for billing)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

### Build and Deploy
```bash
# Build the frontend
npm run build

# Start production server
npm start
```

## API Documentation

### Health Check
```
GET    /health                     - Server health status
```

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login  
GET    /api/auth/me                - Get current user profile
POST   /api/auth/forgotpassword    - Request password reset (requires SMTP)
PUT    /api/auth/resetpassword/:token - Reset password
GET    /api/auth/preferences       - Get user preferences
PUT    /api/auth/preferences       - Update user preferences
```

### Job Management
```
GET    /api/jobs                   - Get user's applications (paginated)
POST   /api/jobs                   - Create new job application
GET    /api/jobs/:id               - Get specific application
PUT    /api/jobs/:id               - Update application
DELETE /api/jobs/:id               - Delete application
GET    /api/jobs/stats             - Get application statistics
GET    /api/jobs/recent            - Get recent activity
```

### Resume Management
```
GET    /api/resumes                - Get user's resumes
POST   /api/resumes                - Upload new resume (multipart/form-data)
GET    /api/resumes/:id            - Get specific resume
DELETE /api/resumes/:id            - Delete resume
PUT    /api/resumes/:id/default    - Set as default resume
GET    /api/resumes/:id/download   - Download resume file
GET    /api/resumes/:id/preview    - Preview resume in browser
```

### Job Finder (requires API keys)
```
GET    /api/job-finder/search      - Search external job boards (rate limited: 100/15min)
POST   /api/job-finder/saved       - Save job for later (rate limited: 20/min)  
GET    /api/job-finder/saved       - Get saved jobs
DELETE /api/job-finder/saved/:id   - Remove saved job
POST   /api/job-finder/import/:id  - Import saved job to tracker (premium)
GET    /api/job-finder/stats       - Get job finder statistics
```

### Subscription Management (requires Stripe)
```
GET    /api/subscription/current   - Get current subscription
GET    /api/subscription/plans     - Get available plans
POST   /api/subscription/create-checkout-session - Create Stripe checkout
POST   /api/subscription/upgrade   - Handle successful upgrade
POST   /api/subscription/cancel    - Cancel subscription
GET    /api/subscription/usage     - Get usage statistics
GET    /api/subscription/billing-history - Get billing history
POST   /api/subscription/webhook   - Stripe webhook handler
```
<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Development Scripts

```bash
# Development
npm run dev              # Start frontend only
npm run server           # Start backend only  
npm run dev:both         # Start both frontend and backend
npm run dev:full         # Alternative command for both

# Production
npm run build            # Build frontend for production
npm run start            # Start production server

# Utilities
npm run lint             # Run ESLint
npm run install:all      # Install all dependencies
npm run check:health     # Test backend connectivity
```

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Security Features

- **JWT Authentication**: Stateless token-based auth with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Zod schemas for type-safe validation
- **File Upload Security**: File type and size restrictions (5MB max)
- **Rate Limiting**: API endpoint protection (100 searches/15min, 20 saves/min)
- **CORS Protection**: Configurable cross-origin policies
- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Environment Security**: Sensitive config in environment variables
- **Role-based Access**: User/admin/superadmin permission levels

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ismaster')"

# Check if port 5001 is available
lsof -i :5001

# View detailed logs
cd backend && npm run dev
```

**Frontend build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm ls
```

**Email not working:**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-host',
  port: 587,
  auth: { user: 'your-email', pass: 'your-password' }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**Job Finder not working:**
```bash
# Test API keys
curl "https://www.reed.co.uk/api/1.0/search?keywords=developer" \
  -H "Authorization: Basic $(echo -n 'YOUR_API_KEY:' | base64)"
```

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add JSDoc comments for new functions
- Update README if adding new features
- Test thoroughly before submitting

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React Framework for Production
- **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework  
- **[MongoDB](https://www.mongodb.com/)** - The application data platform
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework
- **[Stripe](https://stripe.com/)** - Online payment processing
- **[Heroicons](https://heroicons.com/)** - Beautiful hand-crafted SVG icons

<p align="right"><a href="#top">⬆ Back to Top</a></p>

## Support & Contact

**GitHub**: [ChiFungHillmanChan/Job_Application_Tracking_System](https://github.com/ChiFungHillmanChan/Job_Application_Tracking_System)

**For Issues:**
1. Check existing [Issues](https://github.com/ChiFungHillmanChan/Job_Application_Tracking_System/issues)
2. Create a new issue with detailed description
3. Include error logs and environment details

**For Premium Support:**
- Upgrade to Pro tier for dedicated support
- Include subscription details when contacting

---

**🎯 Built for job seekers who want to take control of their career journey**