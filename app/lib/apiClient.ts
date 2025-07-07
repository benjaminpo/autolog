/**
 * Centralized API Client for Vehicle Expense Tracker
 * Provides standardized methods for making API calls with proper error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ExpenseEntry {
  id: string;
  _id?: string;
  userId: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  vehicleId?: string;
}

export interface FuelEntry {
  id: string;
  _id?: string;
  userId: string;
  date: string;
  time: string;
  vehicleId: string;
  fuelType: string;
  company: string;
  volume: number;
  cost: number;
  mileage: number;
  station?: string;
  notes?: string;
}

export interface IncomeEntry {
  id: string;
  _id?: string;
  userId: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  source?: string;
}

export interface Vehicle {
  id: string;
  _id?: string;
  userId: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  dateAdded: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data.success ? data : undefined,
        message: data.message,
        error: !response.ok ? data.message || 'Request failed' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Expense Entries
  async getExpenseEntries(): Promise<ApiResponse<{ expenses: ExpenseEntry[] }>> {
    return this.request<{ expenses: ExpenseEntry[] }>('/expense-entries');
  }

  async createExpenseEntry(entry: Omit<ExpenseEntry, 'id' | '_id' | 'userId'>): Promise<ApiResponse<{ expense: ExpenseEntry }>> {
    return this.request<{ expense: ExpenseEntry }>('/expense-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateExpenseEntry(id: string, entry: Partial<ExpenseEntry>): Promise<ApiResponse<{ expense: ExpenseEntry }>> {
    return this.request<{ expense: ExpenseEntry }>('/expense-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...entry }),
    });
  }

  async deleteExpenseEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/expense-entries?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Fuel Entries
  async getFuelEntries(): Promise<ApiResponse<{ entries: FuelEntry[] }>> {
    return this.request<{ entries: FuelEntry[] }>('/fuel-entries');
  }

  async createFuelEntry(entry: Omit<FuelEntry, 'id' | '_id' | 'userId'>): Promise<ApiResponse<{ entry: FuelEntry }>> {
    return this.request<{ entry: FuelEntry }>('/fuel-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateFuelEntry(id: string, entry: Partial<FuelEntry>): Promise<ApiResponse<{ entry: FuelEntry }>> {
    return this.request<{ entry: FuelEntry }>('/fuel-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...entry }),
    });
  }

  async deleteFuelEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/fuel-entries?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Income Entries
  async getIncomeEntries(): Promise<ApiResponse<{ entries: IncomeEntry[] }>> {
    return this.request<{ entries: IncomeEntry[] }>('/income-entries');
  }

  async createIncomeEntry(entry: Omit<IncomeEntry, 'id' | '_id' | 'userId'>): Promise<ApiResponse<{ entry: IncomeEntry }>> {
    return this.request<{ entry: IncomeEntry }>('/income-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateIncomeEntry(id: string, entry: Partial<IncomeEntry>): Promise<ApiResponse<{ entry: IncomeEntry }>> {
    return this.request<{ entry: IncomeEntry }>('/income-entries', {
      method: 'PUT',
      body: JSON.stringify({ id, ...entry }),
    });
  }

  async deleteIncomeEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/income-entries?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Vehicles
  async getVehicles(): Promise<ApiResponse<{ vehicles: Vehicle[] }>> {
    return this.request<{ vehicles: Vehicle[] }>('/vehicles');
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | '_id' | 'userId' | 'dateAdded'>): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>('/vehicles', {
      method: 'PUT',
      body: JSON.stringify({ id, ...vehicle }),
    });
  }

  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/vehicles?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getExpenseCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.request<{ categories: any[] }>('/expense-categories');
  }

  async getIncomeCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.request<{ categories: any[] }>('/income-categories');
  }

  async getFuelCompanies(): Promise<ApiResponse<{ companies: any[] }>> {
    return this.request<{ companies: any[] }>('/fuel-companies');
  }

  async getFuelTypes(): Promise<ApiResponse<{ types: any[] }>> {
    return this.request<{ types: any[] }>('/fuel-types');
  }

  // User Preferences
  async getUserPreferences(): Promise<ApiResponse<any>> {
    return this.request<any>('/user-preferences');
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request<any>('/user-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
export default apiClient; 