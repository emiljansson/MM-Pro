import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Production URL as fallback
const PRODUCTION_API = 'https://api.mathematicsmaster.app';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API;

// Unique storage prefix for this app (MM-Pro)
// This prevents data collision with MM-Free which uses '@mmfree_'
const STORAGE_PREFIX = '@mmpro_';

// Helper function for safe storage operations
const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.warn('AsyncStorage getItem error:', error);
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, value);
  } catch (error) {
    console.warn('AsyncStorage setItem error:', error);
  }
};

const safeRemoveItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.warn('AsyncStorage removeItem error:', error);
  }
};

export interface User {
  user_id: string;
  email: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  picture?: string;
  language: string;
  role: string;
  is_pro: boolean;
  statistics: {
    games_played: number;
    total_correct: number;
    total_questions: number;
    best_streak: number;
    current_streak: number;
    total_time_played: number;
    category_stats: Record<string, any>;
  };
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, displayName: string, password: string, language: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: (identityToken: string, userData?: { given_name?: string; family_name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await safeGetItem('session_token');
      if (token) {
        setSessionToken(token);
        await fetchUser(token);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear storage
        await safeRemoveItem('session_token');
        setSessionToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await safeSetItem('session_token', data.session_token);
        setSessionToken(data.session_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, displayName: string, password: string, language: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          display_name: displayName,
          password,
          language,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await safeSetItem('session_token', data.session_token);
        setSessionToken(data.session_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const loginWithGoogle = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();

      if (response.ok) {
        await safeSetItem('session_token', data.session_token);
        setSessionToken(data.session_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Google login failed' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const loginWithApple = async (identityToken: string, userData?: { given_name?: string; family_name?: string }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identity_token: identityToken,
          user_data: userData || {}
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await safeSetItem('session_token', data.session_token);
        setSessionToken(data.session_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Apple login failed' };
      }
    } catch (error) {
      console.error('Apple login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await safeRemoveItem('session_token');
      setSessionToken(null);
      setUser(null);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const refreshUser = async () => {
    if (sessionToken) {
      await fetchUser(sessionToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionToken,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
