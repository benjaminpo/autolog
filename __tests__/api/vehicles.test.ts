import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/vehicles/route';
import { getServerSession } from "next-auth/next";
import dbConnect from '../../app/lib/dbConnect';

// Mock the dependencies
jest.mock("next-auth/next");
jest.mock('../../app/lib/dbConnect');

// Mock Vehicle module first
jest.mock('../../app/models/Vehicle', () => {
  const mockVehicle = jest.fn() as any;
  mockVehicle.find = jest.fn();
  mockVehicle.create = jest.fn();
  mockVehicle.findById = jest.fn();
  mockVehicle.findByIdAndUpdate = jest.fn();
  mockVehicle.findByIdAndDelete = jest.fn();
  return mockVehicle;
});

// Import the mocked Vehicle
import Vehicle from '../../app/models/Vehicle';
const mockVehicle = Vehicle as any;

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('/api/vehicles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue({} as any);
  });

  describe('GET /api/vehicles', () => {
    it('should return vehicles for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const mockVehicles = [
        {
          _id: 'vehicle1',
          userId: 'user123',
          name: 'Test Car',
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
          vehicleType: 'Car',
          toObject: jest.fn().mockReturnValue({
            _id: 'vehicle1',
            userId: 'user123',
            name: 'Test Car',
            brand: 'Toyota',
            model: 'Camry',
            year: 2020,
            vehicleType: 'Car'
          })
        }
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockVehicle.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVehicles)
      });

      const response = await GET();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.vehicles).toBeDefined();
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].id).toBe('vehicle1');
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockVehicle.find).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.message).toBe('Unauthorized');
    });

    it('should handle database errors', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockVehicle.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });

    it('should handle database connection failure', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });

    it('should properly format vehicle data with id field', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const mockVehicles = [
        {
          _id: 'vehicle1',
          userId: 'user123',
          name: 'Test Car',
          toObject: jest.fn().mockReturnValue({
            _id: 'vehicle1',
            userId: 'user123',
            name: 'Test Car'
          })
        }
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockVehicle.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockVehicles)
      });

      const response = await GET();
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.vehicles[0]).toHaveProperty('id', 'vehicle1');
      expect(result.vehicles[0]).toHaveProperty('_id', 'vehicle1');
    });
  });

  describe('POST /api/vehicles', () => {
    const validVehicleData = {
      name: 'Test Vehicle',
      brand: 'Toyota',
      model: 'Camry',
      year: 2020,
      vehicleType: 'Car',
      description: 'Test description'
    };

    it('should create a new vehicle with valid data', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const mockCreatedVehicle = {
        _id: 'newvehicle123',
        userId: 'user123',
        ...validVehicleData,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'newvehicle123',
          userId: 'user123',
          ...validVehicleData
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockVehicle.mockImplementation(() => mockCreatedVehicle);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(validVehicleData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.vehicle).toBeDefined();
      expect(result.vehicle.id).toBe('newvehicle123');
      expect(mockCreatedVehicle.save).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(validVehicleData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.message).toBe('Unauthorized');
    });

    it('should handle save errors', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const mockCreatedVehicle = {
        _id: 'newvehicle123',
        userId: 'user123',
        ...validVehicleData,
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
        toObject: jest.fn().mockReturnValue({
          _id: 'newvehicle123',
          userId: 'user123',
          ...validVehicleData
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockVehicle.mockImplementation(() => mockCreatedVehicle);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(validVehicleData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });

    it('should handle invalid JSON', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });

    it('should create vehicle with minimal required data', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      const minimalVehicleData = {
        name: 'Minimal Vehicle',
        brand: 'Honda',
        model: 'Civic',
        year: 2021,
        vehicleType: 'Car'
      };

      const mockCreatedVehicle = {
        _id: 'newvehicle123',
        userId: 'user123',
        ...minimalVehicleData,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'newvehicle123',
          userId: 'user123',
          ...minimalVehicleData
        })
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockVehicle.mockImplementation(() => mockCreatedVehicle);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(minimalVehicleData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.vehicle.name).toBe('Minimal Vehicle');
    });

    it('should handle database connection errors during creation', async () => {
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' }
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const mockRequest = {
        json: jest.fn().mockResolvedValue(validVehicleData)
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error');
    });
  });
}); 