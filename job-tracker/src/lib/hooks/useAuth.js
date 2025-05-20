'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Create the auth context with default values
const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: () => false,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  clearError: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Fetch current user data
          try {
            const response = await api.get('/auth/me');
            if (response.data && response.data.success && response.data.user) {
              setUser({
                ...response.data.user,
                passwordChangedAt: response.data.user.passwordChangedAt
              });
            } else {
              localStorage.removeItem('token');
              setToken(null);
              setError('Your session has expired. Please login again.');
            }
          } catch (error) {
            console.warn('Error fetching user data:', error);
            localStorage.removeItem('token');
            setToken(null);
            
            // Only set a user-visible error for authentication failures, not network issues
            if (error.response && error.response.status === 401) {
              setError('Your session has expired. Please login again.');
            } else if (!error.message?.includes('Network Error')) {
              setError('There was a problem loading your profile. Please try again later.');
            }
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
        // Clear token if there's any initialization error
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.success) {
        // Store token in localStorage
        try {
          localStorage.setItem('token', response.data.token);
        } catch (e) {
          console.warn('Failed to store token in localStorage:', e);
        }
        
        setToken(response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Registration response missing success data');
      }
    } catch (error) {
      console.warn('Registration error:', error || 'Unknown error');
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error && error.response?.data?.error) {
        // Handle both string and array error formats
        if (Array.isArray(error.response.data.error)) {
          errorMessage = error.response.data.error.join(', ');
        } else {
          errorMessage = error.response.data.error;
        }
      } else if (error && error.message) {
        // Handle specific error messages
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to the server. The application is running in offline mode.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error || new Error('Registration failed with unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    // Add validation for credentials
    if (!credentials || !credentials.email || !credentials.password) {
      const errorMsg = 'Email and password are required';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
    
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response && response.data && response.data.success) {
        // Store token in localStorage
        try {
          localStorage.setItem('token', response.data.token);
        } catch (e) {
          console.warn('Failed to store token in localStorage:', e);
        }
        
        setToken(response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Login response missing success data');
      }
    } catch (error) {
      // Handle the empty error object case
      if (!error || Object.keys(error).length === 0) {
        const errorMsg = 'Login failed with an unknown error';
        console.warn(errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.warn('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error && error.message) {
        // Handle specific error messages
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to the server. The application is running in offline mode.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Ensure we're always throwing an Error object
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      // Call logout endpoint if token exists
      if (token) {
        try {
          await api.get('/auth/logout');
        } catch (error) {
          console.warn('Logout API error:', error || 'Unknown error');
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      console.warn('Logout error:', error || 'Unknown error');
      // Continue with local logout even if an unexpected error occurs
    } finally {
      // Clear token regardless of API success/failure
      try {
        localStorage.removeItem('token');
      } catch (e) {
        console.warn('Error removing token from localStorage:', e || 'Unknown error');
      }
      setToken(null);
      setUser(null);
      setLoading(false);
      // Redirect to login
      router.push('/auth/login');
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put('/auth/updateprofile', profileData);
      
      if (response.data && response.data.success) {
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Profile update response missing success data');
      }
    } catch (error) {
      console.warn('Profile update error:', error || 'Unknown error');
      let errorMessage = 'Profile update failed. Please try again.';
      
      if (error && error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          errorMessage = error.response.data.error.join(', ');
        } else {
          errorMessage = error.response.data.error;
        }
      } else if (error && error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to the server. The application is running in offline mode.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error || new Error('Profile update failed with unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      setLoading(false);
      return response.data;
    } catch (error) {
      console.warn('Forgot password error:', error || 'Unknown error');
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error && error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to the server. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      throw error || new Error('Password reset request failed with unknown error');
    }
  };

  // Reset password
  const resetPassword = async (resetToken, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
      
      if (response.data && response.data.success) {
        // Store token in localStorage
        try {
          localStorage.setItem('token', response.data.token);
        } catch (e) {
          console.warn('Failed to store token in localStorage:', e);
        }
        
        setToken(response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Password reset response missing success data');
      }
    } catch (error) {
      console.warn('Reset password error:', error || 'Unknown error');
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (error && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error && error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to the server. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error || new Error('Password reset failed with unknown error');
    } finally {
      setLoading(false);
    }
  };

  
  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put('/auth/password', passwordData);
      
      if (response.data && response.data.success) {
        // Update the user data to include the new passwordChangedAt
        setUser(prevUser => ({
          ...prevUser,
          passwordChangedAt: new Date().toISOString()
        }));
        return response.data;
      } else {
        throw new Error('Password change response missing success data');
      }
    } catch (error) {
      console.error('Password change error:', error);
      let errorMessage = 'Password change failed. Please try again.';
      
      if (error && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
        changePassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;