'use client';

import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface GlobalLanguageSelectorProps {
  darkMode?: boolean;
}

export function GlobalLanguageSelector({ darkMode = false }: GlobalLanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <LanguageSelector
      language={language}
      onChange={setLanguage}
      darkMode={darkMode}
    />
  );
}
