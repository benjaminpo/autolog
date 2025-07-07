/**
 * Expense Entry [id] API Route Test Suite
 * Tests for API routes handling individual expense entries CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, PUT, DELETE } from '../../../../app/api/expense-entries/[id]/route';
import dbConnect from '../../../../app/lib/dbConnect';
import ExpenseEntry from '../../../../app/models/ExpenseEntry';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../../../app/lib/dbConnect');
jest.mock('../../../../app/models/ExpenseEntry', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockExpenseEntry = ExpenseEntry as jest.Mocked<typeof ExpenseEntry>;

describe('/api/expense-entries/[id]', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockEntryId = '507f1f77bcf86cd799439011';
  const mockExpenseEntryData = {
    _id: mockEntryId,
    userId: 'user123',
    vehicleId: 'vehicle123',
    date: '2023-12-01',
    amount: 100.50,
    category: 'Maintenance',
    description: 'Oil change',
    receipt: 'receipt123.jpg',
    notes: 'Regular maintenance'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
    mockDbConnect.mockResolvedValue({} as any);
  });

  describe('GET', () => {
    it('should return expense entry successfully', async () => {
      const request = new NextRequest('http://localhost/api/expense-entries/123');
      const params = Promise.resolve({ id: mockEntryId });
      
      mockExpenseEntry.findOne.mockResolvedValue(mockExpenseEntryData as any);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entry).toEqual(mockExpenseEntryData);
      expect(mockExpenseEntry.findOne).toHaveBeenCalledWith({ _id: mockEntryId, userId: 'user123' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when entry ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/expense-entries/123');
      const params = Promise.resolve({ id: '' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing entry ID');
    });

    it('should return 404 when expense entry is not found', async () => {
      mockExpenseEntry.findOne.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Expense entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockExpenseEntry.findOne.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/expense-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('PUT', () => {
    const updateData = {
      amount: 120.75,
      description: 'Updated description',
      notes: 'Updated notes'
    };

    it('should update expense entry successfully', async () => {
      const updatedEntry = { ...mockExpenseEntryData, ...updateData };
      
      mockExpenseEntry.findOneAndUpdate.mockResolvedValue(updatedEntry as any);

      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Expense entry updated successfully');
      expect(data.entry).toEqual(updatedEntry);
      expect(mockExpenseEntry.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockEntryId, userId: 'user123' },
        { ...updateData, userId: 'user123' },
        { new: true, runValidators: true }
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when entry ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: '' });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing entry ID');
    });

    it('should return 404 when expense entry is not found', async () => {
      mockExpenseEntry.findOneAndUpdate.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Expense entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockExpenseEntry.findOneAndUpdate.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('should delete expense entry successfully', async () => {
      mockExpenseEntry.findOneAndDelete.mockResolvedValue(mockExpenseEntryData as any);

      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Expense entry deleted successfully');
      expect(mockExpenseEntry.findOneAndDelete).toHaveBeenCalledWith({ _id: mockEntryId, userId: 'user123' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when entry ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: '' });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing entry ID');
    });

    it('should return 404 when expense entry is not found', async () => {
      mockExpenseEntry.findOneAndDelete.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Expense entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockExpenseEntry.findOneAndDelete.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/expense-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
}); 