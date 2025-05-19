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

// For development mode, create a mock API adapter
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.info('Running in development mode - API calls will be simulated if server is unavailable');
  
  // Backup original methods to allow fallthrough
  const originalGet = api.get;
  const originalPost = api.post;
  const originalPut = api.put;
  
  // Wrap API methods with mock data handling
  api.get = async function(url, config) {
    try {
      // Try the real API first
      return await originalGet.call(this, url, config);
    } catch (error) {
      console.warn(`API call to ${url} failed, using mock data`);
      
      // Mock responses based on URL
      if (url === '/api/auth/me') {
        return {
          data: {
            success: true,
            user: {
              id: 'mock-user-id',
              name: 'Development User',
              email: 'dev@example.com',
              subscriptionTier: 'free',
              createdAt: new Date().toISOString()
            }
          }
        };
      }
      
      // For other URLs, let the error propagate
      throw error;
    }
  };
  
  api.post = async function(url, data, config) {
    try {
      // Try the real API first
      return await originalPost.call(this, url, data, config);
    } catch (error) {
      console.warn(`API POST to ${url} failed, using mock data`);
      
      // Mock login/register responses
      if (url === '/api/auth/login' || url === '/api/auth/register' || 
          url === '/api/auth/google' || url === '/api/auth/apple') {
        return {
          data: {
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: 'mock-user-id',
              name: data.name || 'Development User',
              email: data.email || 'dev@example.com',
              subscriptionTier: 'free',
              createdAt: new Date().toISOString()
            }
          }
        };
      } else if (url === '/api/auth/forgotpassword') {
        return {
          data: {
            success: true,
            data: 'Email sent'
          }
        };
      }
      
      // For other URLs, let the error propagate
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
      if (url.includes('/api/auth/resetpassword/')) {
        return {
          data: {
            success: true,
            token: 'mock-jwt-token',
            user: {
              id: 'mock-user-id',
              name: 'Development User',
              email: 'dev@example.com'
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