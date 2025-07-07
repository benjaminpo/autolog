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
    find: jest.fn().mockReturnValue({
      sort: jest.fn(),
    }),
    create: jest.fn(),
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
import { GET, POST } from '../../app/api/income-entries/route';
import { getServerSession } from 'next-auth/next';
import dbConnect from '../../app/lib/dbConnect';
import IncomeEntry from '../../app/models/IncomeEntry';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockIncomeEntry = IncomeEntry as jest.Mocked<typeof IncomeEntry>;

describe('/api/income-entries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/income-entries', () => {
    test('should return income entries for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const mockIncomeEntries = [
        {
          _id: '1',
          userId: 'user123',
          carId: 'car1',
          category: 'Ride Sharing',
          amount: 150.00,
          currency: 'USD',
          date: '2024-01-15',
          notes: 'Uber earnings'
        },
        {
          _id: '2',
          userId: 'user123',
          carId: 'car1',
          category: 'Delivery',
          amount: 75.50,
          currency: 'USD',
          date: '2024-01-14',
          notes: 'Food delivery'
        }
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockIncomeEntries)
      } as any);

      const response = await GET();
      const responseData = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockIncomeEntry.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.entries).toEqual(mockIncomeEntries);
    });

    test('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should return 401 when session exists but user is missing', async () => {
      const mockSession = { user: null };
      mockGetServerSession.mockResolvedValue(mockSession);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Unauthorized');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Error getting income entries');
    });
  });

  describe('POST /api/income-entries', () => {
    test('should create income entry for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Uber earnings'
      };
      const mockCreatedEntry = {
        _id: 'entry123',
        userId: 'user123',
        ...incomeData
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockIncomeEntry.create as jest.MockedFunction<any>).mockResolvedValue(mockCreatedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockIncomeEntry.create).toHaveBeenCalledWith({
        userId: 'user123',
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: 'Uber earnings'
      });
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.entry).toEqual(mockCreatedEntry);
    });

    test('should create income entry with empty notes when notes not provided', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15'
      };
      const mockCreatedEntry = {
        _id: 'entry123',
        userId: 'user123',
        ...incomeData,
        notes: ''
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockIncomeEntry.create as jest.MockedFunction<any>).mockResolvedValue(mockCreatedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(mockIncomeEntry.create).toHaveBeenCalledWith({
        userId: 'user123',
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15',
        notes: ''
      });
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
    });

    test('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({})
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
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
      const incomeData = {
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
      expect(mockIncomeEntry.create).not.toHaveBeenCalled();
    });

    test('should return 400 when category is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when amount is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when currency is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when date is missing', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Missing required fields');
    });

    test('should return 400 when amount is not a number', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 'invalid',
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Amount must be a positive number');
    });

    test('should return 400 when amount is negative', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: -50,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Amount must be a positive number');
    });

    test('should handle database errors during creation', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };
      const incomeData = {
        carId: 'car1',
        category: 'Ride Sharing',
        amount: 150.00,
        currency: 'USD',
        date: '2024-01-15'
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockIncomeEntry.create.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        json: jest.fn().mockResolvedValue(incomeData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Error creating income entry');
    });
  });
}); 