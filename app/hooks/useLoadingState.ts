import { useState, useCallback } from 'react';

interface UseLoadingStateOptions {
  onError?: (error: string) => void;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncOperation();
      return result;
    } catch (err) {
      console.error('Loading operation failed:', err);
      const message = errorMessage || 'An error occurred. Please try again.';
      setError(message);
      if (options.onError) {
        options.onError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const retry = useCallback((asyncOperation: () => Promise<void>) => {
    return withLoading(asyncOperation);
  }, [withLoading]);

  return {
    isLoading,
    error,
    setError,
    setIsLoading,
    withLoading,
    retry
  };
};
