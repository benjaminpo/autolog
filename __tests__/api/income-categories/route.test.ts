/**
 * Income Categories API Route Test Suite
 * Tests for API routes handling income categories CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, POST } from '../../../app/api/income-categories/route';
import dbConnect from '../../../app/lib/dbConnect';
import IncomeCategory from '../../../app/models/IncomeCategory';
import { predefinedIncomeCategories } from '../../../app/lib/predefinedData';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../../app/lib/dbConnect');
jest.mock('../../../app/models/IncomeCategory', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockIncomeCategory = IncomeCategory as jest.Mocked<typeof IncomeCategory>;

describe('/api/income-categories', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
    mockDbConnect.mockResolvedValue({} as any);
  });

  describe('GET', () => {
    it('should return user categories and predefined categories for authenticated user', async () => {
      const mockUserCategories = [
        { _id: 'cat1', userId: 'user123', name: 'Custom Category 1' },
        { _id: 'cat2', userId: 'user123', name: 'Custom Category 2' }
      ];

      mockIncomeCategory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUserCategories)
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incomeCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Custom Category 1' }),
          expect.objectContaining({ name: 'Custom Category 2' })
        ])
      );
      
      // Should include predefined categories not in user's list
      expect(data.incomeCategories).toEqual(
        expect.arrayContaining(
          predefinedIncomeCategories.map(name => 
            expect.objectContaining({ 
              name, 
              isPredefined: true,
              _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`
            })
          )
        )
      );
    });

    it('should return only predefined categories for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incomeCategories).toEqual(
        predefinedIncomeCategories.map(name => ({
          _id: `predefined-${name.replace(/\s+/g, '-').toLowerCase()}`,
          name,
          isPredefined: true
        }))
      );
    });

    it('should handle database errors gracefully', async () => {
      mockIncomeCategory.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Error getting income categories');
    });

    it('should filter out predefined categories already in user categories', async () => {
      const mockUserCategories = [
        { _id: 'cat1', userId: 'user123', name: predefinedIncomeCategories[0] }, // First predefined category
        { _id: 'cat2', userId: 'user123', name: 'Custom Category' }
      ];

      mockIncomeCategory.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUserCategories)
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Should not have duplicate of the first predefined category
      const categoryNames = data.incomeCategories.map((cat: any) => cat.name);
      const firstPredefinedCount = categoryNames.filter((name: string) => name === predefinedIncomeCategories[0]).length;
      expect(firstPredefinedCount).toBe(1);
    });
  });

  describe('POST', () => {
    it('should create new income category successfully', async () => {
      const mockSavedCategory = { _id: 'cat1', userId: 'user123', name: 'Custom Category' };
      
      mockIncomeCategory.findOne.mockResolvedValue(null);
      mockIncomeCategory.create.mockResolvedValue(mockSavedCategory as any);

      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Custom Category' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.incomeCategory).toEqual(mockSavedCategory);
      expect(mockIncomeCategory.create).toHaveBeenCalledWith({
        userId: 'user123',
        name: 'Custom Category'
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Custom Category' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Name is required');
    });

    it('should handle predefined category creation', async () => {
      const predefinedName = predefinedIncomeCategories[0];
      
      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({ name: predefinedName }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.incomeCategory).toEqual({
        _id: `predefined-${predefinedName.replace(/\s+/g, '-').toLowerCase()}`,
        userId: 'user123',
        name: predefinedName,
        isPredefined: true
      });
      expect(mockIncomeCategory.create).not.toHaveBeenCalled();
    });

    it('should return 409 when category already exists', async () => {
      const existingCategory = { _id: 'cat1', userId: 'user123', name: 'Existing Category' };
      
      mockIncomeCategory.findOne.mockResolvedValue(existingCategory as any);

      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Existing Category' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Income category already exists');
    });

    it('should handle database errors gracefully', async () => {
      mockIncomeCategory.findOne.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/income-categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Custom Category' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Error creating income category');
    });
  });
}); 