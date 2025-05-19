'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// Create Auth Context
const AuthContext = createContext();

// Provider component that wraps app and provides auth context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('token');
          
          if (storedToken) {
            setToken(storedToken);
            
            try {
              // Fetch current user data
              const response = await api.get('/api/auth/me');
              setUser(response.data.user);
            } catch (apiError) {
              console.error('API connection failed:', apiError);
              
              // For development purposes - simulate a user if API is not available
              if (process.env.NODE_ENV === 'development') {
                console.warn('Using mock user data for development');
                setUser({
                  id: 'mock-user-id',
                  name: 'Development User',
                  email: 'dev@example.com',
                  subscriptionTier: 'free',
                  createdAt: new Date().toISOString()
                });
              } else {
                // In production, clear auth state on API error
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/register', userData);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('token', response.data.token);
      
      router.push('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('token', response.data.token);
      
      router.push('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const googleAuth = async (googleData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/google', googleData);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('token', response.data.token);
      
      router.push('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.response?.data?.error || 'Google authentication failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Apple authentication
  const appleAuth = async (appleData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/apple', appleData);
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('token', response.data.token);
      
      router.push('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Apple auth error:', error);
      setError(error.response?.data?.error || 'Apple authentication failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.response?.data?.error || 'Failed to send password reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (resetToken, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/api/auth/resetpassword/${resetToken}`, { password });
      
      setUser(response.data.user);
      setToken(response.data.token);
      
      localStorage.setItem('token', response.data.token);
      
      router.push('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.error || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    router.push('/');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put('/api/users/profile', userData);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        googleAuth,
        appleAuth,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;