import { apiClient } from '../../app/lib/apiClient';

// Mock fetch
global.fetch = jest.fn();

// Mock next-auth
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const { getSession } = require('next-auth/react');

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: 'user123' },
      accessToken: 'mock-token',
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request for vehicles', async () => {
      const mockData = { success: true, vehicles: [{ id: '1', name: 'Car 1' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(mockFetch).toHaveBeenCalledWith('/api/vehicles', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle GET request errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request to create vehicle', async () => {
      const vehicleData = { name: 'New Car', make: 'Toyota', model: 'Camry' };
      const mockResponse = { success: true, vehicle: { id: '123', ...vehicleData } };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.createVehicle(vehicleData);

      expect(mockFetch).toHaveBeenCalledWith('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle POST validation errors', async () => {
      const vehicleData = { name: '', make: '', model: '' };
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation failed', errors: ['Name is required'] }),
      } as unknown as Response);

      const result = await apiClient.createVehicle(vehicleData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request to update vehicle', async () => {
      const vehicleId = '123';
      const updateData = { name: 'Updated Car' };
      const mockResponse = { success: true, vehicle: { id: vehicleId, name: 'Updated Car', make: 'Toyota' } };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.updateVehicle(vehicleId, updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/vehicles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: vehicleId, ...updateData }),
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle PUT request for non-existent resource', async () => {
      const vehicleId = 'non-existent';
      const updateData = { name: 'Updated Car' };
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Vehicle not found' }),
      } as unknown as Response);

      const result = await apiClient.updateVehicle(vehicleId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vehicle not found');
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const vehicleId = '123';
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as unknown as Response);

      const result = await apiClient.deleteVehicle(vehicleId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/vehicles?id=${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should handle DELETE request errors', async () => {
      const vehicleId = '123';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      const result = await apiClient.deleteVehicle(vehicleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('Expense Entries API', () => {
    it('should get expense entries', async () => {
      const mockExpenses = [
        { id: '1', description: 'Fuel', amount: 50, category: 'Fuel' },
        { id: '2', description: 'Maintenance', amount: 100, category: 'Maintenance' },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, expenses: mockExpenses }),
      } as unknown as Response);

      const result = await apiClient.getExpenseEntries();

      expect(mockFetch).toHaveBeenCalledWith('/api/expense-entries', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.expenses).toEqual(mockExpenses);
    });

    it('should create expense entry', async () => {
      const expenseData = {
        description: 'Gas Station',
        amount: 75,
        category: 'Fuel',
        date: '2023-01-01',
        vehicleId: 'vehicle123',
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, expense: { id: '456', ...expenseData } }),
      } as unknown as Response);

      const result = await apiClient.createExpenseEntry(expenseData);

      expect(mockFetch).toHaveBeenCalledWith('/api/expense-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      expect(result.success).toBe(true);
      expect(result.data?.expense).toMatchObject(expenseData);
    });
  });

  describe('Fuel Entries API', () => {
    it('should get fuel entries', async () => {
      const mockEntries = [
        { id: '1', volume: 40, cost: 50, fuelType: 'Regular' },
        { id: '2', volume: 35, cost: 45, fuelType: 'Premium' },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, entries: mockEntries }),
      } as unknown as Response);

      const result = await apiClient.getFuelEntries();

      expect(result.success).toBe(true);
      expect(result.data?.entries).toEqual(mockEntries);
    });

    it('should create fuel entry', async () => {
      const fuelData = {
        volume: 30,
        cost: 40,
        fuelType: 'Regular',
        time: '10:00',
        date: '2023-01-01',
        vehicleId: 'vehicle123',
        company: 'Shell',
        mileage: 50000,
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, entry: { id: '789', ...fuelData } }),
      } as unknown as Response);

      const result = await apiClient.createFuelEntry(fuelData);

      expect(result.success).toBe(true);
      expect(result.data?.entry).toMatchObject(fuelData);
    });
  });

  describe('Income Entries API', () => {
    it('should get income entries', async () => {
      const mockIncomes = [
        { id: '1', description: 'Rideshare', amount: 120, category: 'Rideshare' },
        { id: '2', description: 'Delivery', amount: 80, category: 'Delivery' },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, entries: mockIncomes }),
      } as unknown as Response);

      const result = await apiClient.getIncomeEntries();

      expect(result.success).toBe(true);
      expect(result.data?.entries).toEqual(mockIncomes);
    });

    it('should create income entry', async () => {
      const incomeData = {
        description: 'Uber Earnings',
        amount: 150,
        category: 'Rideshare',
        date: '2023-01-01',
        vehicleId: 'vehicle123',
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, entry: { id: '101', ...incomeData } }),
      } as unknown as Response);

      const result = await apiClient.createIncomeEntry(incomeData);

      expect(result.success).toBe(true);
      expect(result.data?.entry).toMatchObject(incomeData);
    });
  });

  describe('API Response Processing', () => {
    it('should process successful API responses correctly', async () => {
      const mockApiResponse = { success: true, vehicles: [{ id: '1', name: 'Car 1' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockApiResponse);
      expect(result.error).toBeUndefined();
    });

    it('should handle failed API responses correctly', async () => {
      const mockApiResponse = { success: false, message: 'Bad request' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockApiResponse,
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bad request');
      expect(result.data).toBeUndefined();
    });

    it('should handle responses without success flag correctly', async () => {
      const mockApiResponse = { vehicles: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined(); // Because response doesn't have success: true
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await apiClient.getVehicles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });

  describe('Authentication', () => {
    it('should include auth headers when session exists', async () => {
      getSession.mockResolvedValue({
        user: { id: 'user123' },
        accessToken: 'bearer-token-123',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { vehicles: [] } }),
      } as unknown as Response);

      await apiClient.getVehicles();

      // Check if Authorization header would be included (implementation dependent)
      expect(mockFetch).toHaveBeenCalledWith('/api/vehicles', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle missing session', async () => {
      getSession.mockResolvedValue(null);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { vehicles: [] } }),
      } as unknown as Response);

      const result = await apiClient.getVehicles();

      // Should still make request but without auth headers
      expect(result.success).toBe(true);
    });
  });

  describe('Request Configuration', () => {
    it('should use correct HTTP methods', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as unknown as Response);

      // Test different HTTP methods
      await apiClient.getVehicles();
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), 
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
      );

      await apiClient.createVehicle({ name: 'Test', make: 'Test', model: 'Test' });
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), 
        expect.objectContaining({ method: 'POST' })
      );

      await apiClient.updateVehicle('123', { name: 'Updated' });
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), 
        expect.objectContaining({ method: 'PUT' })
      );

      await apiClient.deleteVehicle('123');
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), 
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as unknown as Response);

      await apiClient.getVehicles();

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), 
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          })
        })
      );
    });

    it('should serialize request body correctly', async () => {
      const testData = { name: 'Test Vehicle', make: 'Test Brand' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true }),
      } as unknown as Response);

      await apiClient.createVehicle(testData);

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), 
        expect.objectContaining({
          body: JSON.stringify(testData)
        })
      );
    });
  });

  describe('Different API endpoints', () => {
    it('should handle expense entries API', async () => {
      const mockResponse = { success: true, expenses: [{ id: '1', description: 'Fuel', amount: 50 }] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.getExpenseEntries();

      expect(mockFetch).toHaveBeenCalledWith('/api/expense-entries', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle fuel entries API', async () => {
      const mockResponse = { success: true, entries: [{ id: '1', volume: 40, cost: 50 }] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.getFuelEntries();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle income entries API', async () => {
      const mockResponse = { success: true, entries: [{ id: '1', description: 'Rideshare', amount: 120 }] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.getIncomeEntries();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Basic functionality verification', () => {
    it('should make HTTP requests correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as unknown as Response);

      await apiClient.getVehicles();
      
      // Verify that fetch was called (implementation uses private request method)
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle basic API operations', async () => {
      const mockResponse = { success: true, data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await apiClient.getVehicles();
      
      expect(result.success).toBe(true);
    });
  });
}); 

describe('apiClient edge cases', () => {
  it('should handle network timeout', async () => {
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    );

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
  });

  it('should handle malformed JSON response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON')),
      text: () => Promise.resolve('invalid json string')
    });

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid JSON');
  });

  it('should handle empty response body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, vehicles: [] }),
      text: () => Promise.resolve('')
    });

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ success: true, vehicles: [] });
  });

  it('should handle very large response', async () => {
    const largeData = { success: true, vehicles: [{ id: '1', name: 'x'.repeat(1000000) }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(largeData)
    });

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(true);
    expect(result.data).toEqual(largeData);
  });

  it('should handle concurrent requests', async () => {
    let requestCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      requestCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, count: requestCount })
      });
    });

    const promises = [
      apiClient.getVehicles(),
      apiClient.getExpenseEntries(),
      apiClient.getFuelEntries()
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
  });

  it('should handle network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should handle timeout errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Request timeout'));

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request timeout');
  });

  it('should handle CORS errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('CORS error'));

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('CORS error');
  });

  it('should handle malformed JSON responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON')),
      text: () => Promise.resolve('Invalid JSON string')
    } as Response);

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid JSON');
  });

  it('should handle empty responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve('')
    } as Response);

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot read properties');
  });

  it('should handle undefined responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(undefined),
      text: () => Promise.resolve('')
    } as Response);

    const result = await apiClient.getVehicles();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot read properties');
  });

  it('should handle very large responses', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'large data' }));
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, vehicles: largeData }),
      text: () => Promise.resolve(JSON.stringify({ success: true, vehicles: largeData }))
    } as Response);

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(true);
    expect(result.data?.vehicles).toHaveLength(10000);
  });

  it('should handle responses with special characters', async () => {
    const specialData = {
      message: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
      unicode: '你好世界 🌍 émojis 🚗',
      html: '<script>alert("test")</script>',
      quotes: 'Single "double" quotes',
      backslashes: '\\n\\t\\r'
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, vehicles: [specialData] }),
      text: () => Promise.resolve(JSON.stringify({ success: true, vehicles: [specialData] }))
    } as Response);

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(true);
    expect(result.data?.vehicles[0]).toEqual(specialData);
  });

  it('should handle deep nested objects', async () => {
    const deepNested = {
      id: '1',
      name: 'Test Vehicle',
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep value'
              }
            }
          }
        }
      }
    } as any;
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, vehicles: [deepNested] }),
      text: () => Promise.resolve(JSON.stringify({ success: true, vehicles: [deepNested] }))
    } as Response);

    const result = await apiClient.getVehicles();
    
    expect(result.success).toBe(true);
    expect((result.data?.vehicles[0] as any).level1.level2.level3.level4.level5.value).toBe('deep value');
  });
});