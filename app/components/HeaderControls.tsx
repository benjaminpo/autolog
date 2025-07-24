import React from 'react';
import { AuthButton } from './AuthButton';
import { GlobalLanguageSelector } from './GlobalLanguageSelector';
import { SimpleThemeToggle } from './ThemeToggle';

interface HeaderControlsProps {
  className?: string;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <GlobalLanguageSelector />
      <SimpleThemeToggle />
      <AuthButton />
    </div>
  );
};
