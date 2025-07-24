/**
 * Custom React Hooks for API Operations
 * Provides easy-to-use hooks for data fetching and mutations with proper loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse, ExpenseEntry, FuelEntry, Vehicle } from '../lib/apiClient';

// Generic hook for API operations
export function useApiOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await operation();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Operation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Expense Entries Hooks
export function useExpenseEntries() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpenseEntries();

      if (response.success && response.data) {
        setExpenses(response.data.entries);
      } else {
        setError(response.error || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expense: Omit<ExpenseEntry, 'id' | '_id' | 'userId'>) => {
    const response = await apiClient.createExpenseEntry(expense);

    if (response.success && response.data) {
      setExpenses(prev => [response.data!.expense, ...prev]);
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const updateExpense = useCallback(async (id: string, expense: Partial<ExpenseEntry>) => {
    const response = await apiClient.updateExpenseEntry(id, expense);

    if (response.success && response.data) {
      setExpenses(prev => prev.map(e => e.id === id ? response.data!.expense : e));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const response = await apiClient.deleteExpenseEntry(id);

    if (response.success) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

// Fuel Entries Hooks
export function useFuelEntries() {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getFuelEntries();

      if (response.success && response.data) {
        setEntries(response.data.entries);
      } else {
        setError(response.error || 'Failed to fetch fuel entries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entry: Omit<FuelEntry, 'id' | '_id' | 'userId'>) => {
    const response = await apiClient.createFuelEntry(entry);

    if (response.success && response.data) {
      setEntries(prev => [response.data!.entry, ...prev]);
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const updateEntry = useCallback(async (id: string, entry: Partial<FuelEntry>) => {
    const response = await apiClient.updateFuelEntry(id, entry);

    if (response.success && response.data) {
      setEntries(prev => prev.map(e => e.id === id ? response.data!.entry : e));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const response = await apiClient.deleteFuelEntry(id);

    if (response.success) {
      setEntries(prev => prev.filter(e => e.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}

// Vehicles Hook
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getVehicles();

      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
      } else {
        setError(response.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id' | '_id' | 'userId' | 'dateAdded'>) => {
    const response = await apiClient.createVehicle(vehicle);

    if (response.success && response.data) {
      setVehicles(prev => [response.data!.vehicle, ...prev]);
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, vehicle: Partial<Vehicle>) => {
    const response = await apiClient.updateVehicle(id, vehicle);

    if (response.success && response.data) {
      setVehicles(prev => prev.map(v => v.id === id ? response.data!.vehicle : v));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    const response = await apiClient.deleteVehicle(id);

    if (response.success) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
}

// Categories and other data hooks
export function useExpenseCategories() {
  const { data, loading, error, execute } = useApiOperation<{ categories: any[] }>();

  useEffect(() => {
    execute(() => apiClient.getExpenseCategories());
  }, [execute]);

  return {
    categories: data?.categories || [],
    loading,
    error,
    refetch: () => execute(() => apiClient.getExpenseCategories()),
  };
}

export function useFuelCompanies() {
  const { data, loading, error, execute } = useApiOperation<{ companies: any[] }>();

  useEffect(() => {
    execute(() => apiClient.getFuelCompanies());
  }, [execute]);

  return {
    companies: data?.companies || [],
    loading,
    error,
    refetch: () => execute(() => apiClient.getFuelCompanies()),
  };
}

export function useFuelTypes() {
  const { data, loading, error, execute } = useApiOperation<{ types: any[] }>();

  useEffect(() => {
    execute(() => apiClient.getFuelTypes());
  }, [execute]);

  return {
    types: data?.types || [],
    loading,
    error,
    refetch: () => execute(() => apiClient.getFuelTypes()),
  };
}
