// Shared API utility functions to reduce code duplication

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public response?: Response) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Request failed: ${response.status}`, response);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// Specific API functions for common operations
export const vehicleApi = {
  getAll: () => apiRequest<{ vehicles: any[] }>('/api/vehicles'),

  getById: (id: string) => apiRequest(`/api/vehicles/${id}`),

  create: (vehicle: any) => apiRequest('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicle),
  }),

  update: (id: string, vehicle: any) => apiRequest(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicle),
  }),

  delete: (id: string) => apiRequest(`/api/vehicles/${id}`, {
    method: 'DELETE',
  }),
};

export const fuelApi = {
  getEntries: () => apiRequest<{ entries: any[] }>('/api/fuel-entries'),

  createEntry: (entry: any) => apiRequest('/api/fuel-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  }),

  updateEntry: (id: string, entry: any) => apiRequest(`/api/fuel-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  }),

  deleteEntry: (id: string) => apiRequest(`/api/fuel-entries/${id}`, {
    method: 'DELETE',
  }),

  getCompanies: () => apiRequest<{ companies: any[] }>('/api/fuel-companies'),

  getTypes: () => apiRequest<{ types: any[] }>('/api/fuel-types'),
};

// Expense API will be created using the factory below

// Income API will be created using the factory below

// Shared financial entry API utilities
export const createFinancialEntryApi = (entryType: 'income' | 'expense') => {
  const basePath = entryType === 'income' ? '/api/income-entries' : '/api/expense-entries';
  const categoryPath = entryType === 'income' ? '/api/income-categories' : '/api/expense-categories';
  const categoryKey = entryType === 'income' ? 'incomeCategories' : 'expenseCategories';

  return {
    getEntries: (params?: Record<string, string>) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      const queryString = queryParams.toString();
      const url = queryString ? `${basePath}?${queryString}` : basePath;
      return apiRequest<{ success: boolean; entries: any[] }>(url);
    },

    createEntry: (entry: any) => apiRequest(basePath, {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

    updateEntry: (id: string, entry: any) => apiRequest(`${basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    }),

    deleteEntry: (id: string) => apiRequest(`${basePath}/${id}`, {
      method: 'DELETE',
    }),

    getCategories: () => apiRequest<{ success: boolean; expenseCategories?: any[]; incomeCategories?: any[] }>(categoryPath)
      .then(response => ({
        ...response,
        categories: response[categoryKey] || []
      })),
  };
};

// Export specific instances for backward compatibility and new unified API
export const expenseApi = createFinancialEntryApi('expense');
export const incomeApi = createFinancialEntryApi('income');
