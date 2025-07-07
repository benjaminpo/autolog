'use client';

import { useState, useEffect } from 'react';

interface LanguageSelectorProps {
  language: 'en' | 'zh';
  onChange: (lang: 'en' | 'zh') => void;
  darkMode?: boolean;
}

export function LanguageSelector({ language, onChange, darkMode = false }: LanguageSelectorProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after component mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <select
      value={language}
      onChange={(e) => onChange(e.target.value as 'en' | 'zh')}
      className={`p-1 border rounded text-xs ${
        darkMode
          ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
      } transition-colors`}
      aria-label="Select language"
      title="Language selection"
    >
      <option value="en">English</option>
      <option value="zh">中文</option>
    </select>
  );
}
