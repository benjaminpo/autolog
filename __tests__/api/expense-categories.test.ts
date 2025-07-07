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
import { GET, POST } from '../../app/api/expense-categories/route';
import dbConnect from '../../app/lib/dbConnect';
import ExpenseCategory from '../../app/models/ExpenseCategory';
import { expenseCategories } from '../../app/lib/vehicleData';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../app/lib/dbConnect');
jest.mock('../../app/models/ExpenseCategory', () => {
  const mockModel = jest.fn();
  Object.assign(mockModel, {
    find: jest.fn(),
    findOne: jest.fn(),
    insertMany: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  });
  return mockModel;
});
jest.mock('../../app/lib/vehicleData', () => ({
  expenseCategories: ['Fuel', 'Maintenance', 'Insurance', 'Registration', 'Repair']
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockExpenseCategory = ExpenseCategory as any;

describe('/api/expense-categories', () => {
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

    it('should initialize predefined categories when none exist', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockCustomCategories: any[] = []; // No predefined categories

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      // Mock the first find query to return empty (no predefined categories)
      const mockSortMethod = jest.fn().mockResolvedValue(mockCustomCategories);
      const mockFindMethod = jest.fn().mockReturnValue({ sort: mockSortMethod });
      mockExpenseCategory.find = mockFindMethod;
      
      // Mock insertMany to simulate successful creation
      mockExpenseCategory.insertMany = jest.fn().mockResolvedValue([
        { userId: 'user123', name: 'Fuel', isPredefined: true },
        { userId: 'user123', name: 'Maintenance', isPredefined: true },
        { userId: 'user123', name: 'Insurance', isPredefined: true },
        { userId: 'user123', name: 'Registration', isPredefined: true },
        { userId: 'user123', name: 'Repair', isPredefined: true }
      ]);

      // Mock the second find query to return all categories (including newly created)
      const mockSortMethodSecond = jest.fn().mockResolvedValue([
        { userId: 'user123', name: 'Fuel', isPredefined: true },
        { userId: 'user123', name: 'Maintenance', isPredefined: true },
        { userId: 'user123', name: 'Insurance', isPredefined: true },
        { userId: 'user123', name: 'Registration', isPredefined: true },
        { userId: 'user123', name: 'Repair', isPredefined: true }
      ]);
      
      // Override the find method after the first call
      mockFindMethod.mockReturnValueOnce({ sort: mockSortMethod })
                   .mockReturnValue({ sort: mockSortMethodSecond });

      const response = await GET();
      const data = await response.json() as { success: boolean; expenseCategories: any[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expenseCategories).toHaveLength(5);
      expect(mockExpenseCategory.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user123', name: 'Fuel', isPredefined: true }),
          expect.objectContaining({ userId: 'user123', name: 'Maintenance', isPredefined: true }),
        ]),
        { ordered: false }
      );
    });

    it('should return existing categories when predefined already exist', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockCategories = [
        { userId: 'user123', name: 'Fuel', isPredefined: true },
        { userId: 'user123', name: 'Custom Category', isPredefined: false }
      ];

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseCategory.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories)
      });

      const response = await GET();
      const data = await response.json() as { success: boolean; expenseCategories: any[] };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expenseCategories).toHaveLength(2);
      expect(data.expenseCategories[0].name).toBe('Fuel');
      expect(data.expenseCategories[1].name).toBe('Custom Category');
    });

    it('should handle database errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseCategory.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await GET();
      const data = await response.json() as { message: string; error: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST', () => {
    it('should return 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockReq = { json: () => Promise.resolve({ name: 'Test Category' }) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when no user in session', async () => {
      mockGetServerSession.mockResolvedValue({ user: null } as any);
      const mockReq = { json: () => Promise.resolve({ name: 'Test Category' }) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      const mockReq = { json: () => Promise.resolve({}) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Name is required');
    });

    it('should return 400 when category already exists (case insensitive)', async () => {
      const mockSession = { user: { id: 'user123' } };
      const existingCategory = { userId: 'user123', name: 'fuel', isPredefined: false };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseCategory.findOne = jest.fn().mockResolvedValue(existingCategory);

      const mockReq = { json: () => Promise.resolve({ name: 'Fuel' }) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toBe('Category already exists');
      expect(mockExpenseCategory.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        name: { $regex: new RegExp('^Fuel$', 'i') }
      });
    });

    it('should create new category successfully', async () => {
      const mockSession = { user: { id: 'user123' } };
      const newCategoryData = { name: 'Custom Category' };
      const mockSavedCategory = {
        userId: 'user123',
        name: 'Custom Category',
        isPredefined: false,
        save: jest.fn().mockResolvedValue(true)
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseCategory.findOne = jest.fn().mockResolvedValue(null); // Category doesn't exist
      mockExpenseCategory.mockImplementation(() => mockSavedCategory as any);

      const mockReq = { json: () => Promise.resolve(newCategoryData) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { success: boolean; message: string; expenseCategory: any };

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Expense category created successfully');
      expect(data.expenseCategory.name).toBe('Custom Category');
      expect(data.expenseCategory.isPredefined).toBe(false);
      expect(mockSavedCategory.save).toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      const mockSavedCategory = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      mockExpenseCategory.findOne = jest.fn().mockResolvedValue(null);
      mockExpenseCategory.mockImplementation(() => mockSavedCategory as any);

      const mockReq = { json: () => Promise.resolve({ name: 'Test Category' }) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string; error: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.error).toBe('Save failed');
    });

    it('should handle database connection errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const mockReq = { json: () => Promise.resolve({ name: 'Test Category' }) } as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string; error: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.error).toBe('Connection failed');
    });

    it('should handle general server errors', async () => {
      const mockSession = { user: { id: 'user123' } };
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockDbConnect.mockResolvedValue({} as any);
      
      // Mock json() to throw an error
      const mockReq = { 
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as any as NextRequest;

      const response = await POST(mockReq);
      const data = await response.json() as { message: string; error: string };

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
      expect(data.error).toBe('Invalid JSON');
    });
  });
}); 