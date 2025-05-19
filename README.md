# Job Application Tracking System

A comprehensive web application for tracking job applications throughout the hiring process. Built with React.js/Next.js frontend and Node.js/Express/MongoDB backend.

![Job Tracker Dashboard](https://via.placeholder.com/800x450?text=Job+Tracker+Dashboard)

## Features

- **User Authentication**: Secure registration and login with email/password, Google, and Apple sign-in options
- **Dashboard**: Intuitive interface to track all job applications in one place
- **Application Management**: Add, edit, and delete job applications with comprehensive details
- **Status Tracking**: Monitor applications through 8 predefined statuses (Saved, Applied, Phone Screen, Interview, Technical Assessment, Offer, Rejected, Withdrawn)
- **Resume Management**: Upload and manage multiple resume versions
- **Settings**: Customize themes, notification preferences, and account settings
- **Responsive Design**: Fully functional on both desktop and mobile devices
- **Future AI Enhancements**: Architecture designed to support AI analysis of applications, resumes, and job descriptions

## Technology Stack

### Frontend
- **Next.js**: React framework with server-side rendering
- **React**: JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: Promise-based HTTP client

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Token-based authentication

### DevOps
- **Git**: Version control
- **npm**: Package management

## Project Structure

```
job-tracker/
├── src/                        # Frontend source code
│   ├── app/                    # Next.js app directory
│   │   ├── layout.jsx          # Root layout component
│   │   ├── page.jsx            # Home page
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── auth/               # Authentication pages
│   │   ├── settings/           # Settings pages
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # UI components
│   │   ├── layout/             # Layout components
│   │   ├── forms/              # Form components
│   ├── lib/                    # Frontend utilities
│   │   ├── api.js              # API client
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   ├── styles/                 # Global styles
│   │   ├── globals.css         # Global CSS
├── backend/                    # Backend source code
│   ├── server.js               # Express server entry point
│   ├── app.js                  # Express application setup
│   ├── config/                 # Configuration files
│   │   ├── db.js               # Database configuration
│   │   ├── env.js              # Environment variables
│   ├── models/                 # Mongoose models
│   │   ├── User.js             # User model
│   │   ├── Job.js              # Job application model
│   │   ├── Resume.js           # Resume model
│   ├── controllers/            # Request handlers
│   │   ├── authController.js   # Authentication controllers
│   │   ├── jobController.js    # Job application controllers
│   ├── routes/                 # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── jobs.js             # Job application routes
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # Authentication middleware
│   │   ├── error.js            # Error handling middleware
│   ├── utils/                  # Utility functions
│   │   ├── logger.js           # Logging utility
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
├── package.json                # Project dependencies
├── tailwind.config.js          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
```

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16.8.0 or higher)
- npm (v8.0.0 or higher)
- MongoDB (v5.0.0 or higher)
- Git

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/job-tracker.git
cd job-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```
# Frontend environment variables
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Backend environment variables
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-tracker
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Replace `your_jwt_secret_key_here` with a secure random string.

4. **Set up MongoDB**

Ensure MongoDB is running on your system:

```bash
# Check if MongoDB is running
mongod --version
```

If you prefer to use Docker:

```bash
docker run -d -p 27017:27017 --name job-tracker-mongo mongo:latest
```

## Running the Application

### Development Mode

To run both frontend and backend in development mode:

```bash
npm run dev:both
```

Or run them separately:

```bash
# Frontend only
npm run dev

# Backend only
npm run server
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Job Applications

- `GET /api/jobs` - Get all jobs for the logged-in user
- `POST /api/jobs` - Create a new job application
- `GET /api/jobs/:id` - Get a specific job application
- `PUT /api/jobs/:id` - Update a job application
- `DELETE /api/jobs/:id` - Delete a job application

### Resumes

- `GET /api/resumes` - Get all resumes for the logged-in user
- `POST /api/resumes` - Upload a new resume
- `GET /api/resumes/:id` - Get a specific resume
- `DELETE /api/resumes/:id` - Delete a resume

## Development Roadmap

The project is being developed in 5 phases:

### Phase 1: Project Setup ✓
- Establish foundational architecture
- Configure MongoDB
- Set up project directories
- Install dependencies
- Create skeleton components and routing

### Phase 2: Authentication System
- Implement user registration and login
- Integrate Google and Apple login
- Create session management
- Develop password reset
- Implement user profiles

### Phase 3: Settings Page Development
- Design profile management interface
- Create theme customization
- Develop resume upload system
- Implement password change
- Design subscription plan management

### Phase 4: Main Dashboard Implementation
- Design job application tracking interface
- Implement filtering system
- Create job application entry system
- Develop status tracking
- Build resume version management

### Phase 5: Future AI Enhancement Foundation
- Design data structures for AI analysis
- Establish API endpoints for AI integration
- Create infrastructure for resume parsing
- Implement framework for job description analysis

## Testing

The project includes unit, integration, and end-to-end tests:

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Font Awesome](https://fontawesome.com/) - Icons

## Contact

Hillman Chan - hillmanchan709@gmail.com

Project Link: [https://github.com/ChiFungHillmanChan/Job_Application_Tracking_System](https://github.com/ChiFungHillmanChan/Job_Application_Tracking_System)
