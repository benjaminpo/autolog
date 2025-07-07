import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage,
  hasMore = true,
  onLoadMore,
  loading = false
}: UseInfiniteScrollOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const prevItemsLengthRef = useRef<number>(0);

  // Memoize visible items calculation
  const visibleItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (loading || !items || !Array.isArray(items)) return;
    
    const maxPages = Math.ceil(items.length / itemsPerPage);
    if (currentPage < maxPages) {
      setCurrentPage(prev => prev + 1);
    } else if (hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [currentPage, items, itemsPerPage, hasMore, onLoadMore, loading]);

  // Set up intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, loading]);

  // Reset when the actual number of items changes (not just array reference)
  useEffect(() => {
    const itemsLength = items && Array.isArray(items) ? items.length : 0;
    if (prevItemsLengthRef.current !== itemsLength) {
      prevItemsLengthRef.current = itemsLength;
      setCurrentPage(1);
    }
  }, [items]);

  const canLoadMore = useMemo(() => {
    const itemsLength = items && Array.isArray(items) ? items.length : 0;
    return currentPage * itemsPerPage < itemsLength || (hasMore && !!onLoadMore);
  }, [currentPage, itemsPerPage, items, hasMore, onLoadMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    visibleItems,
    canLoadMore,
    loadingRef,
    reset
  };
} 