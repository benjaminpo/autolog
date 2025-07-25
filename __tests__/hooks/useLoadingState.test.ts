import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '../../app/hooks/useLoadingState';

describe('useLoadingState Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with loading state true and no error', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('provides setError and setIsLoading functions', () => {
    const { result } = renderHook(() => useLoadingState());

    expect(typeof result.current.setError).toBe('function');
    expect(typeof result.current.setIsLoading).toBe('function');
    expect(typeof result.current.withLoading).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('handles successful async operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockOperation = jest.fn().mockResolvedValue('success');

    let operationResult: string | null = null;
    await act(async () => {
      operationResult = await result.current.withLoading(mockOperation);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult).toBe('success');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles failed async operation with default error message', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

    let operationResult: string | null = null;
    await act(async () => {
      operationResult = await result.current.withLoading(mockOperation);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('An error occurred. Please try again.');
    expect(console.error).toHaveBeenCalledWith('Loading operation failed:', expect.any(Error));
  });

  it('handles failed async operation with custom error message', async () => {
    const { result } = renderHook(() => useLoadingState());
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
    const customErrorMessage = 'Custom error message';

    let operationResult: string | null = null;
    await act(async () => {
      operationResult = await result.current.withLoading(mockOperation, customErrorMessage);
    });

    expect(operationResult).toBe(null);
    expect(result.current.error).toBe(customErrorMessage);
  });

  it('calls onError callback when provided', async () => {
    const mockOnError = jest.fn();
    const { result } = renderHook(() => useLoadingState({ onError: mockOnError }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      await result.current.withLoading(mockOperation, 'Custom error');
    });

    expect(mockOnError).toHaveBeenCalledWith('Custom error');
  });

  it('sets loading state correctly during operation', async () => {
    const { result } = renderHook(() => useLoadingState());
    let operationResolve: (value: string) => void;
    const mockOperation = jest.fn().mockImplementation(() => {
      return new Promise<string>((resolve) => {
        operationResolve = resolve;
      });
    });

    // Start the operation
    const operationPromise = act(async () => {
      return result.current.withLoading(mockOperation);
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    // Resolve the operation
    await act(async () => {
      operationResolve!('completed');
      await operationPromise;
    });

    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false);
  });
});
