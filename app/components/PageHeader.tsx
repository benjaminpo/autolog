import React from 'react';
import { AuthButton } from './AuthButton';
import { TranslatedNavigation } from './TranslatedNavigation';
import { GlobalLanguageSelector } from './GlobalLanguageSelector';
import { SimpleThemeToggle } from './ThemeToggle';

interface PageHeaderProps {
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ className = '' }) => {
  return (
    <header className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <TranslatedNavigation />
      </div>
      <div className="flex items-center space-x-3">
        <GlobalLanguageSelector />
        <SimpleThemeToggle />
        <AuthButton />
      </div>
    </header>
  );
};
