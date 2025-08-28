import { renderHook, act } from '@testing-library/react';
import { useDataLoading } from '../../app/hooks/useDataLoading';

describe('useDataLoading', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useDataLoading());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.retry).toBe('function');
  });

  it('sets loading state when loadData is called', async () => {
    const mockLoadFunction = jest.fn().mockResolvedValue('test data');
    const { result } = renderHook(() => useDataLoading());

    act(() => {
      result.current.loadData(mockLoadFunction);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets data and clears loading state on successful load', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    const mockLoadFunction = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData(mockLoadFunction);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLoadFunction).toHaveBeenCalledTimes(1);
  });

  it('sets error and clears loading state on failed load', async () => {
    const mockError = new Error('Load failed');
    const mockLoadFunction = jest.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData(mockLoadFunction);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Load failed');
    expect(mockLoadFunction).toHaveBeenCalledTimes(1);
  });

  it('handles non-Error objects in catch block', async () => {
    const mockErrorString = 'String error';
    const mockLoadFunction = jest.fn().mockRejectedValue(mockErrorString);
    const { result } = renderHook(() => useDataLoading());

    await act(async () => {
      await result.current.loadData(mockLoadFunction);
    });

    expect(result.current.error).toBe('Failed to load data');
    expect(result.current.isLoading).toBe(false);
  });

  it('retry function calls the last load function', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    const mockLoadFunction = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useDataLoading());

    // Initial load
    await act(async () => {
      await result.current.loadData(mockLoadFunction);
    });

    expect(mockLoadFunction).toHaveBeenCalledTimes(1);

    // Retry
    await act(async () => {
      await result.current.retry();
    });

    expect(mockLoadFunction).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(mockData);
  });

  it('retry function handles case when no load function was called before', async () => {
    const { result } = renderHook(() => useDataLoading());

    // Try to retry without calling loadData first
    await act(async () => {
      await result.current.retry();
    });

    // Should not throw and should maintain initial state
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('maintains loading state consistency during sequential loads', async () => {
    const mockLoadFunction1 = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('data1'), 100))
    );
    const mockLoadFunction2 = jest.fn().mockResolvedValue('data2');
    const { result } = renderHook(() => useDataLoading());

    // Start first load
    act(() => {
      result.current.loadData(mockLoadFunction1);
    });
    expect(result.current.isLoading).toBe(true);

    // Start second load before first finishes
    await act(async () => {
      await result.current.loadData(mockLoadFunction2);
    });

    expect(result.current.data).toBe('data2');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('clears previous error when new load is successful', async () => {
    const mockErrorFunction = jest.fn().mockRejectedValue(new Error('First error'));
    const mockSuccessFunction = jest.fn().mockResolvedValue('success data');
    const { result } = renderHook(() => useDataLoading());

    // First load fails
    await act(async () => {
      await result.current.loadData(mockErrorFunction);
    });

    expect(result.current.error).toBe('First error');
    expect(result.current.data).toEqual([]);

    // Second load succeeds
    await act(async () => {
      await result.current.loadData(mockSuccessFunction);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('success data');
    expect(result.current.isLoading).toBe(false);
  });

  it('preserves previous data when new load fails', async () => {
    const mockSuccessFunction = jest.fn().mockResolvedValue('initial data');
    const mockErrorFunction = jest.fn().mockRejectedValue(new Error('Later error'));
    const { result } = renderHook(() => useDataLoading());

    // First load succeeds
    await act(async () => {
      await result.current.loadData(mockSuccessFunction);
    });

    expect(result.current.data).toBe('initial data');
    expect(result.current.error).toBeNull();

    // Second load fails
    await act(async () => {
      await result.current.loadData(mockErrorFunction);
    });

    expect(result.current.data).toBe('initial data'); // Should preserve previous data
    expect(result.current.error).toBe('Later error');
    expect(result.current.isLoading).toBe(false);
  });
});
