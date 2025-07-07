'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const { data: session } = useSession();

  // Detect system preference
  const getSystemTheme = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  // Update isDark based on theme setting
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemIsDark = getSystemTheme();
        setIsDark(systemIsDark);
        updateDocumentClass(systemIsDark);
      } else {
        const isThemeDark = theme === 'dark';
        setIsDark(isThemeDark);
        updateDocumentClass(isThemeDark);
      }
    };

    updateTheme();

    // Listen for system theme changes if using system preference
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Update document class
  const updateDocumentClass = (dark: boolean) => {
    if (typeof window !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Load theme from localStorage or user preferences
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First try to load from localStorage
        let savedTheme: Theme | null = null;
        try {
          savedTheme = localStorage.getItem('theme') as Theme;
        } catch (error) {
          console.error('Error reading theme preference from localStorage:', error);
        }
        
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setTheme(savedTheme);
          return;
        }

        // If user is logged in, try to load from user preferences
        if (session?.user) {
          const response = await fetch('/api/user-preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.preferences.theme) {
              setTheme(data.preferences.theme);
              try {
                localStorage.setItem('theme', data.preferences.theme);
              } catch (error) {
                console.error('Error setting theme preference to localStorage:', error);
              }
              return;
            }
          }
        }

        // Default to system preference
        setTheme('system');
        try {
          localStorage.setItem('theme', 'system');
        } catch (error) {
          console.error('Error setting default theme to localStorage:', error);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        setTheme('system');
      }
    };

    loadTheme();
  }, [session]);

  // Save theme preference
  const saveThemePreference = async (newTheme: Theme) => {
    // Always save to localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme preference to localStorage:', error);
    }

    // If user is logged in, also save to their profile
    if (session?.user) {
      try {
        const response = await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: newTheme }),
        });

        if (!response.ok) {
          console.error('Failed to update theme preference');
        }
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    handleSetTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme: handleSetTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 