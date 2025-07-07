'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import translations, {
  Language as LanguageType,
  EnhancedTranslationType,
} from '../translations';

// Helper function to detect browser language
const detectBrowserLanguage = (): LanguageType => {
  if (typeof window === 'undefined') return 'en'; // Default for SSR

  // Get the browser's language preferences
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage;

  // Check if it starts with 'zh' (any Chinese variant)
  if (browserLang && browserLang.toLowerCase().startsWith('zh')) {
    return 'zh';
  }

  // Default to English for all other languages
  return 'en';
};

interface LanguageContextType {
  language: LanguageType;
  t: EnhancedTranslationType;
  setLanguage: (language: LanguageType) => void;
  saveLanguagePreference: (language: LanguageType) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageType>('en');
  const { data: session, status } = useSession();

  // Load language from localStorage on first load
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('preferredLanguage') as LanguageType;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
        setLanguage(savedLanguage);
      } else {
        // If no valid language is saved, fall back to browser detection
        const browserLanguage = detectBrowserLanguage();
        setLanguage(browserLanguage);
        try {
          localStorage.setItem('preferredLanguage', browserLanguage);
        } catch (error) {
          console.error('Error setting language preference to localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error reading language preference from localStorage:', error);
      // Fallback to browser detection if localStorage fails
      const browserLanguage = detectBrowserLanguage();
      setLanguage(browserLanguage);
    }
  }, []);

  // Load language from user preferences when user is logged in
  useEffect(() => {
    if (session?.user) {
      fetchUserPreferences();
    }
  }, [session]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences.language) {
          setLanguage(data.preferences.language);
          // Update localStorage to match
          localStorage.setItem('preferredLanguage', data.preferences.language);
        }
      }
    } catch (error) {
      console.error('Error fetching user language preferences:', error);
    }
  };

  const saveLanguagePreference = async (newLanguage: LanguageType) => {
    // Always save to localStorage for non-authenticated users and quick access
    try {
      localStorage.setItem('preferredLanguage', newLanguage);
    } catch (error) {
      console.error('Error saving language preference to localStorage:', error);
    }

    // If user is logged in, also save to their profile
    if (session?.user) {
      try {
        const response = await fetch('/api/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: newLanguage }),
        });

        if (!response.ok) {
          console.error('Failed to update language preference');
        }
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations[language],
        setLanguage: (newLanguage) => {
          setLanguage(newLanguage);
          saveLanguagePreference(newLanguage);
        },
        saveLanguagePreference
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper function to safely access nested translation keys
function getNestedTranslation(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key] as Record<string, unknown>;
    } else {
      return path; // Return the path as fallback if not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}
