'use client';

/**
 * Authentication Debug Utility
 * 
 * This module provides functions to help debug authentication issues in development mode.
 * It should NOT be included or used in production builds.
 */

// Get the current authentication state from localStorage
export const getAuthDebugInfo = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Auth debug tools should only be used in development mode');
    return null;
  }
  
  try {
    const token = localStorage.getItem('token');
    const mockUsers = localStorage.getItem('job_tracker_mock_users');
    
    return {
      currentToken: token,
      hasToken: !!token,
      tokenFormat: token ? (token.startsWith('mock-token-') ? 'Valid mock format' : 'Invalid format') : 'No token',
      decodedToken: token ? decodeToken(token) : null,
      mockUsers: mockUsers ? JSON.parse(mockUsers) : null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting auth debug info:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Simple decode for mock tokens (format: mock-token-userId-timestamp)
const decodeToken = (token) => {
  if (!token || !token.startsWith('mock-token-')) return null;
  
  const parts = token.split('-');
  if (parts.length < 4) return null;
  
  return {
    userId: parts[2],
    issuedAt: new Date(parseInt(parts[3])).toISOString()
  };
};

// Reset the mock user store (development only)
export const resetMockUsers = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Auth debug tools should only be used in development mode');
    return false;
  }
  
  try {
    // Default test user
    const defaultUsers = [
      {
        id: 'dev-user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        subscriptionTier: 'free',
        createdAt: new Date().toISOString()
      }
    ];
    
    localStorage.setItem('job_tracker_mock_users', JSON.stringify(defaultUsers));
    return true;
  } catch (error) {
    console.error('Error resetting mock users:', error);
    return false;
  }
};

// Clear all auth data from localStorage (development only)
export const clearAuthData = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Auth debug tools should only be used in development mode');
    return false;
  }
  
  try {
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Create a mock user
export const createMockUser = (userData) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Auth debug tools should only be used in development mode');
    return false;
  }
  
  try {
    const mockUsers = localStorage.getItem('job_tracker_mock_users');
    let users = mockUsers ? JSON.parse(mockUsers) : [];
    
    // Check if email already exists
    if (users.some(user => user.email === userData.email)) {
      console.error('User with this email already exists');
      return false;
    }
    
    const newUser = {
      id: `dev-user-${users.length + 1}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      subscriptionTier: userData.subscriptionTier || 'free',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('job_tracker_mock_users', JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error creating mock user:', error);
    return false;
  }
};

// Export debug functions to window object in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__authDebug = {
    getAuthDebugInfo,
    resetMockUsers,
    clearAuthData,
    createMockUser
  };
  
  console.info('Auth debug tools available via window.__authDebug');
}