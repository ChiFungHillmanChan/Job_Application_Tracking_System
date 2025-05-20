'use client';

import axios from 'axios';

// Get the base URL from environment variables or use a fallback for development
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      if (error.response && error.response.status === 401) {
        // Redirect to login page on unauthorized access
        try {
          localStorage.removeItem('token');
        } catch (e) {
          console.error('Error removing token from localStorage:', e);
        }
        window.location.href = '/auth/login';
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
  
  // Initialize with a default test user
  let mockUsers = [
    {
      id: 'dev-user-1',
      name: 'Test User',
      email: 'test@example.com',
      // This is just a placeholder - in our mock system we'll compare plaintext passwords
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
  } catch (error) {
    console.error('Error accessing localStorage for mock users:', error);
  }
  
  // Backup original methods to allow fallthrough
  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  
  // Helper to save users to localStorage
  const saveMockUsers = () => {
    try {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
    } catch (error) {
      console.error('Error saving mock users to localStorage:', error);
    }
  };
  
  // Simple mock password compare function - in development mode we store plaintext passwords
  const matchPassword = async (enteredPassword, storedPassword) => {
    return enteredPassword === storedPassword;
  };
  
  // Mock token generation
  const generateToken = (user) => {
    // In a real app, this would use JWT signing
    // For mock purposes, create a simple encoded token
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
          id: `dev-user-${mockUsers.length + 1}`,
          name,
          email,
          password: password, // Store plaintext password for mock system
          subscriptionTier: 'free',
          createdAt: new Date().toISOString()
        };
        
        // Add user and save to localStorage
        mockUsers.push(newUser);
        saveMockUsers();
        
        console.info('Registration successful for:', email);
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
      
      // For other URLs, let the error propagate
      throw error;
    }
  };
}

export default api;