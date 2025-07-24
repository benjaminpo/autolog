import { renderHook, act } from '@testing-library/react';
import { useApiOperation, useExpenseEntries, useFuelEntries, useVehicles } from '../../app/hooks/useApiData';

// Mock the API client
jest.mock('../../app/lib/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getExpenseEntries: jest.fn(),
    createExpenseEntry: jest.fn(),
    updateExpenseEntry: jest.fn(),
    deleteExpenseEntry: jest.fn(),
    getFuelEntries: jest.fn(),
    createFuelEntry: jest.fn(),
    updateFuelEntry: jest.fn(),
    deleteFuelEntry: jest.fn(),
    getVehicles: jest.fn(),
    createVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    deleteVehicle: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/test',
  }),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user123' } },
    status: 'authenticated',
  }),
}));

const mockApiClient = require('../../app/lib/apiClient').apiClient;

describe('useApiOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApiOperation());

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful operation', async () => {
    const { result } = renderHook(() => useApiOperation());

    const mockData = { id: '1', name: 'Test' };
    const mockOperation = jest.fn().mockResolvedValue({
      success: true,
      data: mockData
    });

    await act(async () => {
      await result.current.execute(mockOperation);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle failed operation', async () => {
    const { result } = renderHook(() => useApiOperation());

    const mockOperation = jest.fn().mockResolvedValue({
      success: false,
      error: 'Operation failed'
    });

    await act(async () => {
      await result.current.execute(mockOperation);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Operation failed');
  });

  it('should handle operation exception', async () => {
    const { result } = renderHook(() => useApiOperation());

    const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.execute(mockOperation);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useApiOperation());

    // Set some initial state
    act(() => {
      result.current.execute(() => Promise.resolve({ success: true, data: { test: true } }));
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

describe('useExpenseEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch expenses on mount', async () => {
    const mockExpenses = [
      {
        id: '1',
        description: 'Fuel',
        amount: 50,
        category: 'Fuel',
        date: '2023-01-01',
        vehicleId: 'vehicle1',
        userId: 'user1'
      },
      {
        id: '2',
        description: 'Maintenance',
        amount: 100,
        category: 'Maintenance',
        date: '2023-01-02',
        vehicleId: 'vehicle1',
        userId: 'user1'
      },
    ];

    mockApiClient.getExpenseEntries.mockResolvedValue({
      success: true,
      data: { entries: mockExpenses }
    });

    const { result } = renderHook(() => useExpenseEntries());

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.expenses).toEqual(mockExpenses);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    mockApiClient.getExpenseEntries.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExpenseEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.expenses).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should create expense', async () => {
    const newExpense = {
      description: 'New Fuel',
      amount: 60,
      category: 'Fuel',
      date: '2023-01-03',
      vehicleId: 'vehicle1'
    };
    const createdExpense = { id: '3', ...newExpense, userId: 'user1' };

    mockApiClient.getExpenseEntries.mockResolvedValue({
      success: true,
      data: { entries: [] }
    });

    mockApiClient.createExpenseEntry.mockResolvedValue({
      success: true,
      data: { expense: createdExpense }
    });

    const { result } = renderHook(() => useExpenseEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.createExpense(newExpense);
    });

    expect(createResult).toEqual({ success: true });
    expect(result.current.expenses).toContain(createdExpense);
  });

  it('should update expense', async () => {
    const existingExpense = {
      id: '1',
      description: 'Fuel',
      amount: 50,
      category: 'Fuel',
      date: '2023-01-01',
      vehicleId: 'vehicle1',
      userId: 'user1'
    };
    const updatedExpense = { ...existingExpense, amount: 75 };

    mockApiClient.getExpenseEntries.mockResolvedValue({
      success: true,
      data: { entries: [existingExpense] }
    });

    mockApiClient.updateExpenseEntry.mockResolvedValue({
      success: true,
      data: { expense: updatedExpense }
    });

    const { result } = renderHook(() => useExpenseEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updateExpense('1', { amount: 75 });
    });

    expect(updateResult).toEqual({ success: true });
    expect(result.current.expenses[0].amount).toBe(75);
  });

  it('should delete expense', async () => {
    const existingExpense = {
      id: '1',
      description: 'Fuel',
      amount: 50,
      category: 'Fuel',
      date: '2023-01-01',
      vehicleId: 'vehicle1',
      userId: 'user1'
    };

    mockApiClient.getExpenseEntries.mockResolvedValue({
      success: true,
      data: { entries: [existingExpense] }
    });

    mockApiClient.deleteExpenseEntry.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useExpenseEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteExpense('1');
    });

    expect(deleteResult).toEqual({ success: true });
    expect(result.current.expenses).toHaveLength(0);
  });
});

describe('useFuelEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch fuel entries on mount', async () => {
    const mockEntries = [
      {
        id: '1',
        volume: 40,
        cost: 50,
        fuelType: 'Regular',
        time: '10:00',
        date: '2023-01-01',
        vehicleId: 'vehicle1',
        company: 'Shell',
        mileage: 50000
      },
      {
        id: '2',
        volume: 35,
        cost: 45,
        fuelType: 'Premium',
        time: '15:00',
        date: '2023-01-02',
        vehicleId: 'vehicle1',
        company: 'BP',
        mileage: 50100
      },
    ];

    mockApiClient.getFuelEntries.mockResolvedValue({
      success: true,
      data: { entries: mockEntries }
    });

    const { result } = renderHook(() => useFuelEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.entries).toEqual(mockEntries);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    mockApiClient.getFuelEntries.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFuelEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should create fuel entry', async () => {
    const newEntry = {
      volume: 30,
      cost: 40,
      fuelType: 'Regular',
      time: '12:00',
      date: '2023-01-03',
      vehicleId: 'vehicle1',
      company: 'Shell',
      mileage: 50200
    };
    const createdEntry = { id: '3', ...newEntry };

    mockApiClient.getFuelEntries.mockResolvedValue({
      success: true,
      data: { entries: [] }
    });

    mockApiClient.createFuelEntry.mockResolvedValue({
      success: true,
      data: { entry: createdEntry }
    });

    const { result } = renderHook(() => useFuelEntries());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.createEntry(newEntry);
    });

    expect(createResult).toEqual({ success: true });
    expect(result.current.entries).toContain(createdEntry);
  });
});

describe('useVehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch vehicles on mount', async () => {
    const mockVehicles = [
      { id: '1', name: 'Car 1', brand: 'Toyota', model: 'Camry' },
      { id: '2', name: 'Car 2', brand: 'Honda', model: 'Civic' },
    ];

    mockApiClient.getVehicles.mockResolvedValue({
      success: true,
      data: { vehicles: mockVehicles }
    });

    const { result } = renderHook(() => useVehicles());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.vehicles).toEqual(mockVehicles);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    mockApiClient.getVehicles.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVehicles());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.vehicles).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should refetch vehicles', async () => {
    const mockVehicles = [
      { id: '1', name: 'Car 1', brand: 'Toyota', model: 'Camry' },
    ];

    mockApiClient.getVehicles.mockResolvedValue({
      success: true,
      data: { vehicles: mockVehicles }
    });

    const { result } = renderHook(() => useVehicles());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Clear and refetch
    mockApiClient.getVehicles.mockClear();
    mockApiClient.getVehicles.mockResolvedValue({
      success: true,
      data: { vehicles: [...mockVehicles, { id: '2', name: 'Car 2', brand: 'Honda', model: 'Civic' }] }
    });

    await act(async () => {
      await result.current.fetchVehicles();
    });

    expect(mockApiClient.getVehicles).toHaveBeenCalledTimes(1);
    expect(result.current.vehicles).toHaveLength(2);
  });
});
