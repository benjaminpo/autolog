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

export const expenseApi = {
  getEntries: (params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    
    const url = queryString ? `/api/expense-entries?${queryString}` : '/api/expense-entries';
    return apiRequest<{ success: boolean; expenses: any[] }>(url);
  },

  createEntry: (entry: any) => apiRequest('/api/expense-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  }),

  updateEntry: (id: string, entry: any) => apiRequest(`/api/expense-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  }),

  deleteEntry: (id: string) => apiRequest(`/api/expense-entries/${id}`, {
    method: 'DELETE',
  }),

  getCategories: () => apiRequest<{ success: boolean; expenseCategories: any[] }>('/api/expense-categories'),
};

export const incomeApi = {
  getEntries: (params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    
    const url = queryString ? `/api/income-entries?${queryString}` : '/api/income-entries';
    return apiRequest<{ success: boolean; entries: any[] }>(url);
  },

  createEntry: (entry: any) => apiRequest('/api/income-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  }),

  updateEntry: (id: string, entry: any) => apiRequest(`/api/income-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  }),

  deleteEntry: (id: string) => apiRequest(`/api/income-entries/${id}`, {
    method: 'DELETE',
  }),

  getCategories: () => apiRequest<{ success: boolean; incomeCategories: any[] }>('/api/income-categories'),
};
