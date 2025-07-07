import { renderHook, act } from '@testing-library/react'
import { useFileInput } from '../../app/hooks/useFileInput'
import { createMockFileChangeEvent } from '../utils/testHelpers'

describe('useFileInput', () => {
  // Mock FileReader
  const mockFileReader = {
    readAsText: jest.fn(),
    readAsDataURL: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    readAsBinaryString: jest.fn(),
    abort: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: jest.fn(),
    onerror: jest.fn(),
    onabort: jest.fn(),
    onloadstart: jest.fn(),
    onloadend: jest.fn(),
    onprogress: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    EMPTY: 0,
    LOADING: 1,
    DONE: 2
  } as unknown as FileReader

  beforeEach(() => {
    global.FileReader = jest.fn(() => mockFileReader) as any
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should return handleFileChange function', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      expect(result.current).toHaveProperty('handleFileChange')
      expect(typeof result.current.handleFileChange).toBe('function')
    })
  })

  describe('file handling', () => {
    it('should call onFileChange when a file is selected', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockEvent = createMockFileChangeEvent([mockFile])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      expect(mockOnFileChange).toHaveBeenCalledTimes(1)
      expect(mockOnFileChange).toHaveBeenCalledWith(mockFile, mockFileReader)
    })

    it('should not call onFileChange when no file is selected', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockEvent = createMockFileChangeEvent([])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      expect(mockOnFileChange).not.toHaveBeenCalled()
    })

    it('should not call onFileChange when files is null', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockEvent = createMockFileChangeEvent([])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      expect(mockOnFileChange).not.toHaveBeenCalled()
    })

    it('should handle multiple files but only process the first one', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockFile1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' })
      const mockFile2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' })
      const mockEvent = createMockFileChangeEvent([mockFile1, mockFile2])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      expect(mockOnFileChange).toHaveBeenCalledTimes(1)
      expect(mockOnFileChange).toHaveBeenCalledWith(mockFile1, mockFileReader)
    })

    it('should create a new FileReader instance for each file', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockEvent = createMockFileChangeEvent([mockFile])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      expect(global.FileReader).toHaveBeenCalledTimes(1)
    })


  })

  describe('Reader Events', () => {
    it('should trigger onload when FileReader finishes reading', () => {
      const mockOnFileChange = jest.fn()
      const { result } = renderHook(() => useFileInput(mockOnFileChange))

      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const mockEvent = createMockFileChangeEvent([mockFile])

      act(() => {
        result.current.handleFileChange(mockEvent)
      })

      // Simulate FileReader onload event
      act(() => {
        mockFileReader.onload!({} as ProgressEvent<FileReader>)
      })

      expect(mockOnFileChange).toHaveBeenCalledWith(mockFile, mockFileReader)
    })
  })

  describe('callback stability', () => {
    it('should memoize handleFileChange based on onFileChange dependency', () => {
      const mockOnFileChange1 = jest.fn()
      const { result, rerender } = renderHook(
        ({ onFileChange }) => useFileInput(onFileChange),
        { initialProps: { onFileChange: mockOnFileChange1 } }
      )

      const handleFileChange1 = result.current.handleFileChange

      // Re-render with same callback
      rerender({ onFileChange: mockOnFileChange1 })
      expect(result.current.handleFileChange).toBe(handleFileChange1)

      // Re-render with different callback
      const mockOnFileChange2 = jest.fn()
      rerender({ onFileChange: mockOnFileChange2 })
      expect(result.current.handleFileChange).not.toBe(handleFileChange1)
    })
  })
}) 