'use client';

import axios from 'axios';

// Get the base URL from environment variables or use a fallback for development
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Add a request interceptor
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

  // Add a response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle CORS errors specifically
      if (error.message && error.message.includes('Network Error')) {
        console.warn('Possible CORS or network issue:', error.message);
        
        // If error occurs during authentication check, handle gracefully
        if (error.config && error.config.url.includes('/auth/me')) {
          console.warn('Authentication check failed due to network issue');
          // Ensure token is still valid before removal
          try {
            const token = localStorage.getItem('token');
            if (token) {
              // Don't immediately remove the token on network errors
              // It might just be a temporary connectivity issue
              return Promise.reject({
                response: {
                  status: 0,
                  data: {
                    error: 'Network error. Please check your connection.'
                  }
                }
              });
            }
          } catch (e) {
            console.error('Error checking token in localStorage:', e);
          }
        }
      }
      
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        // Redirect to login page on unauthorized access
        try {
          localStorage.removeItem('token');
        } catch (e) {
          console.error('Error removing token from localStorage:', e);
        }
        
        if (typeof window !== 'undefined') {
          // Use a more gentle approach than immediate redirect
          // This prevents redirect loops
          if (!window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
}

// For development mode, create a mock API adapter that still respects authentication
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.info('Running in development mode - API calls may be simulated if server is unavailable');
  
  // Create a persistent mock user store using localStorage
  const MOCK_USERS_KEY = 'job_tracker_mock_users';
  const MOCK_RESUMES_KEY = 'job_tracker_mock_resumes';

  // Initialize with a default test user
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


  // Try to load any previously stored mock users
  try {
    const storedUsers = localStorage.getItem(MOCK_USERS_KEY);
    if (storedUsers) {
      mockUsers = JSON.parse(storedUsers);
      console.info('Loaded stored mock users:', mockUsers.length);
    } else {
      // Initialize the storage
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    }
    
    // Initialize mock resumes if they don't exist
    if (!localStorage.getItem(MOCK_RESUMES_KEY)) {
      localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
    } else {
      // Verify it's valid JSON
      try {
        const storedResumes = localStorage.getItem(MOCK_RESUMES_KEY);
        JSON.parse(storedResumes); // Just to test if it's valid JSON
        console.info('Successfully validated stored resumes');
      } catch (error) {
        console.warn('Invalid resumes data in localStorage, resetting to empty array');
        localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
      }
    }
  } catch (error) {
    console.error('Error accessing localStorage for mock data:', error);
    // Initialize with empty data if there was an error
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
      localStorage.setItem(MOCK_RESUMES_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Error initializing localStorage:', e);
    }
  }
  
  // Backup original methods to allow fallthrough
  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  const originalDelete = axios.delete.bind(axios);
  
  // Helper to save users to localStorage
  const saveMockUsers = () => {
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    } catch (error) {
      console.error('Error saving mock users to localStorage:', error);
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

  // Updated getCurrentUserId function in api.js
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage');
        return null;
      }
      
      if (!token.startsWith('mock-token-')) {
        console.warn('Token format is not recognized:', token);
        return null;
      }
      
      // Extract user ID directly from token
      const parts = token.split('-');
      if (parts.length < 3) {
        console.warn('Token does not contain expected parts:', token);
        return null;
      }
      
      return parts[2];
    } catch (error) {
      console.error('Error retrieving user ID from token:', error);
      return null;
    }
  };
  // Simple mock password compare function - in development mode we store plaintext passwords
  const matchPassword = async (enteredPassword, storedPassword) => {
    return enteredPassword === storedPassword;
  };
  
  // Mock token generation
  const generateToken = (user) => {
    return `mock-token-${user.id}-${Date.now()}`;
  };
  
  // Wrap API methods with mock data handling
  api.get = async function(url, config) {
    try {
      // Try the real API first
      return await originalGet.call(this, url, config);
    } catch (error) {
      // Check if it's a network error (server not running)
      const isNetworkError = error.message && error.message.includes('Network Error');
      if (isNetworkError) {
        console.warn(`Network error when calling ${url}. Using mock data instead.`);
      } else {
        console.warn(`API call to ${url} failed, using mock data`, error);
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
        
        // Extract resume ID from URL
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
        
        // Check if resume exists and belongs to user
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
        let sampleUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        
        if (resume.file) {
          const ext = resume.file.substring(resume.file.lastIndexOf('.') + 1).toLowerCase();
          if (ext === 'doc' || ext === 'docx') {
            sampleUrl = 'https://file-examples.com/storage/fe1aa0c9d563ea1e4a2add5/2017/02/file-sample_100kB.doc';
          }
        }
        
        // Return the URL directly so it can be used for download
        return { data: sampleUrl };
      }
      
      // Handle resume preview
      if (url.startsWith('/resumes/') && url.includes('/preview')) {
        console.info('Using mock data for resume preview');
        
        // Extract resume ID from URL
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
        
         // Check if resume exists and belongs to user
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
        
        // For development purposes, return a URL to a sample PDF in a viewer
        // We can use different sample URLs based on file extension
        let previewUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html?file=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        
        if (resume.file) {
          const ext = resume.file.substring(resume.file.lastIndexOf('.') + 1).toLowerCase();
          if (ext === 'doc' || ext === 'docx') {
            // For Word docs, we don't have a good online viewer by default
            // So we'll use Google Docs viewer with a sample file
            previewUrl = 'https://docs.google.com/viewer?url=https://file-examples.com/storage/fe1aa0c9d563ea1e4a2add5/2017/02/file-sample_100kB.doc&embedded=true';
          }
        }
        
        // Return the preview URL
        return { data: previewUrl };
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

         // Find the resume
        const mockResumes = getMockResumes();        
        const resumeIndex = mockResumes.findIndex(r => r._id === resumeId && r.user === userId);
        
        // Find the resume
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
        
        // Set all resumes of this user as non-default first
        for (let i = 0; i < mockResumes.length; i++) {
          if (mockResumes[i].user === userId) {
            mockResumes[i].isDefault = false;
          }
        }
        
        // Set the selected resume as default
        mockResumes[resumeIndex].isDefault = true;
        saveMockResumes(mockResumes);
        
        return {
          data: {
            success: true,
            data: mockResumes[resumeIndex]
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
      
      throw error;
    }
  };
}

export default api;