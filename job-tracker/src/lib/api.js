'use client';

import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

if (typeof window !== 'undefined') {
  api.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const isCorsError = (
        error.message && error.message.includes('Network Error') && 
        !error.response
      );
      
      if (isCorsError) {
        console.warn('CORS error detected. Falling back to mock data if available.');
        
        if (error.config && error.config.url.includes('/auth/me')) {
          console.warn('Authentication check failed due to CORS/network issue');
          
          try {
            const token = localStorage.getItem('token');
            if (token) {
              return Promise.reject({
                response: {
                  status: 0,
                  data: {
                    error: 'Network error. Please check server connection and CORS configuration.'
                  }
                },
                isCorsError: true 
              });
            }
          } catch (e) {
            console.error('Error checking token in localStorage:', e);
          }
        }
      }
      
      if (error.response && error.response.status === 401) {
        const isLoginAttempt = error.config.url.includes('/auth/login');
        
        if (!isLoginAttempt) {
          try {
            localStorage.removeItem('token');
          } catch (e) {
            console.error('Error removing token from localStorage:', e);
          }
          
          if (typeof window !== 'undefined') {
            if (!window.location.pathname.includes('/auth/login')) {
              window.location.href = '/auth/login';
            }
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
}

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.info('Running in development mode - API calls may be simulated if server is unavailable');
  
  const MOCK_USERS_KEY = 'job_tracker_mock_users';
  const MOCK_RESUMES_KEY = 'job_tracker_mock_resumes';
  const MOCK_JOBS_KEY = 'job_tracker_mock_jobs';
  let mockUsers = [
    {
      id: 'dev-user-1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      subscriptionTier: 'free',
      createdAt: '2023-01-01T00:00:00Z'
    }
  ];


  try {
    const storedUsers = localStorage.getItem(MOCK_USERS_KEY);
    if (storedUsers) {
      mockUsers = JSON.parse(storedUsers);
      console.info('Loaded stored mock users:', mockUsers.length);
    } else {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    }
    
    if (!localStorage.getItem(MOCK_RESUMES_KEY)) {
      localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
    } else {
      try {
        const storedResumes = localStorage.getItem(MOCK_RESUMES_KEY);
        JSON.parse(storedResumes); 
        console.info('Successfully validated stored resumes');
      } catch (error) {
        console.warn('Invalid resumes data in localStorage, resetting to empty array');
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
      }
    }
  } catch (error) {
    console.error('Error accessing localStorage for mock data:', error);
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
      localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Error initializing localStorage:', e);
    }
  }
  
  try {
    if (!localStorage.getItem(MOCK_JOBS_KEY)) {
      localStorage.setItem(MOCK_JOBS_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing mock jobs storage:', error);
  }

  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = axios.delete.bind(axios);
  
  const saveMockUsers = () => {
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    } catch (error) {
      console.error('Error saving mock users to localStorage:', error);
    }
  };
  
  const getMockJobs = () => {
    try {
      const storedJobs = localStorage.getItem(MOCK_JOBS_KEY);
      if (!storedJobs || storedJobs === 'undefined' || storedJobs === '') {
        localStorage.setItem(MOCK_JOBS_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(storedJobs);
    } catch (error) {
      console.error('Error retrieving mock jobs:', error);
      try {
        localStorage.setItem(MOCK_JOBS_KEY, JSON.stringify([]));
      } catch (e) {
        console.error('Error resetting mock jobs:', e);
      }
      return [];
    }
  };
  
  // Helper to save mock jobs
  const saveMockJobs = (jobs) => {
    try {
      if (!Array.isArray(jobs)) {
        console.error('Attempted to save non-array data as jobs:', jobs);
        jobs = [];
      }
      
      const validJobs = jobs.filter(job => {
        return job && job._id && job.user && job.company && job.position;
      });
      
      if (validJobs.length !== jobs.length) {
        console.warn(`Filtered out ${jobs.length - validJobs.length} invalid job entries`);
      }
      
      localStorage.setItem(MOCK_JOBS_KEY, JSON.stringify(validJobs));
      console.log(`Saved ${validJobs.length} jobs to localStorage`);
    } catch (error) {
      console.error('Error saving mock jobs:', error);
      try {
        localStorage.setItem(MOCK_JOBS_KEY, JSON.stringify([]));
      } catch (e) {
        console.error('Error resetting mock jobs:', e);
      }
    }
  };

  const getMockResumes = () => {
    try {
      const storedResumes = localStorage.getItem(MOCK_RESUMES_KEY);
      
      // Check if storedResumes is null, undefined, empty string, or not valid JSON
      if (!storedResumes || storedResumes === 'undefined' || storedResumes === '') {
        // Initialize empty array in localStorage and return empty array
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
        return [];
      }
      
      // Try to parse, but be defensive
      try {
        return JSON.parse(storedResumes);
      } catch (parseError) {
        console.error('Error parsing resume data:', parseError);
        // Reset to empty array if parsing fails
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
        return [];
      }
    } catch (error) {
      console.error('Error retrieving mock resumes from localStorage:', error);
      // Initialize empty array in localStorage if there was an error
      try {
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
      } catch (e) {
        console.error('Error setting mock resumes in localStorage:', e);
      }
      return [];
    }
  };

  
  // Helper to save resumes to localStorage
  const saveMockResumes = (resumes) => {
    try {
      // Ensure resumes is an array
      if (!Array.isArray(resumes)) {
        console.error('Attempted to save non-array data as resumes:', resumes);
        resumes = [];
      }
      
      // Check for and filter out any invalid entries
      const validResumes = resumes.filter(resume => {
        // Ensure each resume has at least an ID and user property
        return resume && resume._id && resume.user;
      });
      
      if (validResumes.length !== resumes.length) {
        console.warn(`Filtered out ${resumes.length - validResumes.length} invalid resume entries`);
      }
      
      const resumesJson = JSON.stringify(validResumes);
      localStorage.setItem(MOCK_RESUMES_KEY, resumesJson);
      console.log(`Saved ${validResumes.length} resumes to localStorage`);
    } catch (error) {
      console.error('Error saving mock resumes to localStorage:', error);
      // Try to reset with empty array as a fallback
      try {
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
      } catch (e) {
        console.error('Error resetting mock resumes in localStorage:', e);
      }
    }
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage');
        return null;
      }
      
      // Handle mock tokens (development mode)
      if (token.startsWith('mock-token-')) {
        const parts = token.split('-');
        if (parts.length < 3) {
          console.warn('Mock token does not contain expected parts:', token);
          return null;
        }
        return parts[2];
      }
      
      // Handle real JWT tokens
      try {
        // Decode JWT token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Decoded JWT payload:', payload); // For debugging
        return payload.id;
      } catch (jwtError) {
        console.error('Error decoding JWT token:', jwtError);
        return null;
      }
      
    } catch (error) {
      console.error('Error retrieving user ID from token:', error);
      return null;
    }
  };

api.put = async function(url, data, config) {
  try {
    const response = await originalPut.call(this, url, data, config);
    return response;
  } catch (error) {
    console.log('=== BACKEND ERROR DEBUG ===');
    console.log('URL:', url);
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
    console.log('Full error response:', error.response);
    console.log('==========================');
    
    if (error.response && error.response.status === 400) {
      console.error('Backend returned 400 Bad Request:', error.response.data);
      throw error;
    }
    
    if (error.response && error.response.status === 500) {
      console.error('Backend returned 500 Internal Server Error:', error.response.data);
      throw error;
    }
    
    console.warn(`API PUT to ${url} failed, using mock data`);
    
    const isNetworkError = error.code === 'ECONNABORTED' || 
                          error.message?.includes('Network Error') ||
                          error.message?.includes('timeout') ||
                          error.name === 'AbortError';
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      throw error;
    }
    
    const token = localStorage.getItem('token');
    const isRealToken = token && !token.startsWith('mock-token-');
    
    if (error.response && error.response.status === 500 && isRealToken) {
      console.error('Server error with real token - not falling back to mock data');
      throw error;
    }
    
    if (!isNetworkError && isRealToken) {
      console.error('API error with real backend - not using mock fallback');
      throw error;
    }
    
    console.warn('Falling back to mock data due to network error or mock token usage');
    
    if (url.includes('/resumes/') && url.includes('/default')) {
      console.info('Using mock data for setting default resume');

      const userId = getCurrentUserId();
      if (!userId) {
        throw { 
          response: { 
            status: 401, 
            data: { 
              success: false, 
              error: 'Not authorized' 
            } 
          } 
        };
      }
      
      // Check if we're mixing real and mock data
      if (isRealToken) {
        console.error('Cannot mix real backend data with mock localStorage data');
        throw {
          response: {
            status: 500,
            data: {
              success: false,
              error: 'Backend service unavailable. Please check your connection and try again.'
            }
          }
        };
      }
      
      // Extract resume ID from URL
      const resumeId = url.split('/')[2];
      console.log('Setting default for resume ID:', resumeId, 'for user:', userId);

      // Find the resume
      const mockResumes = getMockResumes();        
      const resumeIndex = mockResumes.findIndex(r => r._id === resumeId && r.user === userId);
      
      if (resumeIndex === -1) {
        console.error('Resume not found:', resumeId, 'for user:', userId);
        console.log('Available resumes:', mockResumes.filter(r => r.user === userId));
        throw {
          response: {
            status: 404,
            data: {
              success: false,
              error: 'Resume not found'
            }
          }
        };
      }
      
      // Check if already default
      if (mockResumes[resumeIndex].isDefault) {
        return {
          data: {
            success: true,
            data: mockResumes[resumeIndex]
          }
        };
      }
      
      // Set all resumes of this user as non-default first
      for (let i = 0; i < mockResumes.length; i++) {
        if (mockResumes[i].user === userId) {
          mockResumes[i].isDefault = false;
        }
      }
      
      // Set the selected resume as default
      mockResumes[resumeIndex].isDefault = true;
      mockResumes[resumeIndex].updatedAt = new Date().toISOString();
      saveMockResumes(mockResumes);
      
      console.log('Successfully set resume as default:', resumeId);
      
      return {
        data: {
          success: true,
          data: mockResumes[resumeIndex]
        }
      };
    }
    
    // For other errors that we haven't handled, re-throw
    throw error;
  }
};

  const matchPassword = async (enteredPassword, storedPassword) => {
    return enteredPassword === storedPassword;
  };
  
  const generateToken = (user) => {
    return `mock-token-${user.id}-${Date.now()}`;
  };
  
  api.get = async function(url, config) {
    try {

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); 

      return await originalGet.call(this, url, config);

    } catch (error) {
      const isNetworkError = error.message && error.message.includes('Network Error');
      if (isNetworkError) {
        console.warn(`Network error when calling ${url}. Using mock data instead.`);
      } else {
        console.warn(`API call to ${url} failed, using mock data`, error);
      }
      
      if (url === '/jobs' || url.startsWith('/jobs?')) {
          console.info('Using mock data for get jobs');
          const userId = getCurrentUserId();
          if (!userId) {
            throw { 
              response: { 
                status: 401, 
                data: { success: false, error: 'Not authorized' } 
              } 
            };
          }

          // Parse query parameters
          const urlObj = new URL('http://localhost' + url);
          const params = urlObj.searchParams;
          const status = params.get('status');
          const jobType = params.get('jobType');
          const search = params.get('search');
          const sortBy = params.get('sortBy') || 'updatedAt';
          const sortOrder = params.get('sortOrder') || 'desc';

          // Get all jobs for user
          const mockJobs = getMockJobs();
          let userJobs = mockJobs.filter(job => job.user === userId);

          // Apply filters
          if (status) {
            userJobs = userJobs.filter(job => job.status === status);
          }
          
          if (jobType) {
            userJobs = userJobs.filter(job => job.jobType === jobType);
          }
          
          if (search) {
            const searchLower = search.toLowerCase();
            userJobs = userJobs.filter(job => 
              job.company.toLowerCase().includes(searchLower) ||
              job.position.toLowerCase().includes(searchLower) ||
              job.location.toLowerCase().includes(searchLower) ||
              (job.notes && job.notes.toLowerCase().includes(searchLower)) ||
              (job.tags && job.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
          }

          // Apply sorting
          userJobs.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Handle date sorting
            if (sortBy.includes('Date') || sortBy.includes('At')) {
              aValue = new Date(aValue).getTime();
              bValue = new Date(bValue).getTime();
            }
            
            // Handle string sorting
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              aValue = aValue.toLowerCase();
              bValue = bValue.toLowerCase();
            }
            
            if (sortOrder === 'desc') {
              return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
              return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
          });

          return {
            data: {
              success: true,
              count: userJobs.length,
              data: userJobs
            }
          };
      }
      
      if (url === '/jobs/stats') {
        console.info('Using mock data for job stats');
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        const mockJobs = getMockJobs();
        const userJobs = mockJobs.filter(job => job.user === userId);

        // Calculate stats
        const stats = {
          total: userJobs.length,
          'Saved': 0,
          'Applied': 0,
          'Phone Screen': 0,
          'Interview': 0,
          'Technical Assessment': 0,
          'Offer': 0,
          'Rejected': 0,
          'Withdrawn': 0
        };

        userJobs.forEach(job => {
          stats[job.status] = (stats[job.status] || 0) + 1;
        });

        return {
          data: {
            success: true,
            data: stats
          }
        };
      }
      
      if (url === '/jobs/recent' || url.startsWith('/jobs/recent?')) {
        console.info('Using mock data for recent activity');
    
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        // Parse limit parameter
        const urlObj = new URL('http://localhost' + url);
        const limit = parseInt(urlObj.searchParams.get('limit')) || 10;

        const mockJobs = getMockJobs();
        const userJobs = mockJobs.filter(job => job.user === userId);

        // Sort by updatedAt and limit
        const recentJobs = userJobs
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, limit);

        // Transform to activity format
        const activities = recentJobs.map(job => {
          let type = 'Status Change';
          let date = job.updatedAt;
          
          // Determine activity type
          const createdTime = new Date(job.createdAt).getTime();
          const updatedTime = new Date(job.updatedAt).getTime();
          const appTime = job.applicationDate ? new Date(job.applicationDate).getTime() : null;
          
          if (Math.abs(createdTime - updatedTime) < 60000) {
            type = 'Job Added';
          } else if (appTime && Math.abs(appTime - updatedTime) < 60000) {
            type = 'Application Submitted';
          }
          
          return {
            id: job._id,
            date,
            company: job.company,
            position: job.position,
            status: job.status,
            type
          };
        });

        return {
          data: {
            success: true,
            count: activities.length,
            data: activities
          }
        };
      }
      
      if (url.startsWith('/jobs/') && !url.includes('/stats') && !url.includes('/recent')) {
        console.info('Using mock data for get jobs');
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        // Parse query parameters
        const urlObj = new URL('http://localhost' + url);
        const params = urlObj.searchParams;
        const status = params.get('status');
        const jobType = params.get('jobType');
        const search = params.get('search');
        const sortBy = params.get('sortBy') || 'updatedAt';
        const sortOrder = params.get('sortOrder') || 'desc';

        // Get all jobs for user
        const mockJobs = getMockJobs();
        let userJobs = mockJobs.filter(job => job.user === userId);

        // Apply filters
        if (status) {
          userJobs = userJobs.filter(job => job.status === status);
        }
        
        if (jobType) {
          userJobs = userJobs.filter(job => job.jobType === jobType);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          userJobs = userJobs.filter(job => 
            job.company.toLowerCase().includes(searchLower) ||
            job.position.toLowerCase().includes(searchLower) ||
            job.location.toLowerCase().includes(searchLower) ||
            (job.notes && job.notes.toLowerCase().includes(searchLower)) ||
            (job.tags && job.tags.some(tag => tag.toLowerCase().includes(searchLower)))
          );
        }

        // Apply sorting
        userJobs.sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];
          
          // Handle date sorting
          if (sortBy.includes('Date') || sortBy.includes('At')) {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          // Handle string sorting
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
          
          if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });

        return {
          data: {
            success: true,
            count: userJobs.length,
            data: userJobs
          }
        };
      }
      
      // Mock responses based on URL
      if (url === '/auth/me') {
        // Check for valid token
        const token = localStorage.getItem('token');
        if (!token || !token.startsWith('mock-token-')) {
          throw { response: { status: 401, data: { error: 'Not authorized' } } };
        }
        
        // Extract user id from token
        const userId = token.split('-')[2];
        const user = mockUsers.find(u => u.id === userId);
        
        if (!user) {
          throw { response: { status: 401, data: { error: 'User not found' } } };
        }
        
        return {
          data: {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              subscriptionTier: user.subscriptionTier,
              createdAt: user.createdAt
            }
          }
        };
      }
      if (url === '/resumes') {
        console.info('Using mock data for resumes');
        
        // Get user ID from token
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        // Get all resumes
        const mockResumes = getMockResumes();
        
        // CRITICAL FIX: Filter resumes for current user only
        const userResumes = Array.isArray(mockResumes) ? 
          mockResumes.filter(r => r.user === userId) : [];
        
        console.log(`Retrieved ${userResumes.length} resumes for user ${userId} out of ${mockResumes.length} total resumes`);
        
        return {
          data: {
            success: true,
            count: userResumes.length,
            data: userResumes
          }
        };
      }
      
      // Handle resume download
       if (url.startsWith('/resumes/') && url.includes('/download')) {
        console.info('Using mock data for resume download');
        
        const resumeId = url.split('/')[2];
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        const mockResumes = getMockResumes();
        const resume = mockResumes.find(r => r._id === resumeId && r.user === userId);
      
        if (!resume) {
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'Resume not found or not authorized to access'
              }
            }
          };
        }

        // For mock data, create a downloadable blob
        const mockContent = `Mock Resume: ${resume.name}\n\nThis is a sample resume file created for development purposes.\n\nFile: ${resume.file}\nVersion: ${resume.version}\nCreated: ${resume.createdAt}\nUpdated: ${resume.updatedAt}`;
        
        const blob = new Blob([mockContent], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = resume.originalFilename || `${resume.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        return { 
          data: { 
            success: true, 
            message: 'Download started' 
          } 
        };
      }
      
      
      // Handle resume preview
      if (url.startsWith('/resumes/') && url.includes('/preview')) {
        console.info('Using mock data for resume preview');
        
        const resumeId = url.split('/')[2];
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        const mockResumes = getMockResumes();
        const resume = mockResumes.find(r => r._id === resumeId && r.user === userId);
        
        if (!resume) {
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'Resume not found or not authorized to access'
              }
            }
          };
        }
        
        // For development purposes, return a data URL for preview
        // This creates a simple text-based preview of the mock resume
        const mockContent = `Mock Resume Preview\n\nName: ${resume.name}\nVersion: ${resume.version}\nFile: ${resume.file}\nCreated: ${new Date(resume.createdAt).toLocaleDateString()}\n\nThis is a mock resume created for development purposes. In a real application, this would display the actual PDF or document content.`;
        
        const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(mockContent)}`;
        
        return { 
          data: dataUrl
        };
      }
      
      // Handle individual resume retrieval
      if (url.startsWith('/resumes/') && !url.includes('/download') && !url.includes('/preview') && !url.includes('/default')) {
        console.info('Using mock data for resume details');
        
        // Extract resume ID from URL
        const resumeId = url.split('/')[2];
        
        // Get user ID from token
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        // Find the resume
        const mockResumes = getMockResumes();
        const resume = mockResumes.find(r => r._id === resumeId && r.user === userId);
        
        if (!resume) {
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'Resume not found'
              }
            }
          };
        }
        
        return {
          data: {
            success: true,
            data: resume
          }
        };
      }
      
      throw error;
    }
  };
  
  api.post = async function(url, data, config) {
    try {
      // Try the real API first
      return await originalPost.call(this, url, data, config);
    } catch (error) {
      console.warn(`API POST to ${url} failed, using mock data`);
      
      // Mock login response
      if (url === '/auth/login') {
        const { email, password } = data;
        const user = mockUsers.find(u => u.email === email);
        
        if (!user) {
          // User not found - provide a user-friendly error
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Invalid email or password' 
              } 
            } 
          };
        }
        
        // Verify password - for mock purposes, we directly compare passwords
        const isMatch = await matchPassword(password, user.password);
        if (!isMatch) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Invalid email or password' 
              } 
            } 
          };
        }
        
        console.info('Login successful for:', email);
        const token = generateToken(user);
        
        return {
          data: {
            success: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              subscriptionTier: user.subscriptionTier,
              createdAt: user.createdAt
            }
          }
        };
      } 
      // Mock register response
      else if (url === '/auth/register') {
        const { name, email, password } = data;
        
        // Check if user already exists
        if (mockUsers.some(u => u.email === email)) {
          console.error('Registration failed: Email already exists:', email);
          throw { 
            response: { 
              status: 400, 
              data: { 
                success: false, 
                error: 'User already exists' 
              } 
            } 
          };
        }
        
        // Create new mock user with a plaintext password for development mode
        const newUser = {
          id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, // More descriptive ID
          name,
          email,
          password: password, // Store plaintext password for mock system
          subscriptionTier: 'free',
          createdAt: new Date().toISOString()
        };
        
        // Add user and save to localStorage
        mockUsers.push(newUser);
        saveMockUsers();
        
        console.info('Registration successful for:', email, 'with ID:', newUser.id);
        const token = generateToken(newUser);
        
        return {
          data: {
            success: true,
            token,
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              subscriptionTier: newUser.subscriptionTier,
              createdAt: newUser.createdAt
            }
          }
        };
      }
      else if (url === '/auth/forgotpassword') {
        return {
          data: {
            success: true,
            data: 'Email sent'
          }
        };
      }
      // Handle resume upload
      else if (url === '/resumes') {
        console.info('Using mock data for resume upload');
        
         // Get user ID from token
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }

        const mockUsersString = localStorage.getItem(MOCK_USERS_KEY);
        let currentUser = null;
        if (mockUsersString) {
          const allMockUsers = JSON.parse(mockUsersString);
          currentUser = allMockUsers.find(user => user.id === userId);
        }
        
        if (!currentUser) {
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'User not found'
              }
            }
          };
        }
        
        // Check resume limit for free tier users
        if (currentUser.subscriptionTier === 'free') {
          // Get current resumes
          const mockResumes = getMockResumes();
          const userResumes = Array.isArray(mockResumes) ? 
            mockResumes.filter(r => r.user === userId) : [];
          
          // Free tier limit: 8 resumes
          const FREE_TIER_LIMIT = 8;
          
          if (userResumes.length >= FREE_TIER_LIMIT) {
            throw {
              response: {
                status: 403,
                data: {
                  success: false,
                  error: 'Free tier users can only have up to 8 resumes. Please upgrade your subscription to add more.',
                  tier: 'free',
                  limit: FREE_TIER_LIMIT,
                  current: userResumes.length
                }
              }
            };
          }
        }
        
        // Handle FormData
        let name, file, version;
        
        if (data instanceof FormData) {
          name = data.get('name');
          file = data.get('resumeFile');
          version = data.get('version') || '1.0';
        } else {
          // Handle JSON data format if not FormData
          name = data.name;
          file = { name: 'mock-file.pdf', size: 1024 * 100 }; // Mock file 100KB
          version = data.version || '1.0';
        }
        
        if (!file) {
          throw {
            response: {
              status: 400,
              data: {
                success: false,
                error: 'Please upload a file'
              }
            }
          };
        }
        
        if (!name) {
          throw {
            response: {
              status: 400,
              data: {
                success: false,
                error: 'Please provide a name for your resume'
              }
            }
          };
        }
        // Safely get current resumes
        let mockResumes = [];
        try {
          mockResumes = getMockResumes();
          console.log("Current mock resumes:", mockResumes);
        } catch (error) {
          console.error("Error getting mock resumes:", error);
          mockResumes = [];
        }
        
        // Check if this would be the first for the user
        const userResumes = Array.isArray(mockResumes) ? 
          mockResumes.filter(r => r.user === userId) : [];
        const isFirstForUser = userResumes.length === 0;
        
        
        // Create mock resume object
        const newResume = {
          _id: `${name.replace(/\s+/g, '-').toLowerCase()}-resume-${Date.now()}`,
          user: userId,
          name: name,
          file: file.name,
          version: version,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          isDefault: isFirstForUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add to mock resumes
        mockResumes.push(newResume);
        try {
          saveMockResumes(mockResumes);
          console.log("Saved new resume:", newResume);
        } catch (error) {
          console.error("Error saving mock resumes:", error);
          throw {
            response: {
              status: 500,
              data: {
                success: false,
                error: 'Error saving resume data'
              }
            }
          };
        }
        
        return {
          data: {
            success: true,
            data: newResume
          }
        };
      }

      else if (url === '/jobs') {
        console.info('Using mock data for create job');
    
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        // Validate required fields
        const { company, position, location, status } = data;
        if (!company || !position || !location || !status) {
          throw {
            response: {
              status: 400,
              data: {
                success: false,
                error: 'Please provide company, position, location, and status'
              }
            }
          };
        }

        // Create new job
        const newJob = {
          _id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user: userId,
          company: data.company,
          position: data.position,
          location: data.location,
          status: data.status,
          jobType: data.jobType || 'Full-time',
          applicationDate: data.applicationDate || new Date().toISOString(),
          url: data.url || '',
          salary: data.salary || '',
          contactName: data.contactName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          description: data.description || '',
          notes: data.notes || '',
          tags: data.tags || [],
          resume: data.resume || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to mock storage
        const mockJobs = getMockJobs();
        mockJobs.push(newJob);
        saveMockJobs(mockJobs);

        return {
          data: {
            success: true,
            data: newJob
          }
        };
      }
      throw error;
    }
  };
  
  api.put = async function(url, data, config) {
    try {
      // Try the real API first
      return await originalPut.call(this, url, data, config);
    } catch (error) {
      console.warn(`API PUT to ${url} failed, using mock data`);
      
      // Mock reset password response
      if (url.includes('/auth/resetpassword/')) {
        const { password } = data;
        // In a real app, we would validate the reset token
        // For mock purposes, just update the test user's password
        const testUser = mockUsers.find(u => u.email === 'test@example.com');
        if (testUser) {
          testUser.password = password;
          saveMockUsers();
        }
        
        return {
          data: {
            success: true,
            token: generateToken(testUser || mockUsers[0]),
            user: {
              id: testUser?.id || 'dev-user-1',
              name: testUser?.name || 'Test User',
              email: testUser?.email || 'test@example.com'
            }
          }
        };
      }

      else if (url === '/auth/password') {
        // Get current user from token
        const token = localStorage.getItem('token');
        if (!token) {
          throw { response: { status: 401, data: { error: 'Not authorized' } } };
        }
        
        // For simplicity, find any user in the mock database
        let allMockUsers = [];
        try {
          const mockUsersString = localStorage.getItem('job_tracker_mock_users');
          if (mockUsersString) {
            allMockUsers = JSON.parse(mockUsersString);
          } else {
            throw { response: { status: 500, data: { error: 'No mock users found' } } };
          }
        } catch (error) {
          throw { response: { status: 500, data: { error: 'Error parsing mock users' } } };
        }
        
        // Try to find the current user
        let currentUser = null;
        
        // If using a mock token, try to find a matching user
        if (token.startsWith('mock-token-')) {
          for (const user of allMockUsers) {
            if (token.includes(user.id)) {
              currentUser = user;
              break;
            }
          }
        }
        
        // If we still don't have a user, try using the first mock user
        if (!currentUser && allMockUsers.length > 0) {
          currentUser = allMockUsers[0];
        }
        
        // If we still don't have a user, we can't proceed
        if (!currentUser) {
          throw { response: { status: 404, data: { error: 'User not found' } } };
        }
        
        // Extract passwords from request data
        const { currentPassword, newPassword } = data;
        
        // Verify current password
        if (currentUser.password !== currentPassword) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Current password is incorrect' 
              } 
            } 
          };
        }
        
        // Update password and set passwordChangedAt
        const now = new Date().toISOString();
        
        // Find the user in the mock users array and update their password
        const userIndex = allMockUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) {
          throw { response: { status: 500, data: { error: 'Could not update password' } } };
        }
        
        allMockUsers[userIndex].password = newPassword;
        allMockUsers[userIndex].passwordChangedAt = now;
        
        // Save updated users
        try {
          localStorage.setItem('job_tracker_mock_users', JSON.stringify(allMockUsers));
          
          return {
            data: {
              success: true,
              message: 'Password updated successfully'
            }
          };
        } catch (error) {
          throw {
            response: {
              status: 500,
              data: {
                success: false,
                error: 'Error saving updated password'
              }
            }
          };
        }
      }

      if (url === '/auth/updateprofile') {
        // Get current user from token
        const token = localStorage.getItem('token');
        if (!token || !token.startsWith('mock-token-')) {
          throw { response: { status: 401, data: { error: 'Not authorized' } } };
        }
        
        // Extract user id from token
        const userId = token.split('-')[2];
        const userIndex = mockUsers.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw { response: { status: 404, data: { error: 'User not found' } } };
        }
        
        // Update user fields
        if (data.name) mockUsers[userIndex].name = data.name;
        if (data.email) {
          // Check if email is already in use by another user
          const emailExists = mockUsers.findIndex(u => u.email === data.email && u.id !== userId);
          if (emailExists !== -1) {
            throw { 
              response: { 
                status: 400, 
                data: { 
                  success: false, 
                  error: 'Email already in use' 
                } 
              } 
            };
          }
          mockUsers[userIndex].email = data.email;
        }
        
        // Save updated users
        saveMockUsers();
        
        return {
          data: {
            success: true,
            user: {
              id: mockUsers[userIndex].id,
              name: mockUsers[userIndex].name,
              email: mockUsers[userIndex].email,
              subscriptionTier: mockUsers[userIndex].subscriptionTier,
              createdAt: mockUsers[userIndex].createdAt
            }
          }
        };
      }
      
      // Handle setting a resume as default
      if (url.includes('/resumes/') && url.includes('/default')) {
        console.info('Using mock data for setting default resume');

        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        // Extract resume ID from URL
        const resumeId = url.split('/')[2];
        console.log('Setting default for resume ID:', resumeId, 'for user:', userId);

        // Find the resume
        const mockResumes = getMockResumes();        
        const resumeIndex = mockResumes.findIndex(r => r._id === resumeId && r.user === userId);
        
        if (resumeIndex === -1) {
          console.error('Resume not found:', resumeId, 'for user:', userId);
          console.log('Available resumes:', mockResumes.filter(r => r.user === userId));
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'Resume not found'
              }
            }
          };
        }
        
        // Check if already default
        if (mockResumes[resumeIndex].isDefault) {
          return {
            data: {
              success: true,
              data: mockResumes[resumeIndex]
            }
          };
        }
        
        // Set all resumes of this user as non-default first
        for (let i = 0; i < mockResumes.length; i++) {
          if (mockResumes[i].user === userId) {
            mockResumes[i].isDefault = false;
          }
        }
        
        // Set the selected resume as default
        mockResumes[resumeIndex].isDefault = true;
        mockResumes[resumeIndex].updatedAt = new Date().toISOString();
        saveMockResumes(mockResumes);
        
        console.log('Successfully set resume as default:', resumeId);
        
        return {
          data: {
            success: true,
            data: mockResumes[resumeIndex]
          }
        };
      }

      else if (url.startsWith('/jobs/') && !url.includes('/default')) {
        console.info('Using mock data for update job');
    
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        // Extract job ID from URL
        const jobId = url.split('/')[2];
        
        const mockJobs = getMockJobs();
        const jobIndex = mockJobs.findIndex(j => j._id === jobId && j.user === userId);
        
        if (jobIndex === -1) {
          throw {
            response: {
              status: 404,
              data: { success: false, error: 'Job not found' }
            }
          };
        }

        // Update job
        const updatedJob = {
          ...mockJobs[jobIndex],
          ...data,
          updatedAt: new Date().toISOString()
        };

        mockJobs[jobIndex] = updatedJob;
        saveMockJobs(mockJobs);

        return {
          data: {
            success: true,
            data: updatedJob
          }
        };
      }

      
      // For other URLs, let the error propagate
      throw error;
    }
  };
  
  // Add delete method for mock data
  api.delete = async function(url, config) {
    try {
      // Try the real API first
      return await originalDelete(url, config);
    } catch (error) {
      console.warn(`API DELETE to ${url} failed, using mock data`);
      
      // Handle resume deletion
      if (url.includes('/resumes/')) {
        console.info('Using mock data for deleting resume');
        
        // Get user ID from token
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { 
                success: false, 
                error: 'Not authorized' 
              } 
            } 
          };
        }
        
        // Extract resume ID from URL
        const resumeId = url.split('/')[2];
        
        // Get all resumes
        const mockResumes = getMockResumes();
        
        // Find the resume
        const resumeIndex = mockResumes.findIndex(r => r._id === resumeId && r.user === userId);
        
        if (resumeIndex === -1) {
          throw {
            response: {
              status: 404,
              data: {
                success: false,
                error: 'Resume not found'
              }
            }
          };
        }
        
        // Check if it's the default resume
        if (mockResumes[resumeIndex].isDefault) {
          throw {
            response: {
              status: 400,
              data: {
                success: false,
                error: 'Cannot delete the default resume. Please set another resume as default first.'
              }
            }
          };
        }
        
        // Remove the resume
        mockResumes.splice(resumeIndex, 1);
        saveMockResumes(mockResumes);
        
        return {
          data: {
            success: true,
            data: {}
          }
        };
      }

      if (url.startsWith('/jobs/')) {
        console.info('Using mock data for delete job');
    
        const userId = getCurrentUserId();
        if (!userId) {
          throw { 
            response: { 
              status: 401, 
              data: { success: false, error: 'Not authorized' } 
            } 
          };
        }

        const jobId = url.split('/')[2];
        
        const mockJobs = getMockJobs();
        const jobIndex = mockJobs.findIndex(j => j._id === jobId && j.user === userId);
        
        if (jobIndex === -1) {
          throw {
            response: {
              status: 404,
              data: { success: false, error: 'Job not found' }
            }
          };
        }

        // Remove job
        mockJobs.splice(jobIndex, 1);
        saveMockJobs(mockJobs);

        return {
          data: {
            success: true,
            data: {}
          }
        };
      }
      
      throw error;
    }
  };
  
}

export default api;