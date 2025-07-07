'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id as string,
        name: session.user.name || '',
        email: session.user.email || ''
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [session]);

  const login = async (email: string, password: string, language?: 'en' | 'zh') => {
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
      setError('An error occurred during login');
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
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
      setError('An error occurred during registration');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/login');
    } catch (_err) {
      // Silently fail if sign out fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, error, setError }}>
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
