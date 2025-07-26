'use client';

import { ReactNode } from 'react';
import PageContainer from './PageContainer';
import { TranslatedNavigation } from './TranslatedNavigation';
import { AuthButton } from './AuthButton';
import { GlobalLanguageSelector } from './GlobalLanguageSelector';
import { SimpleThemeToggle } from './ThemeToggle';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { useTranslation } from '../hooks/useTranslation';

interface HistoryPageLayoutProps {
  title: string;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

export default function HistoryPageLayout({
  title,
  isLoading,
  error,
  onRetry,
  children
}: HistoryPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 shadow z-20 border-b border-gray-200 dark:border-gray-700">
        <PageContainer>
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold">{title}</h1>
            <div className="flex items-center gap-2">
              <SimpleThemeToggle />
              <GlobalLanguageSelector darkMode={false} />
              <AuthButton />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Navigation Component */}
      <TranslatedNavigation showTabs={false} />

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          error={error}
          onRetry={onRetry || (() => {})}
        />
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <main className="flex-grow overflow-auto">
          <PageContainer className="p-3 md:p-6">
            {children}
          </PageContainer>
        </main>
      )}
    </div>
  );
}
