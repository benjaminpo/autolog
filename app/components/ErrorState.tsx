import React from 'react';
import PageContainer from './PageContainer';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  retryButtonText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryButtonText = 'Try Again'
}) => {
  return (
    <main className="flex-grow overflow-auto">
      <PageContainer className="p-3 md:p-6">
        <div className="text-center py-12">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {retryButtonText}
          </button>
        </div>
      </PageContainer>
    </main>
  );
};
