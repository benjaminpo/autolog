import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '../../app/hooks/useInfiniteScroll'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

window.IntersectionObserver = mockIntersectionObserver

describe('useInfiniteScroll', () => {
  const mockItems = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: (i + 1) * 10
  }))

  const defaultProps = {
    items: mockItems,
    itemsPerPage: 10
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockIntersectionObserver.mockClear()
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useInfiniteScroll(defaultProps))

      expect(result.current.visibleItems).toHaveLength(10)
      expect(result.current.visibleItems[0]).toEqual({ id: 1, name: 'Item 1', value: 10 })
      expect(result.current.visibleItems[9]).toEqual({ id: 10, name: 'Item 10', value: 100 })
      expect(result.current.canLoadMore).toBe(true)
      expect(result.current.loadingRef).toEqual({ current: null })
    })

    it('should set up IntersectionObserver on mount', () => {
      renderHook(() => useInfiniteScroll(defaultProps))

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          threshold: 0.1,
          rootMargin: '100px'
        }
      )
    })

    it('should handle empty items array', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({
          ...defaultProps,
          items: []
        })
      )

      expect(result.current.visibleItems).toEqual([])
      expect(result.current.canLoadMore).toBe(false)
    })
  })

  describe('pagination', () => {
    it('should show more items when loadMore is triggered', () => {
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const { result } = renderHook(() => useInfiniteScroll(defaultProps))

      expect(result.current.visibleItems).toHaveLength(10)

      // Simulate intersection observer trigger
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(20)
      expect(result.current.visibleItems[19]).toEqual({ id: 20, name: 'Item 20', value: 200 })
    })

    it('should not load more when loading is true', () => {
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const { result } = renderHook(() => 
        useInfiniteScroll({
          ...defaultProps,
          loading: true
        })
      )

      expect(result.current.visibleItems).toHaveLength(10)

      // Simulate intersection observer trigger while loading
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(10) // Should not change
    })

    it('should call onLoadMore when all local items are loaded', () => {
      const mockOnLoadMore = jest.fn()
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const smallItems = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: (i + 1) * 10
      }))

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallItems,
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: mockOnLoadMore
        })
      )

      // Load first page beyond local items
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(15) // All local items

      // Try to load more - should call onLoadMore
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(mockOnLoadMore).toHaveBeenCalledTimes(1)
    })

    it('should not call onLoadMore when hasMore is false', () => {
      const mockOnLoadMore = jest.fn()
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const smallItems = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: (i + 1) * 10
      }))

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallItems,
          itemsPerPage: 10,
          hasMore: false,
          onLoadMore: mockOnLoadMore
        })
      )

      // Load all local items
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(15)

      // Try to load more - should not call onLoadMore
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(mockOnLoadMore).not.toHaveBeenCalled()
    })
  })

  describe('canLoadMore calculation', () => {
    it('should return true when there are more local items', () => {
      const { result } = renderHook(() => useInfiniteScroll(defaultProps))

      expect(result.current.canLoadMore).toBe(true)
    })

    it('should return true when hasMore and onLoadMore are provided', () => {
      const mockOnLoadMore = jest.fn()
      const smallItems = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallItems,
          itemsPerPage: 10,
          hasMore: true,
          onLoadMore: mockOnLoadMore
        })
      )

      expect(result.current.canLoadMore).toBe(true)
    })

    it('should return false when no more items and hasMore is false', () => {
      const smallItems = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallItems,
          itemsPerPage: 10,
          hasMore: false
        })
      )

      expect(result.current.canLoadMore).toBe(false)
    })
  })

  describe('reset functionality', () => {
    it('should reset pagination to first page', () => {
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const { result } = renderHook(() => useInfiniteScroll(defaultProps))

      // Load more items
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(20)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.visibleItems).toHaveLength(10)
    })
  })

  describe('items change handling', () => {
    it('should reset pagination when items length changes', () => {
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const { result, rerender } = renderHook(
        ({ items }) => useInfiniteScroll({ items, itemsPerPage: 10 }),
        { initialProps: { items: mockItems } }
      )

      // Load more items
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(20)

      // Change items array length
      const newItems = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        name: `New Item ${i + 1}`,
        value: (i + 1) * 5
      }))

      rerender({ items: newItems })

      expect(result.current.visibleItems).toHaveLength(10) // Should reset to first page
      expect(result.current.visibleItems[0]).toEqual({ id: 1, name: 'New Item 1', value: 5 })
    })

    it('should not reset when items array reference changes but length stays same', () => {
      let observerCallback: (entries: any[]) => void = () => {}
      
      mockIntersectionObserver.mockImplementation((callback) => {
        observerCallback = callback
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        }
      })

      const { result, rerender } = renderHook(
        ({ items }) => useInfiniteScroll({ items, itemsPerPage: 10 }),
        { initialProps: { items: mockItems } }
      )

      // Load more items
      act(() => {
        observerCallback([{ isIntersecting: true }])
      })

      expect(result.current.visibleItems).toHaveLength(20)

      // Create new array with same length and content
      const sameItems = [...mockItems]

      rerender({ items: sameItems })

      expect(result.current.visibleItems).toHaveLength(20) // Should maintain current page
    })
  })

  describe('different itemsPerPage values', () => {
    it('should handle different page sizes', () => {
      const pageSizes = [5, 15, 25]

      pageSizes.forEach(pageSize => {
        const { result } = renderHook(() => 
          useInfiniteScroll({
            items: mockItems,
            itemsPerPage: pageSize
          })
        )

        expect(result.current.visibleItems).toHaveLength(pageSize)
      })
    })

    it('should handle itemsPerPage larger than total items', () => {
      const smallItems = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))

      const { result } = renderHook(() => 
        useInfiniteScroll({
          items: smallItems,
          itemsPerPage: 20
        })
      )

      expect(result.current.visibleItems).toHaveLength(5)
      expect(result.current.canLoadMore).toBe(false)
    })
  })

  describe('intersection observer cleanup', () => {
    it('should disconnect observer on unmount', () => {
      const mockDisconnect = jest.fn()
      
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      })

      const { unmount } = renderHook(() => useInfiniteScroll(defaultProps))

      unmount()

      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
}) 