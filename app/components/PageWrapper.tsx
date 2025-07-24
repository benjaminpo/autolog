import React from 'react';
import { usePageLayout } from '../hooks/usePageLayout';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import PageContainer from './PageContainer';
import { PageHeader } from './PageHeader';

interface PageWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  showHeader?: boolean;
  containerClassName?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  loadingMessage = 'Loading...',
  error,
  onRetry,
  showHeader = true,
  containerClassName = 'p-3 md:p-6',
}) => {
  const { loading } = usePageLayout();

  if (loading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error && onRetry) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <main className="flex-grow overflow-auto transition-colors">
      <PageContainer className={containerClassName}>
        {showHeader && <PageHeader />}
        {children}
      </PageContainer>
    </main>
  );
};
