/**
 * Vehicle [id] API Route Test Suite
 * Tests for API routes handling individual vehicle CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { GET, PUT, DELETE } from '../../../../app/api/vehicles/[id]/route';
import dbConnect from '../../../../app/lib/dbConnect';
import Vehicle from '../../../../app/models/Vehicle';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('../../../../app/lib/dbConnect');
jest.mock('../../../../app/models/Vehicle', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockVehicle = Vehicle as jest.Mocked<typeof Vehicle>;

describe('/api/vehicles/[id]', () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockVehicleId = '507f1f77bcf86cd799439011';
  const mockVehicleData = {
    _id: mockVehicleId,
    userId: 'user123',
    name: 'Test Vehicle',
    vehicleType: 'car',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    photo: 'test-photo.jpg',
    dateAdded: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: mockUser } as any);
    mockDbConnect.mockResolvedValue({} as any);
  });

  describe('GET', () => {
    it('should return vehicle successfully', async () => {
      const request = new NextRequest('http://localhost/api/vehicles/123');
      const params = Promise.resolve({ id: mockVehicleId });
      
      mockVehicle.findOne.mockResolvedValue(mockVehicleData as any);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.vehicle).toEqual({ ...mockVehicleData, id: mockVehicleId });
      expect(mockVehicle.findOne).toHaveBeenCalledWith({
        $or: [
          { _id: mockVehicleId, userId: 'user123' },
          { id: mockVehicleId, userId: 'user123' }
        ]
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123');
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when vehicle is not found', async () => {
      mockVehicle.findOne.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123');
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Vehicle not found');
    });

    it('should return 500 when database error occurs', async () => {
      mockVehicle.findOne.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/vehicles/123');
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Error fetching vehicle');
    });
  });

  describe('PUT', () => {
    const updateData = {
      name: 'Updated Vehicle Name',
      model: 'Updated Model',
      year: 2021
    };

    it('should update vehicle successfully', async () => {
      const updatedVehicle = { ...mockVehicleData, ...updateData };
      mockVehicle.findOneAndUpdate.mockResolvedValue(updatedVehicle as any);

      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Vehicle updated successfully');
      expect(data.vehicle).toEqual({ ...updatedVehicle, id: mockVehicleId });
      expect(mockVehicle.findOneAndUpdate).toHaveBeenCalledWith(
        {
          $or: [
            { _id: mockVehicleId, userId: 'user123' },
            { id: mockVehicleId, userId: 'user123' }
          ]
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when vehicle is not found', async () => {
      mockVehicle.findOneAndUpdate.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Vehicle not found or not authorized to update');
    });

    it('should return 500 when database error occurs', async () => {
      mockVehicle.findOneAndUpdate.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Error updating vehicle');
    });
  });

  describe('DELETE', () => {
    it('should delete vehicle successfully', async () => {
      mockVehicle.findOneAndDelete.mockResolvedValue(mockVehicleData as any);

      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Vehicle deleted successfully');
      expect(mockVehicle.findOneAndDelete).toHaveBeenCalledWith({
        $or: [
          { _id: mockVehicleId, userId: 'user123' },
          { id: mockVehicleId, userId: 'user123' }
        ]
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when vehicle is not found', async () => {
      mockVehicle.findOneAndDelete.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Vehicle not found or not authorized to delete');
    });

    it('should return 500 when database error occurs', async () => {
      mockVehicle.findOneAndDelete.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/vehicles/123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ id: mockVehicleId });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Error deleting vehicle');
    });
  });
}); 