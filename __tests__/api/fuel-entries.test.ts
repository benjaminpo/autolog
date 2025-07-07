// Mock problematic ES modules first
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
}));

jest.mock('@panva/hkdf', () => ({
  default: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
  encode: jest.fn(),
  decode: jest.fn(),
}));

jest.mock('preact-render-to-string', () => ({
  render: jest.fn(),
  renderToString: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, POST, PUT, DELETE } from '../../app/api/fuel-entries/route';
import dbConnect from '../../app/lib/dbConnect';
import FuelEntry from '../../app/models/FuelEntry';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../app/lib/dbConnect');
jest.mock('../../app/models/FuelEntry', () => {
  const mockModel = jest.fn();
  Object.assign(mockModel, {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  });
  return mockModel;
});

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockFuelEntry = FuelEntry as any;

describe('/api/fuel-entries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);

      const response = await GET();
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return fuel entries for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const mockFuelEntries = [
        {
          _id: 'fuel1',
          userId: 'user123',
          carId: 'vehicle1',
          date: new Date(),
          amount: 50.0,
          cost: 150.0,
          fuelType: 'Regular Gasoline',
          toObject: jest.fn().mockReturnValue({
            _id: 'fuel1',
            userId: 'user123',
            carId: 'vehicle1',
            date: new Date(),
            amount: 50.0,
            cost: 150.0,
            fuelType: 'Regular Gasoline'
          })
        }
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockFuelEntries)
        })
      });

      const response = await GET();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe('fuel1');
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockFuelEntry.find).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should handle database errors', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockFuelEntry.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe('Internal server error');
    });

    it('should sort fuel entries by date in descending order', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      const mockSort = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });
      mockFuelEntry.find = jest.fn().mockReturnValue({
        sort: mockSort
      });

      await GET();

      expect(mockSort).toHaveBeenCalledWith({ date: -1, time: -1 });
    });

    it('should use lean queries for better performance', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      const mockLean = jest.fn().mockResolvedValue([]);
      mockFuelEntry.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: mockLean
        })
      });

      await GET();

      expect(mockLean).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockReq = { json: () => Promise.resolve({}) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should validate volume field', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      const invalidData = { volume: -5, mileage: 1000, cost: 50 };
      const mockReq = { json: () => Promise.resolve(invalidData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Volume must be a valid positive number');
    });

    it('should validate volume as NaN', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      const invalidData = { volume: 'invalid', mileage: 1000, cost: 50 };
      const mockReq = { json: () => Promise.resolve(invalidData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Volume must be a valid positive number');
    });

    it('should validate mileage field', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      const invalidData = { volume: 50, mileage: -100, cost: 50 };
      const mockReq = { json: () => Promise.resolve(invalidData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Mileage must be a valid non-negative number');
    });

    it('should validate cost field', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      const invalidData = { volume: 50, mileage: 1000, cost: -25 };
      const mockReq = { json: () => Promise.resolve(invalidData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Cost must be a valid non-negative number');
    });

    it('should create fuel entry successfully', async () => {
      const mockSession = { user: { id: 'user123' } };
      const validData = { volume: 50.5, mileage: 1000, cost: 75.25, date: '2023-01-01' };
      const mockSavedEntry = {
        _id: { toString: () => 'newentry1' },
        ...validData,
        userId: 'user123',
        toObject: () => ({ ...validData, _id: 'newentry1', userId: 'user123' }),
        save: jest.fn().mockResolvedValue(true)
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.mockImplementation(() => mockSavedEntry as any);

      const mockReq = { json: () => Promise.resolve(validData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { success: boolean; message: string; entry: any };

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Fuel entry created successfully');
      expect(data.entry.id).toBe('newentry1');
      expect(mockSavedEntry.save).toHaveBeenCalled();
    });

    it('should handle save validation errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      const validData = { volume: 50.5, mileage: 1000, cost: 75.25 };
      const mockSavedEntry = {
        save: jest.fn().mockRejectedValue(new Error('Validation failed'))
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.mockImplementation(() => mockSavedEntry as any);

      const mockReq = { json: () => Promise.resolve(validData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string; error: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Failed to save fuel entry');
      expect(data.error).toBe('Validation failed');
    });

    it('should use default time when not provided', async () => {
      const mockSession = { user: { id: 'user123' } };
      const validData = { volume: 50.5, mileage: 1000, cost: 75.25 };
      const mockSavedEntry = {
        _id: { toString: () => 'newentry1' },
        toObject: () => ({ ...validData, _id: 'newentry1', userId: 'user123' }),
        save: jest.fn().mockResolvedValue(true)
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.mockImplementation((data: any) => {
        expect(data.time).toBeDefined();
        expect(typeof data.time).toBe('string');
        return mockSavedEntry as any;
      });

      const mockReq = { json: () => Promise.resolve(validData) } as NextRequest;

      await POST(mockReq);
    });

    it('should handle general server errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const mockReq = { json: () => Promise.resolve({}) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('PUT', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockReq = { json: () => Promise.resolve({}) } as NextRequest;

      const response = await PUT(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should update fuel entry successfully', async () => {
      const mockSession = { user: { id: 'user123' } };
      const updateData = { id: 'entry1', volume: 60, cost: 90 };
      const mockUpdatedEntry = {
        _id: { toString: () => 'entry1' },
        volume: 60,
        cost: 90,
        toObject: () => ({ volume: 60, cost: 90, _id: 'entry1' })
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedEntry);

      const mockReq = { json: () => Promise.resolve(updateData) } as NextRequest;

      const response = await PUT(mockReq);
      const data = await response.json() as { success: boolean; message: string; entry: any };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Fuel entry updated successfully');
      expect(data.entry.id).toBe('entry1');
      expect(mockFuelEntry.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'entry1', userId: 'user123' },
        { volume: 60, cost: 90 },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 when entry not found', async () => {
      const mockSession = { user: { id: 'user123' } };
      const updateData = { id: 'nonexistent', volume: 60 };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const mockReq = { json: () => Promise.resolve(updateData) } as NextRequest;

      const response = await PUT(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(404);
      expect(data.message).toBe('Fuel entry not found');
    });

    it('should handle server errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const mockReq = { json: () => Promise.resolve({ id: 'entry1' }) } as NextRequest;

      const response = await PUT(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    const createMockRequest = (id?: string) => {
      const url = id ? `http://localhost/api/fuel-entries?id=${id}` : 'http://localhost/api/fuel-entries';
      return { url } as NextRequest;
    };

    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockReq = createMockRequest('entry1');

      const response = await DELETE(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when no ID provided', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const mockReq = createMockRequest();

      const response = await DELETE(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing fuel entry ID');
    });

    it('should delete fuel entry successfully', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockDeletedEntry = { _id: 'entry1', volume: 50 };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.findOneAndDelete = jest.fn().mockResolvedValue(mockDeletedEntry);

      const mockReq = createMockRequest('entry1');

      const response = await DELETE(mockReq);
      const data = await response.json() as { success: boolean; message: string };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Fuel entry deleted successfully');
      expect(mockFuelEntry.findOneAndDelete).toHaveBeenCalledWith({ _id: 'entry1', userId: 'user123' });
    });

    it('should return 404 when entry not found', async () => {
      const mockSession = { user: { id: 'user123' } };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockFuelEntry.findOneAndDelete = jest.fn().mockResolvedValue(null);

      const mockReq = createMockRequest('nonexistent');

      const response = await DELETE(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(404);
      expect(data.message).toBe('Fuel entry not found');
    });

    it('should handle server errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Database error'));

      const mockReq = createMockRequest('entry1');

      const response = await DELETE(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
}); 