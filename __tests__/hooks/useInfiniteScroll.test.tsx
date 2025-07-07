import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useInfiniteScroll } from '../../app/hooks/useInfiniteScroll';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

describe('useInfiniteScroll', () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserver.mockClear();
  });

  describe('Basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(10);
      expect(result.current.canLoadMore).toBe(true);
      expect(result.current.loadingRef).toBeDefined();
    });

    it('should return all items when data is smaller than itemsPerPage', () => {
      const smallData = mockData.slice(0, 5);
      
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallData,
          itemsPerPage: 10,
          hasMore: false,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(5);
      expect(result.current.canLoadMore).toBe(false);
    });

    it('should handle empty data array', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: [],
          itemsPerPage: 10,
          hasMore: false,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(0);
      expect(result.current.canLoadMore).toBe(false);
    });
  });

  describe('Data updates', () => {
    it('should update visible items when data changes', () => {
      const { result, rerender } = renderHook(
        ({ items }) => 
          useInfiniteScroll({
            items,
            itemsPerPage: 10,
            hasMore: true,
            onLoadMore: jest.fn(),
          }),
        { initialProps: { items: mockData.slice(0, 20) } }
      );

      expect(result.current.visibleItems).toHaveLength(10);

      // Update data
      rerender({ items: mockData.slice(0, 30) });

      expect(result.current.visibleItems).toHaveLength(10);
    });

    it('should reset visible items when data is completely replaced', () => {
      const { result, rerender } = renderHook(
        ({ items }) => 
          useInfiniteScroll({
            items,
            itemsPerPage: 10,
            hasMore: true,
            onLoadMore: jest.fn(),
          }),
        { initialProps: { items: mockData.slice(0, 50) } }
      );

      expect(result.current.visibleItems).toHaveLength(10);

      // Replace with different data
      const newData = Array.from({ length: 30 }, (_, i) => ({ id: i + 1000, name: `New Item ${i}` }));
      rerender({ items: newData });

      expect(result.current.visibleItems).toHaveLength(10);
      expect(result.current.visibleItems[0].id).toBe(1000);
    });
  });

  describe('IntersectionObserver integration', () => {
    it('should setup IntersectionObserver on mount', () => {
      renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: jest.fn(),
        })
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
        })
      );
    });

    it('should cleanup IntersectionObserver on unmount', () => {
      const mockDisconnect = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      });

      const { unmount } = renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: jest.fn(),
        })
      );

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Load more functionality', () => {
    it('should call onLoadMore when intersection occurs', () => {
      const mockOnLoadMore = jest.fn();
      let intersectionCallback: (entries: any[]) => void;

      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      renderHook(() => 
        useInfiniteScroll({
          items: mockData.slice(0, 15), // Small dataset to trigger onLoadMore
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: mockOnLoadMore,
        })
      );

      // Simulate intersection
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });

      // Should load more pages first, then call onLoadMore
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });

      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('should not call onLoadMore when hasMore is false', () => {
      const mockOnLoadMore = jest.fn();
      let intersectionCallback: (entries: any[]) => void;

      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 10,
          hasMore: false,
          onLoadMore: mockOnLoadMore,
        })
      );

      // Simulate intersection
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });

      expect(mockOnLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: largeData,
          itemsPerPage: 50,
          hasMore: true,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(50);
      expect(result.current.canLoadMore).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined items gracefully', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: undefined as any,
          itemsPerPage: 10,
          hasMore: false,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(0);
      expect(result.current.canLoadMore).toBe(false);
    });

    it('should handle zero itemsPerPage', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 0,
          hasMore: true,
          onLoadMore: jest.fn(),
        })
      );

      expect(result.current.visibleItems).toHaveLength(0);
    });
  });

  describe('Reset functionality', () => {
    it('should reset pagination to first page', () => {
      let intersectionCallback: (entries: any[]) => void;
      
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: mockData,
          itemsPerPage: 10,
          hasMore: false,
        })
      );

      // Load more items
      act(() => {
        intersectionCallback([{ isIntersecting: true }]);
      });

      expect(result.current.visibleItems).toHaveLength(20);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.visibleItems).toHaveLength(10);
    });
  });
}); 