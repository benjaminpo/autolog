'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, language?: 'en' | 'zh') => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || ''
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [session]);

  const login = useCallback(async (email: string, password: string, language?: 'en' | 'zh') => {
    try {
      setLoading(true);
      setError(null);
      const response = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (response?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return false;
      }

      // If language was specified during login, save it to user preferences
      if (language) {
        try {
          await fetch('/api/user-preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language }),
          });
        } catch (error) {
          console.error('Error saving language preference during login:', error);
        }
      }

      router.push('/');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setLoading(false);
      return false;
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return false;
      }

      // Auto login after successful registration
      return await login(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
      setLoading(false);
      return false;
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with redirect even if sign out fails
      router.push('/auth/login');
    }
  }, [router]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    error,
    setError
  }), [user, loading, error, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
