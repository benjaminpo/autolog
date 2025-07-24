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

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, POST, PUT, DELETE } from '../../app/api/expense-entries/route';
import dbConnect from '../../app/lib/dbConnect';
import ExpenseEntry from '../../app/models/ExpenseEntry';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../app/lib/dbConnect');
jest.mock('../../app/models/ExpenseEntry', () => {
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
const mockExpenseEntry = ExpenseEntry as any;

describe('/api/expense-entries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/expense-entries', () => {
    it('should return expense entries for authenticated user', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockEntries = [
        { _id: { toString: () => 'entry1' }, amount: 100, category: 'Fuel', date: '2023-01-01' },
        { _id: { toString: () => 'entry2' }, amount: 50, category: 'Maintenance', date: '2023-01-02' },
      ];

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      const mockLean = jest.fn().mockResolvedValue(mockEntries);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      mockExpenseEntry.find.mockReturnValue({ sort: mockSort });

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.entries).toHaveLength(2);
      expect(responseData.entries[0].id).toBe('entry1');
      expect(mockExpenseEntry.find).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe('Internal server error');
    });
  });

  describe('POST /api/expense-entries', () => {
    it('should create new expense entry for authenticated user', async () => {
      const mockSession = { user: { id: 'user123' } };
      const entryData = { amount: 100, category: 'Fuel', date: '2023-01-01' };
      const mockSavedEntry = {
        _id: { toString: () => 'entry1' },
        ...entryData,
        userId: 'user123',
        toObject: () => ({ _id: 'entry1', ...entryData, userId: 'user123' }),
        save: jest.fn(),
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.mockImplementation(() => mockSavedEntry);
      mockSavedEntry.save.mockResolvedValue(mockSavedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(entryData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.expense.id).toBe('entry1');
      expect(mockExpenseEntry).toHaveBeenCalledWith({ ...entryData, userId: 'user123' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe('Unauthorized');
    });

    it('should handle save errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      const entryData = { amount: 100, category: 'Fuel', date: '2023-01-01' };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);

      const mockEntry = {
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
      };
      mockExpenseEntry.mockImplementation(() => mockEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(entryData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe('Internal server error');
    });
  });

  describe('PUT /api/expense-entries', () => {
    it('should update expense entry for authenticated user', async () => {
      const mockSession = { user: { id: 'user123' } };
      const updateData = { id: 'entry1', amount: 150, category: 'Fuel' };
      const mockUpdatedEntry = {
        _id: 'entry1',
        amount: 150,
        category: 'Fuel',
        userId: 'user123',
        toObject: () => ({ _id: 'entry1', amount: 150, category: 'Fuel', userId: 'user123' }),
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.findOneAndUpdate.mockResolvedValue(mockUpdatedEntry);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest;

      const response = await PUT(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.expense.id).toBe('entry1');
      expect(mockExpenseEntry.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'entry1', userId: 'user123' },
        { amount: 150, category: 'Fuel' },
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if entry not found', async () => {
      const mockSession = { user: { id: 'user123' } };
      const updateData = { id: 'nonexistent', amount: 150 };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.findOneAndUpdate.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(updateData),
      } as unknown as NextRequest;

      const response = await PUT(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.message).toBe('Expense entry not found');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const response = await PUT(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/expense-entries', () => {
    it('should delete expense entry for authenticated user', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockDeletedEntry = { _id: 'entry1', amount: 100, category: 'Fuel' };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.findOneAndDelete.mockResolvedValue(mockDeletedEntry);

      const mockRequest = {
        url: 'http://localhost:3000/api/expense-entries?id=entry1',
      } as unknown as NextRequest;

      const response = await DELETE(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Expense entry deleted successfully');
      expect(mockExpenseEntry.findOneAndDelete).toHaveBeenCalledWith({ _id: 'entry1', userId: 'user123' });
    });

    it('should return 400 if ID is missing', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const mockRequest = {
        url: 'http://localhost:3000/api/expense-entries',
      } as unknown as NextRequest;

      const response = await DELETE(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe('Missing expense entry ID');
    });

    it('should return 404 if entry not found', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseEntry.findOneAndDelete.mockResolvedValue(null);

      const mockRequest = {
        url: 'http://localhost:3000/api/expense-entries?id=nonexistent',
      } as unknown as NextRequest;

      const response = await DELETE(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.message).toBe('Expense entry not found');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        url: 'http://localhost:3000/api/expense-entries?id=entry1',
      } as unknown as NextRequest;

      const response = await DELETE(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe('Unauthorized');
    });
  });
});
