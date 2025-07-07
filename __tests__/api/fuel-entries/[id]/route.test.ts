/**
 * Fuel Entry [id] API Route Test Suite
 * Tests for API routes handling individual fuel entries CRUD operations
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, PUT, DELETE } from '../../../../app/api/fuel-entries/[id]/route';
import dbConnect from '../../../../app/lib/dbConnect';
import FuelEntry from '../../../../app/models/FuelEntry';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../../../app/lib/dbConnect');
jest.mock('../../../../app/models/FuelEntry', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockFuelEntry = FuelEntry as jest.Mocked<typeof FuelEntry>;

describe('/api/fuel-entries/[id]', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockEntryId = '507f1f77bcf86cd799439011';
  const mockFuelEntryData = {
    _id: mockEntryId,
    userId: 'user123',
    vehicleId: 'vehicle123',
    date: '2023-12-01',
    time: '10:00',
    odometer: 50000,
    tripDistance: 300,
    fuelAmount: 40,
    pricePerLiter: 1.5,
    totalCost: 60,
    fuelType: 'gasoline',
    fuelCompany: 'TestCompany',
    location: 'Test Location',
    notes: 'Test notes'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
    mockDbConnect.mockResolvedValue({} as any);
  });

  describe('GET', () => {
    it('should return fuel entry successfully', async () => {
      const request = new NextRequest('http://localhost/api/fuel-entries/123');
      const params = Promise.resolve({ id: mockEntryId });
      
      mockFuelEntry.findOne.mockResolvedValue(mockFuelEntryData as any);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.entry).toEqual(mockFuelEntryData);
      expect(mockFuelEntry.findOne).toHaveBeenCalledWith({ _id: mockEntryId, userId: 'user123' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when fuel entry is not found', async () => {
      mockFuelEntry.findOne.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Fuel entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockFuelEntry.findOne.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123');
      const params = Promise.resolve({ id: mockEntryId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });

  describe('PUT', () => {
    const updateData = {
      fuelAmount: 45,
      totalCost: 70,
      notes: 'Updated notes'
    };

    it('should update fuel entry successfully', async () => {
      const updatedEntry = { ...mockFuelEntryData, ...updateData };
      const mockToObject = jest.fn().mockReturnValue(updatedEntry);
      const mockUpdatedEntry = { ...updatedEntry, _id: { toString: () => mockEntryId }, toObject: mockToObject };
      
      mockFuelEntry.findOneAndUpdate.mockResolvedValue(mockUpdatedEntry as any);

      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Fuel entry updated successfully');
      expect(data.entry).toEqual({ ...updatedEntry, id: mockEntryId });
      expect(mockFuelEntry.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockEntryId, userId: 'user123' },
        { ...updateData, userId: 'user123' },
        { new: true, runValidators: true }
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
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
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: '' });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing or invalid entry ID');
    });

    it('should return 400 when entry ID is invalid format', async () => {
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: 'invalid-id' });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid entry ID format');
    });

    it('should return 404 when fuel entry is not found', async () => {
      mockFuelEntry.findOneAndUpdate.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Fuel entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockFuelEntry.findOneAndUpdate.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
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
    it('should delete fuel entry successfully', async () => {
      mockFuelEntry.findOneAndDelete.mockResolvedValue(mockFuelEntryData as any);

      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Fuel entry deleted successfully');
      expect(mockFuelEntry.findOneAndDelete).toHaveBeenCalledWith({ _id: mockEntryId, userId: 'user123' });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 400 when entry ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: '' });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing or invalid entry ID');
    });

    it('should return 400 when entry ID is invalid format', async () => {
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: 'invalid-id' });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid entry ID format');
    });

    it('should return 404 when fuel entry is not found', async () => {
      mockFuelEntry.findOneAndDelete.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockEntryId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Fuel entry not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockFuelEntry.findOneAndDelete.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/fuel-entries/123', {
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