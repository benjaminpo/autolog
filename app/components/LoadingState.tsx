import React from 'react';
import PageContainer from './PageContainer';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...'
}) => {
  const displayMessage = message || 'Loading...';

  return (
    <main className="flex-grow overflow-auto">
      <PageContainer className="p-3 md:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">{displayMessage}</span>
        </div>
      </PageContainer>
    </main>
  );
};
