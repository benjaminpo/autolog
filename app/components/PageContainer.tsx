'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'elevated' | 'gradient' | 'none';
}

/**
 * Enhanced container component with optimized light mode styling.
 * Provides consistent max-width, padding, and background options across pages.
 */
export function PageContainer({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'md',
  background = 'default'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16'
  };

  const backgroundClasses = {
    default: 'bg-gray-50 dark:bg-gray-900',
    elevated: 'bg-white dark:bg-gray-800',
    gradient: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    none: ''
  };

  return (
    <div className={`mx-auto w-full transition-all duration-200 ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${backgroundClasses[background]} ${className}`}>
      {children}
    </div>
  );
}

export default PageContainer;
