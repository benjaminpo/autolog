import { NextRequest, NextResponse } from 'next/server';

// Mock database connection
jest.mock('../../app/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

// Mock mongoose model
jest.mock('../../app/models/IncomeEntry', () => ({
  __esModule: true,
  default: {
    findOneAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

// Mock authentication
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('../../app/api/auth/authOptions', () => ({
  authOptions: {},
}));

// Import after mocks
import { DELETE, PUT } from '../../app/api/income-entries/[id]/route';
import { getServerSession } from 'next-auth/next';
import dbConnect from '../../app/lib/dbConnect';
import IncomeEntry from '../../app/models/IncomeEntry';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockIncomeEntry = IncomeEntry as jest.Mocked<typeof IncomeEntry>;

describe('/api/income-entries/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/income-entries/[id]', () => {
    test('should delete income entry for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const mockDeletedEntry = {
        _id: 'entry123',
        userId: 'user123',
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Uber earnings'
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndDelete.mockResolvedValue(mockDeletedEntry);

      const mockRequest = {} as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockIncomeEntry.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'entry123',
        userId: 'user123'
      });
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Income entry deleted successfully');
    });

    test('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should return 401 when session exists but user is missing', async () => {
      const mockSession = { user: null };
      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {} as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should return 404 when income entry is not found', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndDelete.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Income entry not found');
    });

    test('should handle database errors during deletion', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndDelete.mockRejectedValue(new Error('Database error'));

      const mockRequest = {} as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await DELETE(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Error deleting income entry');
    });
  });

  describe('PUT /api/income-entries/[id]', () => {
    test('should update income entry for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Updated earnings'
      };
      const mockUpdatedEntry = {
        _id: 'entry123',
        userId: 'user123',
        ...updateData
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndUpdate.mockResolvedValue(mockUpdatedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockIncomeEntry.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'entry123',
          userId: 'user123'
        },
        {
          carId: 'car1',
          category: 'Ride Sharing',
          amount: 200.00,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Updated earnings'
        },
        { new: true }
      );
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.entry).toEqual(mockUpdatedEntry);
    });

    test('should update income entry with empty notes when notes not provided', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15'
      };
      const mockUpdatedEntry = {
        _id: 'entry123',
        userId: 'user123',
        ...updateData,
        notes: ''
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndUpdate.mockResolvedValue(mockUpdatedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(mockIncomeEntry.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: 'entry123',
          userId: 'user123'
        },
        {
          carId: 'car1',
          category: 'Ride Sharing',
          amount: 200.00,
          currency: 'USD',
          date: '2024-01-15',
          notes: ''
        },
        { new: true }
      );
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    test('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should return 401 when session exists but user is missing', async () => {
      const mockSession = { user: null };
      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should return 400 when carId is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
      expect(mockIncomeEntry.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('should return 400 when category is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when amount is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when currency is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when date is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when amount is not a number', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 'invalid',
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Amount must be a positive number');
    });

    test('should return 400 when amount is negative', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: -50,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Amount must be a positive number');
    });

    test('should return 404 when income entry is not found', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndUpdate.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Income entry not found');
    });

    test('should handle database errors during update', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const updateData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 200.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData)
      } as unknown as NextRequest;
      const mockParams = { params: Promise.resolve({ id: 'entry123' }) };

      const response = await PUT(mockRequest, mockParams);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Error updating income entry');
    });
  });
}); 