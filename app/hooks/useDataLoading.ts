import { useState, useCallback } from 'react';

interface UseDataLoadingReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  setData: (data: T[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadData: (fetcher: () => Promise<T[]>) => Promise<void>;
  retry: () => void;
}

export function useDataLoading<T>(
  initialData: T[] = [],
  onRetry?: () => Promise<void>
): UseDataLoadingReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryFn, setRetryFn] = useState<(() => Promise<T[]>) | null>(null);

  const loadData = useCallback(async (fetcher: () => Promise<T[]>) => {
    setIsLoading(true);
    setError(null);
    setRetryFn(() => fetcher);

    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    if (onRetry) {
      await onRetry();
    } else if (retryFn) {
      await loadData(retryFn);
    }
  }, [onRetry, retryFn, loadData]);

  return {
    data,
    isLoading,
    error,
    setData,
    setIsLoading,
    setError,
    loadData,
    retry
  };
}
